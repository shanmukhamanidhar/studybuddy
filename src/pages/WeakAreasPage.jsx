import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useAuth } from "../context/AuthContext";
import { useSubjects } from "../hooks/useSubjects";
import { useGamification } from "../hooks/useGamification";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, doc } from "firebase/firestore";
import { aggregatePerformanceData, computeStrengthScores, analyzeWeakAreas } from "../utils/weakAreas";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { WeakAreasSkeleton } from "../components/studyspace/SkeletonLoader";

const GOLD = "#D4A017";
const FONT = "'Space Grotesk', sans-serif";

function SeverityBadge({ severity }) {
  const styles = {
    high: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", color: "#EF4444" },
    medium: { bg: "rgba(212,160,23,0.12)", border: "rgba(212,160,23,0.3)", color: GOLD },
    low: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", color: "#3B82F6" },
  };
  const s = styles[severity] || styles.medium;
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", backgroundColor: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {severity}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return <SeverityBadge severity={priority} />;
}

function RadarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #333", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#FAFAFA" }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{payload[0]?.payload?.subject}</div>
      <div style={{ color: GOLD }}>Strength: {payload[0]?.value}/100</div>
    </div>
  );
}

export default function WeakAreasPage() {
  const { currentUser, userProfile } = useAuth();
  const { subjects } = useSubjects(currentUser?.uid);
  const { gamification } = useGamification(currentUser?.uid);
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [marks, setMarks] = useState({});
  const [dataLoading, setDataLoading] = useState(true);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    setDataLoading(true);
    let loaded = 0;
    const checkDone = () => { loaded++; if (loaded === 3) setDataLoading(false); };

    const unsubSessions = onSnapshot(
      query(collection(db, "users", currentUser.uid, "studySessions"), orderBy("createdAt", "desc")),
      (snap) => { setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); },
      () => checkDone()
    );
    const unsubQuizzes = onSnapshot(
      query(collection(db, "users", currentUser.uid, "practiceHistory"), orderBy("createdAt", "desc")),
      (snap) => { setQuizzes(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); },
      () => checkDone()
    );
    const unsubAssignments = onSnapshot(
      query(collection(db, "users", currentUser.uid, "assignments"), orderBy("createdAt", "desc")),
      (snap) => { setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))); checkDone(); },
      () => checkDone()
    );

    return () => { unsubSessions(); unsubQuizzes(); unsubAssignments(); };
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      if (snap.exists()) setMarks(snap.data().marks || {});
    });
    return () => unsub();
  }, [currentUser?.uid]);

  const perfData = useMemo(() => {
    if (subjects.length === 0) return [];
    const raw = aggregatePerformanceData({ subjects, sessions, quizzes, assignments, marks, gamification });
    return computeStrengthScores(raw);
  }, [subjects, sessions, quizzes, assignments, marks, gamification]);

  const radarData = useMemo(() => {
    return perfData.map((s) => ({
      subject: s.name.length > 12 ? s.name.slice(0, 11) + "…" : s.name,
      fullName: s.name,
      score: s.strengthScore,
      fullMark: 100,
    }));
  }, [perfData]);

  const totalQuizzes = quizzes.filter((q) => q.type === "quiz").length;
  const totalExams = quizzes.filter((e) => e.type === "exam").length;
  const totalSessions = sessions.length;
  const overallAccuracy = gamification.totalQuizzes > 0
    ? Math.round(((gamification.totalCorrect || 0) / gamification.totalQuizzes) * 100)
    : 0;

  const handleAnalyze = useCallback(async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await analyzeWeakAreas(perfData, userProfile);
      setAiAnalysis(result);
    } catch (err) {
      setAiError(err.message || "Failed to analyze weak areas");
    } finally {
      setAiLoading(false);
    }
  }, [perfData, userProfile]);

  const weakestSubjects = useMemo(() => {
    return [...perfData].sort((a, b) => a.strengthScore - b.strengthScore).slice(0, 3);
  }, [perfData]);

  const strongestSubjects = useMemo(() => {
    return [...perfData].sort((a, b) => b.strengthScore - a.strengthScore).slice(0, 3);
  }, [perfData]);

  if (dataLoading) {
    return (
      <SidebarLayout>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px" }}>
          <WeakAreasSkeleton />
        </div>
      </SidebarLayout>
    );
  }

  if (perfData.length === 0) {
    return (
      <SidebarLayout>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px", color: "#FAFAFA" }}>
          <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", color: GOLD, fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            AI-Powered
          </div>
          <h1 style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, margin: "0 0 6px" }}>Weak Areas</h1>
          <p style={{ color: "#888", fontSize: 15, margin: "0 0 32px" }}>Analyze your performance and get personalized recommendations</p>
          <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 16, padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px", color: "#FAFAFA" }}>No subjects yet</h3>
            <p style={{ color: "#888", fontSize: 14, margin: "0 0 20px" }}>Add courses and complete some study sessions, quizzes, or assignments to see your weak area analysis.</p>
            <button onClick={() => navigate("/courses")} style={{ padding: "12px 28px", borderRadius: 10, backgroundColor: GOLD, color: "#0A0A0A", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: FONT }}>
              Add Courses
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px", color: "#FAFAFA" }}>
        <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", color: GOLD, fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
          AI-Powered
        </div>
        <h1 style={{ fontFamily: FONT, fontSize: 32, fontWeight: 700, margin: "0 0 6px" }}>Weak Areas</h1>
        <p style={{ color: "#888", fontSize: 15, margin: "0 0 32px" }}>Performance analysis across your {perfData.length} subject{perfData.length !== 1 ? "s" : ""}</p>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { label: "Overall Accuracy", value: `${overallAccuracy}%`, color: overallAccuracy >= 70 ? "#10B981" : overallAccuracy >= 50 ? GOLD : "#EF4444" },
            { label: "Quizzes Taken", value: totalQuizzes, color: "#3B82F6" },
            { label: "Exams Completed", value: totalExams, color: "#8B5CF6" },
            { label: "Study Sessions", value: totalSessions, color: "#EC4899" },
            { label: "Subjects", value: perfData.length, color: GOLD },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 14, padding: "18px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: stat.color, fontFamily: FONT }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Radar Chart + Subject Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          {/* Radar Chart */}
          <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 16, padding: "20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 12px", paddingLeft: 8 }}>Strength Map</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#222" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#888", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#555", fontSize: 10 }} />
                <Radar name="Strength" dataKey="score" stroke={GOLD} fill={GOLD} fillOpacity={0.2} strokeWidth={2} />
                <Tooltip content={<RadarTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Subject Breakdown */}
          <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 16, padding: 20, overflowY: "auto", maxHeight: 360 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 14px" }}>Subject Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {perfData.sort((a, b) => a.strengthScore - b.strengthScore).map((s) => {
                const barColor = s.strengthScore >= 70 ? "#10B981" : s.strengthScore >= 50 ? GOLD : "#EF4444";
                return (
                  <div key={s.id} style={{ padding: "12px 14px", borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #1C1C1C" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA" }}>{s.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: barColor, fontFamily: FONT }}>{s.strengthScore}/100</span>
                    </div>
                    <div style={{ height: 6, backgroundColor: "#1C1C1C", borderRadius: 3, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.strengthScore}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ height: "100%", backgroundColor: barColor, borderRadius: 3 }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "#666" }}>
                      {s.quizPct !== null && <span>Quiz: {Math.round(s.quizPct)}%</span>}
                      {s.examPct !== null && <span>Exam: {Math.round(s.examPct)}%</span>}
                      <span>Study: {s.totalStudyMinutes}m</span>
                      <span>Tasks: {s.assignmentDone}/{s.assignmentTotal}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Weakest & Strongest */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 14px" }}>Needs Attention</h3>
            {weakestSubjects.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, backgroundColor: "#0D0D0D", border: "1px solid #1C1C1C", marginBottom: i < weakestSubjects.length - 1 ? 8 : 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#EF4444", flexShrink: 0 }}>#{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{s.quizPct !== null ? `${Math.round(s.quizPct)}% quiz accuracy` : "No quiz data"}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#EF4444", fontFamily: FONT }}>{s.strengthScore}</div>
              </div>
            ))}
          </div>
          <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 16, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#10B981", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 14px" }}>Strongest Subjects</h3>
            {strongestSubjects.map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 8, backgroundColor: "#0D0D0D", border: "1px solid #1C1C1C", marginBottom: i < strongestSubjects.length - 1 ? 8 : 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(16,185,129,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#10B981", flexShrink: 0 }}>#{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{s.quizPct !== null ? `${Math.round(s.quizPct)}% quiz accuracy` : "No quiz data"}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#10B981", fontFamily: FONT }}>{s.strengthScore}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis Section */}
        <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px", fontFamily: FONT }}>AI Deep Analysis</h3>
              <p style={{ fontSize: 13, color: "#888", margin: 0 }}>Get personalized recommendations based on your complete performance data</p>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={aiLoading}
              style={{
                padding: "10px 22px", borderRadius: 10, border: "none", cursor: aiLoading ? "wait" : "pointer",
                backgroundColor: aiLoading ? "#333" : GOLD, color: aiLoading ? "#888" : "#0A0A0A",
                fontWeight: 700, fontSize: 13, fontFamily: FONT, transition: "all 0.15s", flexShrink: 0,
              }}
            >
              {aiLoading ? "Analyzing…" : aiAnalysis ? "Re-analyze" : "Run Analysis"}
            </button>
          </div>

          {aiError && (
            <div style={{ padding: "14px 18px", borderRadius: 10, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#EF4444", fontWeight: 600 }}>{aiError}</div>
            </div>
          )}

          {aiLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ padding: 16, borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #1C1C1C" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#1C1C1C", animation: "pulse 1.5s infinite" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 14, backgroundColor: "#1C1C1C", borderRadius: 6, width: "60%", marginBottom: 6, animation: "pulse 1.5s infinite" }} />
                      <div style={{ height: 10, backgroundColor: "#1C1C1C", borderRadius: 6, width: "40%", animation: "1.5s infinite" }} />
                    </div>
                  </div>
                  <div style={{ height: 10, backgroundColor: "#1C1C1C", borderRadius: 6, width: "90%", marginBottom: 6, animation: "pulse 1.5s infinite" }} />
                  <div style={{ height: 10, backgroundColor: "#1C1C1C", borderRadius: 6, width: "75%", animation: "pulse 1.5s infinite" }} />
                </div>
              ))}
            </div>
          )}

          {!aiLoading && !aiAnalysis && (
            <div style={{ textAlign: "center", padding: "32px 20px", backgroundColor: "#0D0D0D", borderRadius: 12, border: "1px dashed #2B2B2B" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🤖</div>
              <p style={{ color: "#888", fontSize: 14, margin: "0 0 4px" }}>Click "Run Analysis" to get AI-powered insights</p>
              <p style={{ color: "#555", fontSize: 12, margin: 0 }}>This analyzes your quizzes, exams, study time, and assignments</p>
            </div>
          )}

          {!aiLoading && aiAnalysis && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Study Plan */}
              {aiAnalysis.studyPlan && (
                <div style={{ padding: 18, borderRadius: 12, backgroundColor: "rgba(212,160,23,0.06)", border: "1px solid rgba(212,160,23,0.2)" }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 12px" }}>Your Focus Plan</h4>
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Priority Subject</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#FAFAFA" }}>{aiAnalysis.studyPlan.focusSubject}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Daily Focus</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#FAFAFA" }}>{aiAnalysis.studyPlan.dailyMinutes} min</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Weekly Goal</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#FAFAFA" }}>{aiAnalysis.studyPlan.weeklyGoal}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Weak Areas */}
              {aiAnalysis.topWeakAreas?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 12px" }}>Top Weak Areas</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {aiAnalysis.topWeakAreas.map((area, i) => (
                      <div key={i} style={{ padding: "14px 16px", borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #1C1C1C" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                          <SeverityBadge severity={area.severity} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>{area.topic}</span>
                          <span style={{ fontSize: 12, color: "#888", marginLeft: "auto" }}>{area.subject}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#A3A3A3", margin: "0 0 8px", lineHeight: 1.5 }}>{area.reason}</p>
                        <div style={{ fontSize: 13, color: "#10B981", fontWeight: 600 }}>→ {area.action}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {aiAnalysis.recommendations?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 12px" }}>Recommendations</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                    {aiAnalysis.recommendations.map((rec, i) => (
                      <div key={i} style={{ padding: 16, borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #1C1C1C" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                          <PriorityBadge priority={rec.priority} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>{rec.title}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#A3A3A3", margin: "0 0 8px", lineHeight: 1.5 }}>{rec.description}</p>
                        <div style={{ fontSize: 12, color: "#888" }}>Impact: {rec.impact}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Per-subject verdicts */}
              {aiAnalysis.subjects?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 12px" }}>Subject Verdicts</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
                    {aiAnalysis.subjects.map((s, i) => (
                      <div key={i} style={{ padding: 14, borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #1C1C1C" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>{s.name}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: s.strengthScore >= 70 ? "#10B981" : s.strengthScore >= 50 ? GOLD : "#EF4444", fontFamily: FONT }}>{s.strengthScore}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#A3A3A3", margin: "0 0 8px", fontStyle: "italic" }}>"{s.verdict}"</p>
                        {s.strengths?.length > 0 && (
                          <div style={{ marginBottom: 6 }}>
                            <span style={{ fontSize: 11, color: "#10B981", fontWeight: 700 }}>Strengths: </span>
                            <span style={{ fontSize: 12, color: "#888" }}>{s.strengths.join(", ")}</span>
                          </div>
                        )}
                        {s.weaknesses?.length > 0 && (
                          <div>
                            <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 700 }}>Weaknesses: </span>
                            <span style={{ fontSize: 12, color: "#888" }}>{s.weaknesses.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => navigate("/practice")} style={{ padding: "12px 24px", borderRadius: 10, backgroundColor: GOLD, color: "#0A0A0A", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", fontFamily: FONT, transition: "transform 0.15s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"} onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
            Practice Weak Topics
          </button>
          <button onClick={() => navigate("/courses")} style={{ padding: "12px 24px", borderRadius: 10, backgroundColor: "transparent", border: "1px solid #333", color: "#FAFAFA", fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: FONT }}>
            Review Courses
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </SidebarLayout>
  );
}
