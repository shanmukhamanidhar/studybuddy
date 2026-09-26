import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useSubjects } from "../hooks/useSubjects";
import { useStudySessions } from "../hooks/useStudySessions";
import { useGamification } from "../hooks/useGamification";
import PomodoroTimer from "../components/PomodoroTimer";
import SessionReflection from "../components/SessionReflection";
import RoadmapVisual from "../components/RoadmapVisual";
import Logo from "../components/Logo";
import { generateDailyPlan } from "../utils/dailyPlan";
import { generateRoadmap } from "../utils/roadmap";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp, query, onSnapshot, orderBy } from "firebase/firestore";
import {
  Rocket, Backpack, Crosshair, Flame, Signpost,
  RotateCcw, Save, CalendarClock, ChevronLeft, ChevronRight,
  ArrowRight, Lamp, Dices, Swords, WandSparkles,
  Globe, ScrollText, Gem, Loader2, AlertCircle, PartyPopper, Atom,
  BookOpen, ClipboardCheck, Skull, Clock, FileCheck, LayoutDashboard,
} from "lucide-react";
import { SubjectCardSkeleton, StatsRowSkeleton } from "../components/studyspace/SkeletonLoader";
import LevelUpPopup from "../components/gamification/LevelUpPopup";
import XpGainToast from "../components/gamification/XpGainToast";
import DailyLoginPopup from "../components/gamification/DailyLoginPopup";

const GOLD = "#D4A017";

const FONT = "'Space Grotesk', system-ui, sans-serif";

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

const card = {
  backgroundColor: "var(--color-surface, #111111)",
  border: "1px solid var(--color-border, #1E1E1E)",
  borderRadius: 20,
  boxShadow: "0 8px 32px var(--color-shadow, rgba(0,0,0,0.35))",
};

const cardHover = {
  ...card,
  transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
};

export default function HomePage() {
  const { currentUser, userProfile } = useAuth();
  const { subjects, updateSubject } = useSubjects(currentUser?.uid);
  const { sessions, saveSession } = useStudySessions(currentUser?.uid);
  const { award, level, levelData, streak: userStreak, levelUpInfo, dismissLevelUp, xpToast } = useGamification(currentUser?.uid);
  const navigate = useNavigate();

  const name = userProfile?.aboutYou?.preferredName || currentUser?.displayName || userProfile?.displayName || "Student";
  const greeting = getTimeGreeting();

  const [topicPreference, setTopicPreference] = useState("");
  const [dailyPlan, setDailyPlan] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);

  const [showTimer, setShowTimer] = useState(false);
  const [activeSubjectId, setActiveSubjectId] = useState("");
  const [activeSubjectName, setActiveSubjectName] = useState("General Focus");

  const [showReflection, setShowReflection] = useState(false);
  const [completedSessionData, setCompletedSessionData] = useState(null);

  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState(null);
  const [roadmapSaved, setRoadmapSaved] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedCalDate, setSelectedCalDate] = useState(null);

  const [showDailyLogin, setShowDailyLogin] = useState(false);
  const [dailyLoginXp, setDailyLoginXp] = useState(2);
  const [isNewUserPopup, setIsNewUserPopup] = useState(false);

  // Award daily login XP on mount and show popup if first login today
  useEffect(() => {
    if (!currentUser?.uid) return;
    const todayKey = new Date().toISOString().split("T")[0];
    const popupKey = `dailyLoginPopup_${currentUser.uid}_${todayKey}`;
    const alreadyShown = localStorage.getItem(popupKey);
    if (alreadyShown) return;
    (async () => {
      const result = await award("daily_login", {});
      if (result) {
        setDailyLoginXp(result.xpGained || 2);
        setIsNewUserPopup(!userProfile?.onboardingCompleted);
        setShowDailyLogin(true);
        localStorage.setItem(popupKey, "1");
      }
    })();
  }, [currentUser?.uid]);

  const handleDismissDailyLogin = useCallback(() => {
    setShowDailyLogin(false);
  }, []);

  useEffect(() => {
    if (!currentUser?.uid) return;
    const unsubA = onSnapshot(query(collection(db, "users", currentUser.uid, "assignments"), orderBy("createdAt", "desc")), (snap) => setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {});
    const unsubE = onSnapshot(query(collection(db, "users", currentUser.uid, "exams"), orderBy("date", "asc")), (snap) => setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {});
    return () => { unsubA(); unsubE(); };
  }, [currentUser?.uid]);

  const calEvents = useMemo(() => {
    const map = {};
    assignments.forEach((a) => { const d = a.deadline; if (!d) return; if (!map[d]) map[d] = []; map[d].push({ type: "assignment", title: a.title, priority: a.priority, status: a.status, color: a.status === "Done" ? "#10B981" : a.priority === "High" ? "#EF4444" : a.priority === "Low" ? "#3B82F6" : GOLD }); });
    exams.forEach((e) => { const d = e.date; if (!d) return; if (!map[d]) map[d] = []; map[d].push({ type: "exam", title: e.title, subject: e.subjectName, color: "#8B5CF6" }); });
    return map;
  }, [assignments, exams]);

  const upcomingEvents = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const future = new Date(today); future.setDate(future.getDate() + 30);
    const todayStr = today.toISOString().split("T")[0];
    const futureStr = future.toISOString().split("T")[0];
    const events = [];
    assignments.forEach((a) => { if (a.deadline >= todayStr && a.deadline <= futureStr) { events.push({ date: a.deadline, type: "assignment", title: a.title, priority: a.priority, daysLeft: Math.ceil((new Date(a.deadline) - today) / 86400000), status: a.status }); } });
    exams.forEach((e) => { if (e.date >= todayStr && e.date <= futureStr) { events.push({ date: e.date, type: "exam", title: e.title, subject: e.subjectName, daysLeft: Math.ceil((new Date(e.date) - today) / 86400000) }); } });
    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  }, [assignments, exams]);

  const calGrid = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = []; for (let i = 0; i < firstDay; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(d); return cells;
  }, [calMonth, calYear]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selectedDateStr = selectedCalDate ? `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(selectedCalDate).padStart(2, "0")}` : null;
  const selectedEvents = selectedDateStr ? (calEvents[selectedDateStr] || []) : [];
  const activeSubject = subjects.find((s) => s.id === activeSubjectId);
  const todayKey = new Date().toDateString();
  const todaysSessions = sessions.filter((s) => { const d = s.createdAt?.toDate?.(); return d && d.toDateString() === todayKey; });

  const handleGeneratePlan = async () => { setIsGeneratingPlan(true); setPlanError(null); try { const plan = await generateDailyPlan(userProfile, subjects, sessions, topicPreference); setDailyPlan(plan); } catch (err) { setPlanError(err.message || "Failed to generate plan"); } finally { setIsGeneratingPlan(false); } };
  const handleStartSession = (subjectId, subjectName) => { setActiveSubjectId(subjectId || ""); setActiveSubjectName(subjectName || "General Focus"); setShowTimer(true); };
  const handleSessionComplete = useCallback(async (sessionInfo) => {
    setCompletedSessionData({ ...sessionInfo, subjectId: activeSubjectId, subjectName: activeSubjectName });
    setShowTimer(false);
    setShowReflection(true);
    if (activeSubjectId && activeSubject) {
      await updateSubject(activeSubjectId, { totalStudyMinutes: (activeSubject.totalStudyMinutes || 0) + sessionInfo.actualMinutes, lastStudiedAt: new Date().toISOString() });
    }
    // Award XP for completing a study session
    award("session_complete", { difficulty: activeSubject?.difficulty || "Medium" });
  }, [activeSubjectId, activeSubject, updateSubject, activeSubjectName, award]);
  const handleSaveReflection = async (data) => {
    await saveSession({ type: "study", subjectId: data.subjectId, subjectName: data.subjectName, plannedMinutes: data.plannedMinutes, actualMinutes: data.actualMinutes, learned: data.learned, wishedLearned: data.wishedLearned, dailyPlanSnapshot: dailyPlan ? { summary: dailyPlan.summary, blocks: dailyPlan.blocks?.map((b) => ({ subject: b.subject, topic: b.topic })) } : null });
    // Award XP for writing a reflection
    if (data.learned) {
      award("session_reflection", {});
    }
    setShowReflection(false);
    setCompletedSessionData(null);
  };
  const handleSuggestQuiz = () => { setShowReflection(false); navigate("/practice", { state: { topic: completedSessionData?.subjectName || "" } }); setCompletedSessionData(null); };
  const handleGenerateRoadmap = async () => { setIsGeneratingRoadmap(true); setRoadmapError(null); setRoadmapSaved(false); try { const roadmap = await generateRoadmap(userProfile, subjects, sessions, topicPreference); setActiveRoadmap(roadmap); } catch (err) { setRoadmapError(err.message || "Failed to generate roadmap"); } finally { setIsGeneratingRoadmap(false); } };
  const handleSaveRoadmap = async () => { if (!activeRoadmap || !currentUser?.uid) return; try { await addDoc(collection(db, "users", currentUser.uid, "roadmaps"), { ...activeRoadmap, createdAt: serverTimestamp() }); setRoadmapSaved(true); } catch (err) { console.error(err); } };
  const handleToggleRoadmapNode = (nodeId, newStatus) => { setActiveRoadmap((prev) => { if (!prev) return prev; return { ...prev, nodes: prev.nodes.map((n) => n.id === nodeId ? { ...n, status: newStatus } : n) }; }); };

  const SectionLabel = ({ icon: Icon, text, color = GOLD }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={15} color={color} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{text}</span>
    </div>
  );

  return (
    <SidebarLayout>
      <div style={{ position: "relative", minHeight: "100vh" }}>
        {/* Notebook background */}
        <div className="notebook-bg" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0 }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 980, margin: "0 auto", padding: "48px 32px 80px" }}>

          {/* SKELETON LOADING STATE */}
          {subjects === undefined && (
            <>
              <div style={{ marginBottom: 40 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#1C1C1C", animation: "skeleton-pulse 1.6s ease-in-out infinite" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ width: 280, height: 32, borderRadius: 8, backgroundColor: "#1C1C1C", animation: "skeleton-pulse 1.6s ease-in-out infinite" }} />
                    <div style={{ width: 180, height: 14, borderRadius: 6, backgroundColor: "#1C1C1C", marginTop: 8, animation: "skeleton-pulse 1.6s ease-in-out infinite" }} />
                  </div>
                </div>
              </div>
              <StatsRowSkeleton count={3} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 48 }}>
                {Array.from({ length: 3 }).map((_, i) => <SubjectCardSkeleton key={i} />)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                {Array.from({ length: 3 }).map((_, i) => <SubjectCardSkeleton key={i} />)}
              </div>
            </>
          )}

          {/* HERO */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              <Logo size={44} />
              <div style={{ flex: 1 }}>
                <h1 style={{ fontFamily: FONT, fontSize: "clamp(30px, 5vw, 42px)", fontWeight: 700, color: "var(--color-text, #FAFAFA)", margin: 0, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 12 }}>
                  {greeting}, {name}. <PartyPopper size={28} color={GOLD} style={{ opacity: 0.7 }} />
                </h1>
                <p style={{ color: "var(--color-muted, #777)", fontSize: 15, margin: "4px 0 0", fontWeight: 500 }}>
                  {subjects.length > 0 ? `${subjects.length} subject${subjects.length !== 1 ? "s" : ""} enrolled` : "Welcome to StudyBuddy"}
                  {todaysSessions.length > 0 && ` · ${todaysSessions.length} session${todaysSessions.length !== 1 ? "s" : ""} today`}
                </p>
              </div>
              <button onClick={() => navigate("/dashboard")} style={{ padding: "10px 18px", borderRadius: 10, backgroundColor: "transparent", border: "1px solid var(--color-border, #333)", color: "var(--color-text, #FAFAFA)", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", transition: "border-color 0.2s, background-color 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.backgroundColor = "rgba(212,160,23,0.08)"; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border, #333)"; e.currentTarget.style.backgroundColor = "transparent"; }}>
                <LayoutDashboard size={15} /> Dashboard
              </button>
            </div>
          </motion.div>

          {/* GAMIFICATION STATS ROW */}
          {userStreak > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 32 }}>
              {[
                { icon: "🔥", label: "Streak", value: `${userStreak} day${userStreak !== 1 ? "s" : ""}`, color: "#EF4444" },
                { icon: "⚡", label: "Level", value: `Lv.${level}`, color: "#D4A017" },
                { icon: "🎯", label: "Sessions", value: todaysSessions.length, color: "#10B981" },
              ].map((stat) => (
                <div key={stat.label} style={{ ...card, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12, borderRadius: 14 }}>
                  <span style={{ fontSize: 22 }}>{stat.icon}</span>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: stat.color, fontFamily: FONT }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted, #888)" }}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* GENERATORS */}
          {!showTimer && !dailyPlan && !activeRoadmap && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 }} style={{ marginBottom: 40, display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Today's Mission */}
              <div style={{ ...card, padding: "40px 44px", textAlign: "center" }}>
                <SectionLabel icon={Rocket} text="Today's Mission" />
                <h2 style={{ fontFamily: FONT, fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 700, color: "var(--color-text, #FAFAFA)", margin: "10px 0 6px" }}>What should you study today?</h2>
                <p style={{ color: "var(--color-muted, #777)", fontSize: 14, margin: "0 0 28px" }}>AI-powered study plan based on your subjects, goals & past sessions.</p>
                <button onClick={handleGeneratePlan} disabled={isGeneratingPlan} style={{ padding: "14px 36px", borderRadius: 12, backgroundColor: GOLD, color: "#0A0A0A", fontWeight: 700, fontSize: 15, fontFamily: FONT, border: "none", cursor: isGeneratingPlan ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 10, opacity: isGeneratingPlan ? 0.7 : 1, transition: "opacity 0.2s" }}>
                  {isGeneratingPlan ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><Rocket size={18} /> Generate Today's Task</>}
                </button>
                {planError && <div style={{ padding: "10px 16px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 13, marginTop: 16, maxWidth: 500, marginInline: "auto" }}><AlertCircle size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{planError}</div>}
                {subjects.length === 0 && <p style={{ color: "var(--color-muted, #555)", fontSize: 13, marginTop: 14 }}>Add subjects in <span onClick={() => navigate("/courses")} style={{ color: GOLD, cursor: "pointer", textDecoration: "underline" }}>Courses</span> to get personalized plans.</p>}
              </div>

              {/* Learning Roadmap */}
              <div style={{ ...card, padding: "28px 32px" }}>
                <SectionLabel icon={Signpost} text="Learning Roadmap" color="#F97316" />
                <h3 style={{ fontFamily: FONT, fontSize: 18, fontWeight: 700, color: "var(--color-text, #FAFAFA)", margin: "6px 0 4px" }}>Generate a Full Learning Path</h3>
                <p style={{ color: "var(--color-muted, #777)", fontSize: 13, margin: "0 0 16px" }}>Enter a topic — get a visual roadmap with milestones, dependencies & resources.</p>
                <div style={{ display: "flex", gap: 12 }} className="plan-input-grid">
                  <input type="text" placeholder='e.g., "Full Stack Web Development" or "Operating Systems"' value={topicPreference} onChange={(e) => setTopicPreference(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleGenerateRoadmap(); }} style={{ flex: 1, padding: "12px 16px", borderRadius: 10, backgroundColor: "var(--color-input, #0A0A0A)", border: "1px solid var(--color-border, #282828)", color: "var(--color-text, #FAFAFA)", fontSize: 14, outline: "none" }} />
                  <button onClick={handleGenerateRoadmap} disabled={isGeneratingRoadmap || !topicPreference.trim()} style={{ padding: "12px 24px", borderRadius: 10, backgroundColor: "transparent", border: "1px solid #F97316", color: "#F97316", fontWeight: 700, fontSize: 14, cursor: isGeneratingRoadmap || !topicPreference.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 8, opacity: isGeneratingRoadmap || !topicPreference.trim() ? 0.5 : 1 }}>
                    {isGeneratingRoadmap ? <><Loader2 size={16} className="animate-spin" /> Generating...</> : <><Signpost size={16} /> Generate Roadmap</>}
                  </button>
                </div>
                {roadmapError && <div style={{ padding: "10px 16px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 13, marginTop: 14 }}><AlertCircle size={14} style={{ marginRight: 6, verticalAlign: -2 }} />{roadmapError}</div>}
              </div>
            </motion.div>
          )}

          {/* TIMER */}
          {showTimer && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ ...card, padding: "40px", marginBottom: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ padding: "5px 14px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>
                <Flame size={13} /> Focus Session Active
              </div>
              <PomodoroTimer onComplete={handleSessionComplete} subjectName={activeSubjectName} />
            </motion.div>
          )}

          {/* DAILY PLAN */}
          {dailyPlan && !showTimer && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div style={{ ...card, padding: "28px 32px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ padding: "4px 12px", borderRadius: 6, backgroundColor: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981", fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 6 }}><Gem size={13} /> Plan Ready</div>
                  <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: "#FAFAFA", margin: "0 0 4px" }}>{dailyPlan.summary}</h2>
                  <p style={{ color: "#888", fontSize: 13, margin: 0 }}>Priority: {dailyPlan.prioritySubject} · {dailyPlan.totalEstimatedMinutes} min estimated</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setDailyPlan(null); setTopicPreference(""); }} style={{ padding: "10px 18px", borderRadius: 8, backgroundColor: "transparent", border: "1px solid #333", color: "#888", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><RotateCcw size={14} /> New Plan</button>
                  <button onClick={() => { const priority = dailyPlan.blocks?.[0]; handleStartSession(subjects.find((s) => s.name === priority?.subject)?.id, priority?.subject || "General Focus"); }} style={{ padding: "10px 20px", borderRadius: 8, backgroundColor: GOLD, color: "#0A0A0A", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Flame size={14} /> Start Study Session</button>
                </div>
              </div>

              {dailyPlan.blocks?.map((block, idx) => {
                const sub = subjects.find((s) => s.name === block.subject);
                return (
                  <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} style={{ ...card, padding: "24px 28px", marginBottom: 14, borderRadius: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: sub?.color || GOLD, backgroundColor: `${sub?.color || GOLD}15`, padding: "3px 8px", borderRadius: 4 }}>Block {idx + 1}</span>
                          <span style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {block.estimatedMinutes} min</span>
                        </div>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: "#FAFAFA", margin: 0 }}>{block.topic}</h3>
                        <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>{block.subject}</p>
                      </div>
                      <button onClick={() => handleStartSession(sub?.id, block.subject)} style={{ padding: "8px 16px", borderRadius: 8, backgroundColor: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", color: GOLD, fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Flame size={13} /> Start</button>
                    </div>
                    {block.subtopics?.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>{block.subtopics.map((st, i) => <span key={i} style={{ fontSize: 11, color: "#AAA", backgroundColor: "#1A1A1A", padding: "4px 10px", borderRadius: 6, border: "1px solid #282828" }}>{st}</span>)}</div>}
                    {block.reason && <p style={{ fontSize: 12, color: "#666", margin: "0 0 10px", fontStyle: "italic", display: "flex", alignItems: "center", gap: 6 }}><Lamp size={13} /> {block.reason}</p>}
                    {block.resources?.length > 0 && <div><span style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 700 }}>Resources</span><div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>{block.resources.map((r, i) => <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#3B82F6", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>{r.type === "video" ? <Globe size={13} /> : r.type === "docs" ? <ScrollText size={13} /> : <BookOpen size={13} />}{r.title}</a>)}</div></div>}
                  </motion.div>
                );
              })}

              {dailyPlan.quizSuggestion && (
                <div style={{ ...card, padding: "20px 24px", marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, borderRadius: 16 }}>
                  <div><div style={{ fontSize: 12, color: GOLD, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}><Atom size={14} /> Quiz Suggestion</div><p style={{ fontSize: 14, color: "#FAFAFA", margin: "4px 0 0" }}>{dailyPlan.quizSuggestion}</p></div>
                  <button onClick={() => navigate("/practice")} style={{ padding: "10px 20px", borderRadius: 8, backgroundColor: GOLD, color: "#0A0A0A", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Dices size={14} /> Take Quiz</button>
                </div>
              )}
            </motion.div>
          )}

          {/* ROADMAP */}
          {activeRoadmap && !showTimer && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ marginBottom: 40 }}>
              <div style={{ ...card, padding: "28px 32px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                <div>
                  <div style={{ padding: "4px 12px", borderRadius: 6, backgroundColor: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", color: GOLD, fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 6 }}><Globe size={13} /> Roadmap Ready</div>
                  <h2 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: "#FAFAFA", margin: "0 0 4px" }}>{activeRoadmap.title}</h2>
                  <p style={{ color: "#888", fontSize: 13, margin: 0 }}>{activeRoadmap.description}{activeRoadmap.totalEstimatedHours && ` · ~${activeRoadmap.totalEstimatedHours}h total`}{activeRoadmap.suggestedTimeline && ` · ${activeRoadmap.suggestedTimeline}`}</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setActiveRoadmap(null); setRoadmapSaved(false); setTopicPreference(""); }} style={{ padding: "10px 18px", borderRadius: 8, backgroundColor: "transparent", border: "1px solid #333", color: "#888", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><RotateCcw size={14} /> New Roadmap</button>
                  <button onClick={handleSaveRoadmap} disabled={roadmapSaved} style={{ padding: "10px 20px", borderRadius: 8, backgroundColor: roadmapSaved ? "#10B981" : GOLD, color: "#0A0A0A", fontWeight: 700, fontSize: 13, border: "none", cursor: roadmapSaved ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>{roadmapSaved ? <><FileCheck size={14} /> Saved</> : <><Save size={14} /> Save Roadmap</>}</button>
                </div>
              </div>
              <RoadmapVisual roadmap={activeRoadmap} onToggleStatus={handleToggleRoadmapNode} />
            </motion.div>
          )}

          {/* QUICK ACTIONS */}
          {!showTimer && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 48 }} className="quick-actions-grid">
              {[
                { icon: Backpack, label: "Courses", sub: "View & Manage", route: "/courses", color: "#3B82F6" },
                { icon: Swords, label: "Practice & Quizzes", sub: "Start Learning", route: "/practice", color: GOLD },
                { icon: ClipboardCheck, label: "Assignments", sub: "View Tasks", route: "/assignments", color: "#10B981" },
              ].map((item) => (
                <motion.div key={item.label} whileHover={{ y: -4, borderColor: item.color }} onClick={() => navigate(item.route)} style={{ ...cardHover, padding: "28px", cursor: "pointer" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: `${item.color}12`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <item.icon size={22} color={item.color} />
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 16, fontWeight: 700, color: "#FAFAFA", marginBottom: 4 }}>{item.label}</div>
                  <span style={{ fontSize: 13, color: item.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>{item.sub} <ArrowRight size={14} /></span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* PRACTICE CARDS */}
          {!showTimer && (
            <div style={{ marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <SectionLabel icon={Crosshair} text="Active Learning Tools" />
                  <h3 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: "#FAFAFA", margin: "4px 0 0" }}>Practice & AI Quizzes</h3>
                </div>
                <button onClick={() => navigate("/practice")} style={{ background: "transparent", border: "none", color: GOLD, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>Start Practice <ArrowRight size={15} /></button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                {[
                  { icon: Dices, title: "Subject Quizzes", subtitle: "Gemini AI Generated", type: "Multiple Choice", color: GOLD },
                  { icon: Skull, title: "Mock Practice Exams", subtitle: "Finals Preparation Mode", type: "Problem Solving", color: "#3B82F6" },
                  { icon: WandSparkles, title: "Smart Flashcards", subtitle: "Spaced Repetition", type: "Recall Mastery", color: "#8B5CF6" },
                ].map((c, idx) => (
                  <motion.div key={idx} whileHover={{ y: -4 }} onClick={() => navigate("/practice")} style={{ backgroundColor: "#141414", border: "1px solid #282828", borderRadius: 18, padding: 24, cursor: "pointer", position: "relative", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: c.color }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${c.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}><c.icon size={18} color={c.color} /></div>
                      <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{c.subtitle}</span>
                    </div>
                    <h4 style={{ fontFamily: FONT, fontSize: 19, fontWeight: 700, color: "#FAFAFA", margin: "0 0 16px" }}>{c.title}</h4>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #202020" }}>
                      <span style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>{c.type}</span>
                      <span style={{ fontSize: 13, color: c.color, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>Open <ArrowRight size={14} /></span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CALENDAR */}
        {!showTimer && (
          <div style={{ position: "relative", zIndex: 1, maxWidth: 980, margin: "0 auto", padding: "0 32px 48px" }}>
            <div style={{ ...card, padding: "32px 36px" }}>
              <div style={{ marginBottom: 24 }}>
                <SectionLabel icon={CalendarClock} text="Schedule" />
                <h3 style={{ fontFamily: FONT, fontSize: 22, fontWeight: 700, color: "var(--color-text, #FAFAFA)", margin: "4px 0 0" }}>Assignment deadlines & exams at a glance</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1); }} style={{ padding: "6px 14px", borderRadius: 8, backgroundColor: "var(--color-elevated, #0D0D0D)", border: "1px solid var(--color-border, #333)", color: "var(--color-muted, #aaa)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><ChevronLeft size={14} /> Prev</button>
                    <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 17, color: "var(--color-text, #FAFAFA)" }}>{monthNames[calMonth]} {calYear}</div>
                    <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1); }} style={{ padding: "6px 14px", borderRadius: 8, backgroundColor: "var(--color-elevated, #0D0D0D)", border: "1px solid var(--color-border, #333)", color: "var(--color-muted, #aaa)", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>Next <ChevronRight size={14} /></button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
                    {dayNames.map((d) => <div key={d} style={{ textAlign: "center", fontSize: 11, color: "var(--color-muted, #666)", fontWeight: 700, textTransform: "uppercase", padding: "4px 0" }}>{d}</div>)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                    {calGrid.map((day, i) => {
                      if (day === null) return <div key={"e-" + i} />;
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const events = calEvents[dateStr] || [];
                      const isToday = dateStr === new Date().toISOString().split("T")[0];
                      const isSel = selectedCalDate === day;
                      return (
                        <div key={day} onClick={() => setSelectedCalDate(isSel ? null : day)} style={{ padding: "8px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer", backgroundColor: isSel ? "rgba(212,160,23,0.15)" : isToday ? "rgba(59,130,246,0.1)" : "transparent", border: isSel ? `1px solid ${GOLD}` : isToday ? "1px solid #3B82F6" : "1px solid transparent", transition: "all 0.15s", minHeight: 52 }}>
                          <div style={{ fontSize: 14, fontWeight: isToday || isSel ? 700 : 500, color: isToday ? "#3B82F6" : isSel ? GOLD : "var(--color-text, #FAFAFA)" }}>{day}</div>
                          {events.length > 0 && <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 4 }}>{events.slice(0, 3).map((e, ei) => <div key={ei} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: e.color }} />)}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {selectedCalDate && (
                    <div style={{ backgroundColor: "var(--color-elevated, #0D0D0D)", border: "1px solid var(--color-border, #282828)", borderRadius: 14, padding: 14 }}>
                      <div style={{ fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 10 }}>{monthNames[calMonth]} {selectedCalDate}, {calYear}</div>
                      {selectedEvents.length === 0 ? <div style={{ fontSize: 13, color: "var(--color-muted, #555)" }}>No events</div> : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{selectedEvents.map((e, i) => <div key={i} style={{ padding: "10px 12px", borderRadius: 8, backgroundColor: "var(--color-surface, #111)", borderLeft: `3px solid ${e.color}` }}><div style={{ fontSize: 11, color: e.color, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 }}>{e.type === "exam" ? "Exam" : "Assignment"}</div><div style={{ fontSize: 13, color: "var(--color-text, #FAFAFA)", fontWeight: 600 }}>{e.title}</div></div>)}</div>}
                    </div>
                  )}
                  <div style={{ backgroundColor: "var(--color-elevated, #0D0D0D)", border: "1px solid var(--color-border, #282828)", borderRadius: 14, padding: 14, flex: 1, overflowY: "auto", maxHeight: 260 }}>
                    <div style={{ fontSize: 11, color: "var(--color-muted, #888)", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>Upcoming · 30 days</div>
                    {upcomingEvents.length === 0 ? <div style={{ fontSize: 13, color: "var(--color-muted, #555)" }}>Nothing coming up</div> : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{upcomingEvents.map((e, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, backgroundColor: "var(--color-surface, #111)" }}><div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: e.type === "exam" ? "#8B5CF6" : e.priority === "High" ? "#EF4444" : e.priority === "Low" ? "#3B82F6" : GOLD }} /><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, color: "var(--color-text, #FAFAFA)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div><div style={{ fontSize: 11, color: "var(--color-muted, #666)" }}>{e.date}{e.subject ? " · " + e.subject : ""}</div></div><div style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, whiteSpace: "nowrap", backgroundColor: e.daysLeft <= 1 ? "rgba(239,68,68,0.12)" : e.daysLeft <= 3 ? "rgba(212,160,23,0.12)" : "rgba(16,185,129,0.12)", color: e.daysLeft <= 1 ? "#EF4444" : e.daysLeft <= 3 ? GOLD : "#10B981" }}>{e.daysLeft === 0 ? "Today" : e.daysLeft === 1 ? "Tomorrow" : e.daysLeft + "d"}</div></div>)}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {[{ c: GOLD, l: "Assignment" }, { c: "#8B5CF6", l: "Exam" }, { c: "#10B981", l: "Done" }, { c: "#EF4444", l: "High" }].map((x) => <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--color-muted, #888)" }}><div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: x.c }} /> {x.l}</div>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <SessionReflection isOpen={showReflection} sessionData={completedSessionData} subjectName={completedSessionData?.subjectName} onSave={handleSaveReflection} onSkip={() => { setShowReflection(false); setCompletedSessionData(null); }} onSuggestQuiz={handleSuggestQuiz} />

      <LevelUpPopup info={levelUpInfo} onDismiss={dismissLevelUp} />
      <XpGainToast toast={xpToast} />
      <DailyLoginPopup
        isOpen={showDailyLogin}
        onDismiss={handleDismissDailyLogin}
        xpGained={dailyLoginXp}
        streak={userStreak}
        level={level}
        isNewUser={isNewUserPopup}
      />

      <style>{`
        .notebook-bg {
          background-image:
            linear-gradient(rgba(212,160,23,0.06) 1px, transparent 1px),
            linear-gradient(90deg, transparent 80px, rgba(220,38,38,0.06) 80px, rgba(220,38,38,0.06) 81px, transparent 81px);
          background-size: 100% 32px, 100% 100%;
          background-position: 0 8px, 0 0;
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .quick-actions-grid { grid-template-columns: 1fr !important; }
          .plan-input-grid { flex-direction: column !important; }
        }
      `}</style>
    </SidebarLayout>
  );
}
