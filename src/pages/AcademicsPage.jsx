import React, { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useSubjects } from "../hooks/useSubjects";
import SidebarLayout from "../components/layout/SidebarLayout";
import { db } from "../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from "recharts";

const GOLD = "#D4A017";
const COLORS = ["#D4A017", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899", "#F97316", "#06B6D4", "#EF4444"];

const TRAIT_LABELS = {
  ambitious: "Ambitious", consistent: "Consistent", procrastinator: "Procrastinator",
  night_owl: "Night Owl", early_bird: "Early Bird", distracted: "Distracted",
  competitive: "Competitive", calm_under_pressure: "Calm Under Pressure",
  fast_learner: "Fast Learner", curious: "Curious", creative: "Creative", team_player: "Team Player",
};

const GOAL_LABELS = {
  sgpa_9: "SGPA ≥ 9.0", improve_cgpa: "Improve CGPA", pass_all: "Pass All Subjects",
  top_10: "Top 10%", early_syllabus: "Finish Syllabus Early",
  reduce_procrastination: "Reduce Procrastination", study_habit: "Build Study Habits", placements: "Placement Prep",
};

const inputStyle = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  backgroundColor: "#171717", border: "1px solid #282828",
  color: "#FAFAFA", fontSize: 14, outline: "none", boxSizing: "border-box",
};

const cardStyle = {
  backgroundColor: "#111111", border: "1px solid #222222",
  borderRadius: 20, padding: "28px 32px", marginBottom: 24,
};

const labelStyle = { fontSize: 12, color: "#888", display: "block", marginBottom: 6, fontWeight: 600 };

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #333", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#FAFAFA" }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

export default function AcademicsPage() {
  const { currentUser, userProfile } = useAuth();
  const { subjects, createSubject, updateSubject, deleteSubject } = useSubjects(currentUser?.uid);

  const [editSection, setEditSection] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");

  // Editable states
  const [editBranch, setEditBranch] = useState("");
  const [editSemester, setEditSemester] = useState("");
  const [editTargetSGPA, setEditTargetSGPA] = useState("");
  const [editTargetCGPA, setEditTargetCGPA] = useState("");
  const [editStudyHours, setEditStudyHours] = useState("");
  const [editGoals, setEditGoals] = useState([]);
  const [newSubject, setNewSubject] = useState({ name: "", credits: 3, type: "Theory" });
  const [editSubjectId, setEditSubjectId] = useState(null);
  const [editSubjectData, setEditSubjectData] = useState({});
  const [editMarksSubject, setEditMarksSubject] = useState(null);
  const [editMarksData, setEditMarksData] = useState({});

  const profile = userProfile || {};
  const academicInfo = profile.academicInfo || {};
  const goals = profile.goals || {};
  const marks = profile.marks || {};
  const aboutYou = profile.aboutYou || {};
  const previousGPAs = academicInfo.previousGPAs || {};

  const showMsg = (msg) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(""), 3000); };

  // GPA Trend Data
  const gpaData = useMemo(() => {
    const entries = Object.entries(previousGPAs).sort((a, b) => {
      const na = parseInt(a[0].replace(/\D/g, "")) || 0;
      const nb = parseInt(b[0].replace(/\D/g, "")) || 0;
      return na - nb;
    });
    return entries.map(([sem, gpa]) => ({ semester: sem, sgpa: parseFloat(gpa) || 0 }));
  }, [previousGPAs]);

  // Marks chart data
  const marksChartData = useMemo(() => {
    return subjects.slice(0, 8).map((s) => {
      const subMarks = marks[s.id] || {};
      let totalObtained = 0;
      let totalMax = 0;
      Object.entries(subMarks).forEach(([key, val]) => {
        if (key === "attendance") return;
        if (val && typeof val === "object" && val.obtained && val.max) {
          totalObtained += parseFloat(val.obtained) || 0;
          totalMax += parseFloat(val.max) || 0;
        }
      });
      return {
        subject: s.name.length > 12 ? s.name.slice(0, 12) + "…" : s.name,
        obtained: totalObtained,
        total: totalMax,
        percentage: totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0,
      };
    }).filter((d) => d.total > 0);
  }, [subjects, marks]);

  // Attendance data
  const attendanceData = useMemo(() => {
    return subjects.map((s) => {
      const subMarks = marks[s.id] || {};
      const att = parseFloat(subMarks.attendance) || 0;
      return {
        subject: s.name.length > 14 ? s.name.slice(0, 14) + "…" : s.name,
        attendance: att,
        remaining: Math.max(0, 100 - att),
      };
    }).filter((d) => d.attendance > 0);
  }, [subjects, marks]);

  // Credits Pie
  const creditsData = useMemo(() => {
    const typeMap = {};
    subjects.forEach((s) => {
      const t = s.type || "Theory";
      typeMap[t] = (typeMap[t] || 0) + (s.credits || 3);
    });
    return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  }, [subjects]);

  // Radar chart data
  const radarData = useMemo(() => {
    if (marksChartData.length === 0) return [];
    return marksChartData.map((d) => ({
      subject: d.subject,
      score: d.percentage,
      fullMark: 100,
    }));
  }, [marksChartData]);

  const openEditAcademic = () => {
    setEditBranch(academicInfo.branch || "");
    setEditSemester(academicInfo.semester || "");
    setEditSection("academic");
  };

  const openEditGoals = () => {
    setEditGoals(goals.selectedGoals || []);
    setEditTargetSGPA(goals.targetSGPA || "");
    setEditTargetCGPA(goals.targetCGPA || "");
    setEditStudyHours(goals.studyHours || "");
    setEditSection("goals");
  };

  const openEditMarks = (subjectId) => {
    const subMarks = marks[subjectId] || {};
    const cleaned = {};
    Object.entries(subMarks).forEach(([key, val]) => {
      if (key === "attendance") {
        cleaned.attendance = val;
      } else if (val && typeof val === "object") {
        cleaned[key] = { mode: val.mode || "Enter Marks", obtained: val.obtained || "", max: val.max || "" };
      }
    });
    setEditMarksData(cleaned);
    setEditMarksSubject(subjectId);
  };

  const saveAcademic = async () => {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid), {
      "academicInfo.branch": editBranch,
      "academicInfo.semester": editSemester,
      updatedAt: serverTimestamp(),
    });
    setEditSection(null);
    showMsg("Academic info updated.");
  };

  const saveGoals = async () => {
    if (!currentUser) return;
    await updateDoc(doc(db, "users", currentUser.uid), {
      "goals.selectedGoals": editGoals,
      "goals.targetSGPA": editTargetSGPA,
      "goals.targetCGPA": editTargetCGPA,
      "goals.studyHours": editStudyHours,
      updatedAt: serverTimestamp(),
    });
    setEditSection(null);
    showMsg("Goals updated.");
  };

  const saveMarks = async () => {
    if (!currentUser || !editMarksSubject) return;
    const updatedMarks = { ...marks, [editMarksSubject]: editMarksData };
    await updateDoc(doc(db, "users", currentUser.uid), {
      marks: updatedMarks,
      updatedAt: serverTimestamp(),
    });
    setEditMarksSubject(null);
    showMsg("Marks updated.");
  };

  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) return;
    await createSubject({ name: newSubject.name, credits: newSubject.credits, type: newSubject.type, color: COLORS[subjects.length % COLORS.length] });
    setNewSubject({ name: "", credits: 3, type: "Theory" });
    showMsg("Subject added.");
  };

  const handleDeleteSubject = async (id) => {
    if (!confirm("Delete this subject?")) return;
    await deleteSubject(id);
    showMsg("Subject deleted.");
  };

  const toggleGoal = (goalId) => {
    setEditGoals((prev) => prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]);
  };

  const assessmentKeys = useMemo(() => {
    const ep = profile.evaluationPattern || "";
    if (ep === "Mid Examination") return ["Mid 1", "Mid 2", "Assignments / Quiz"];
    return ["Class Test 1", "Class Test 2", "Sessional 1", "Sessional 2", "Assignments / Quiz"];
  }, [profile.evaluationPattern]);

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "48px 32px 80px" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", color: GOLD, fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            📊 Academic Dashboard
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, margin: "0 0 6px" }}>Academics</h1>
          <p style={{ color: "#888", fontSize: 15, margin: 0 }}>Your complete academic profile — performance trends, marks, attendance & goals.</p>
        </div>

        {saveMsg && (
          <div style={{ backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid #10B981", color: "#10B981", padding: "12px 18px", borderRadius: 12, marginBottom: 24, fontSize: 14 }}>{saveMsg}</div>
        )}

        {/* Quick Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Program", value: academicInfo.program || "—" },
            { label: "Branch", value: academicInfo.branch || "—" },
            { label: "Semester", value: academicInfo.semester || "—" },
            { label: "CGPA", value: academicInfo.cgpa || "—" },
            { label: "Subjects", value: subjects.length },
            { label: "Grading", value: profile.gradingSystem || "—" },
          ].map((stat) => (
            <div key={stat.label} style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 14, padding: "18px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#FAFAFA" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* GPA Trend Chart */}
        {gpaData.length > 0 && (
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>📈 SGPA Trend</h3>
                <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>Semester-wise GPA progression</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={gpaData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="semester" tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis domain={[0, 10]} tick={{ fill: "#888", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sgpa" name="SGPA" fill={GOLD} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Marks per Subject */}
        {marksChartData.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>📝 Marks Overview</h3>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>Obtained vs maximum marks per subject</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marksChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="subject" tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis tick={{ fill: "#888", fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="obtained" name="Obtained" fill={GOLD} radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Maximum" fill="#333" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Radar + Attendance Row */}
        <div style={{ display: "grid", gridTemplateColumns: radarData.length > 0 && attendanceData.length > 0 ? "1fr 1fr" : "1fr", gap: 20, marginBottom: 24 }}>
          {radarData.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>🎯 Performance Radar</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>Percentage score across subjects</p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#aaa", fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#666", fontSize: 10 }} />
                  <Radar name="Score" dataKey="score" stroke={GOLD} fill={GOLD} fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {attendanceData.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>📅 Attendance</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>Attendance percentage by subject</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={attendanceData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#888", fontSize: 11 }} />
                  <YAxis type="category" dataKey="subject" tick={{ fill: "#888", fontSize: 11 }} width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="attendance" name="Attendance %" fill="#10B981" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Credits Pie */}
        {creditsData.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>🎯 Credits Distribution</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>Credit weightage by subject type</p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={creditsData} cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                    {creditsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Subjects Table */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>📚 Subjects ({subjects.length})</h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>Manage your enrolled courses</p>
            </div>
            <button onClick={() => setEditSection(editSection === "addSubject" ? null : "addSubject")} style={{ padding: "8px 16px", borderRadius: 8, backgroundColor: GOLD, color: "#0A0A0A", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
              + Add Subject
            </button>
          </div>

          {editSection === "addSubject" && (
            <div style={{ backgroundColor: "#0D0D0D", border: "1px solid #282828", borderRadius: 12, padding: 16, marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 2, minWidth: 180 }}>
                <label style={labelStyle}>Subject Name</label>
                <input style={inputStyle} value={newSubject.name} onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })} placeholder="e.g. Operating Systems" />
              </div>
              <div style={{ flex: 1, minWidth: 100 }}>
                <label style={labelStyle}>Credits</label>
                <input style={inputStyle} type="number" min="0.5" step="0.5" value={newSubject.credits} onChange={(e) => setNewSubject({ ...newSubject, credits: parseFloat(e.target.value) || 0 })} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <label style={labelStyle}>Type</label>
                <select style={inputStyle} value={newSubject.type} onChange={(e) => setNewSubject({ ...newSubject, type: e.target.value })}>
                  {["Theory", "Lab", "Project", "Elective"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <button onClick={handleAddSubject} style={{ padding: "10px 20px", borderRadius: 8, backgroundColor: "#10B981", color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>Save</button>
            </div>
          )}

          {subjects.length === 0 ? (
            <p style={{ color: "#666", fontSize: 14, textAlign: "center", padding: 24 }}>No subjects added yet. Complete onboarding or add subjects above.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #222" }}>
                    {["Subject", "Credits", "Type", "Actions"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", color: "#666", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((s) => {
                    const subMarks = marks[s.id] || {};
                    const att = parseFloat(subMarks.attendance) || 0;
                    const isEditing = editSubjectId === s.id;
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                        <td style={{ padding: "10px 12px", color: "#FAFAFA", fontWeight: 600 }}>
                          {isEditing ? (
                            <input style={{ ...inputStyle, padding: "6px 10px" }} value={editSubjectData.name || ""} onChange={(e) => setEditSubjectData({ ...editSubjectData, name: e.target.value })} />
                          ) : (
                            <span style={{ borderLeft: `3px solid ${s.color}`, paddingLeft: 8 }}>{s.name}</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", color: "#aaa" }}>
                          {isEditing ? (
                            <input style={{ ...inputStyle, padding: "6px 10px", width: 60 }} type="number" min="0.5" step="0.5" value={editSubjectData.credits || ""} onChange={(e) => setEditSubjectData({ ...editSubjectData, credits: parseFloat(e.target.value) || 0 })} />
                          ) : s.credits}
                        </td>
                        <td style={{ padding: "10px 12px", color: "#aaa" }}>
                          {isEditing ? (
                            <select style={{ ...inputStyle, padding: "6px 10px" }} value={editSubjectData.type || "Theory"} onChange={(e) => setEditSubjectData({ ...editSubjectData, type: e.target.value })}>
                              {["Theory", "Lab", "Project", "Elective"].map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          ) : s.type}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            {isEditing ? (
                              <>
                                <button onClick={async () => { await updateSubject(s.id, editSubjectData); setEditSubjectId(null); showMsg("Subject updated."); }} style={{ padding: "4px 10px", borderRadius: 6, backgroundColor: "#10B981", color: "#000", fontWeight: 700, fontSize: 11, border: "none", cursor: "pointer" }}>Save</button>
                                <button onClick={() => setEditSubjectId(null)} style={{ padding: "4px 10px", borderRadius: 6, backgroundColor: "#333", color: "#aaa", fontSize: 11, border: "none", cursor: "pointer" }}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditSubjectId(s.id); setEditSubjectData({ name: s.name, credits: s.credits, type: s.type }); }} style={{ padding: "4px 10px", borderRadius: 6, backgroundColor: "#1F1F1F", border: "1px solid #333", color: "#D4A017", fontSize: 11, cursor: "pointer" }}>Edit</button>
                                <button onClick={() => openEditMarks(s.id)} style={{ padding: "4px 10px", borderRadius: 6, backgroundColor: "#1F1F1F", border: "1px solid #333", color: "#3B82F6", fontSize: 11, cursor: "pointer" }}>Marks</button>
                                <button onClick={() => handleDeleteSubject(s.id)} style={{ padding: "4px 10px", borderRadius: 6, backgroundColor: "#1F1F1F", border: "1px solid #333", color: "#EF4444", fontSize: 11, cursor: "pointer" }}>✕</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Edit Marks Modal */}
        {editMarksSubject && (
          <div style={{ ...cardStyle, border: "1px solid #D4A017", backgroundColor: "#0D0D0D" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: GOLD }}>
                Edit Marks — {subjects.find((s) => s.id === editMarksSubject)?.name}
              </h3>
              <button onClick={() => setEditMarksSubject(null)} style={{ padding: "4px 12px", borderRadius: 6, backgroundColor: "#333", color: "#aaa", fontSize: 12, border: "none", cursor: "pointer" }}>✕ Close</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Attendance %</label>
              <input style={{ ...inputStyle, maxWidth: 160 }} type="number" min="0" max="100" value={editMarksData.attendance || ""} onChange={(e) => setEditMarksData({ ...editMarksData, attendance: e.target.value })} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {assessmentKeys.map((key) => {
                const val = editMarksData[key] || { mode: "Not Attempted", obtained: "", max: "" };
                return (
                  <div key={key} style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 10, padding: 12 }}>
                    <div style={{ fontSize: 12, color: GOLD, fontWeight: 700, marginBottom: 8 }}>{key}</div>
                    <select style={{ ...inputStyle, marginBottom: 8 }} value={val.mode} onChange={(e) => setEditMarksData({ ...editMarksData, [key]: { ...val, mode: e.target.value } })}>
                      <option value="Not Attempted">Not Attempted</option>
                      <option value="Enter Marks">Enter Marks</option>
                    </select>
                    {val.mode === "Enter Marks" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <input style={{ ...inputStyle, flex: 1 }} type="number" min="0" placeholder="Obtained" value={val.obtained} onChange={(e) => setEditMarksData({ ...editMarksData, [key]: { ...val, obtained: e.target.value } })} />
                        <input style={{ ...inputStyle, flex: 1 }} type="number" min="0" placeholder="Max" value={val.max} onChange={(e) => setEditMarksData({ ...editMarksData, [key]: { ...val, max: e.target.value } })} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button onClick={saveMarks} style={{ padding: "10px 24px", borderRadius: 8, backgroundColor: GOLD, color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>Save Marks</button>
              <button onClick={() => setEditMarksSubject(null)} style={{ padding: "10px 24px", borderRadius: 8, backgroundColor: "#333", color: "#aaa", fontSize: 13, border: "none", cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Edit Academic Info */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>🏫 Academic Info</h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>Program, branch & semester details</p>
            </div>
            <button onClick={editSection === "academic" ? () => setEditSection(null) : openEditAcademic} style={{ padding: "8px 16px", borderRadius: 8, backgroundColor: editSection === "academic" ? "#333" : "#1F1F1F", border: `1px solid ${editSection === "academic" ? "#555" : "#333"}`, color: editSection === "academic" ? "#aaa" : GOLD, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              {editSection === "academic" ? "Cancel" : "✏️ Edit"}
            </button>
          </div>

          {editSection === "academic" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Branch</label>
                <input style={inputStyle} value={editBranch} onChange={(e) => setEditBranch(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Semester</label>
                <select style={inputStyle} value={editSemester} onChange={(e) => setEditSemester(e.target.value)}>
                  {["Semester 1","Semester 2","Semester 3","Semester 4","Semester 5","Semester 6","Semester 7","Semester 8"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <button onClick={saveAcademic} style={{ padding: "10px 24px", borderRadius: 8, backgroundColor: GOLD, color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>Save Changes</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", marginBottom: 4 }}>Program</div>
                <div style={{ color: "#FAFAFA", fontSize: 15, fontWeight: 600 }}>{academicInfo.program || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", marginBottom: 4 }}>Branch</div>
                <div style={{ color: "#FAFAFA", fontSize: 15, fontWeight: 600 }}>{academicInfo.branch || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", marginBottom: 4 }}>Semester</div>
                <div style={{ color: "#FAFAFA", fontSize: 15, fontWeight: 600 }}>{academicInfo.semester || "—"}</div>
              </div>
            </div>
          )}
        </div>

        {/* Goals Section */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>🎯 Goals & Targets</h3>
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "#888" }}>Your academic goals and target scores</p>
            </div>
            <button onClick={editSection === "goals" ? () => setEditSection(null) : openEditGoals} style={{ padding: "8px 16px", borderRadius: 8, backgroundColor: editSection === "goals" ? "#333" : "#1F1F1F", border: `1px solid ${editSection === "goals" ? "#555" : "#333"}`, color: editSection === "goals" ? "#aaa" : GOLD, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              {editSection === "goals" ? "Cancel" : "✏️ Edit"}
            </button>
          </div>

          {editSection === "goals" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(GOAL_LABELS).map(([id, label]) => (
                  <button key={id} onClick={() => toggleGoal(id)} style={{ padding: "8px 14px", borderRadius: 8, backgroundColor: editGoals.includes(id) ? "rgba(212,160,23,0.15)" : "#1A1A1A", border: `1px solid ${editGoals.includes(id) ? GOLD : "#333"}`, color: editGoals.includes(id) ? GOLD : "#888", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    {label}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Target SGPA</label>
                  <input style={inputStyle} type="number" min="0" max="10" step="0.1" value={editTargetSGPA} onChange={(e) => setEditTargetSGPA(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Target CGPA</label>
                  <input style={inputStyle} type="number" min="0" max="10" step="0.1" value={editTargetCGPA} onChange={(e) => setEditTargetCGPA(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Daily Study Hours</label>
                  <input style={inputStyle} type="number" min="1" max="16" step="0.5" value={editStudyHours} onChange={(e) => setEditStudyHours(e.target.value)} />
                </div>
              </div>
              <button onClick={saveGoals} style={{ padding: "10px 24px", borderRadius: 8, backgroundColor: GOLD, color: "#000", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", alignSelf: "flex-start" }}>Save Goals</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(goals.selectedGoals || []).length > 0 ? (
                  goals.selectedGoals.map((g) => (
                    <span key={g} style={{ padding: "6px 12px", borderRadius: 8, backgroundColor: "rgba(212,160,23,0.1)", border: "1px solid rgba(212,160,23,0.3)", color: GOLD, fontSize: 13, fontWeight: 600 }}>
                      {GOAL_LABELS[g] || g}
                    </span>
                  ))
                ) : <span style={{ color: "#555", fontSize: 13 }}>No goals set</span>}
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#666", textTransform: "uppercase" }}>Target SGPA</span>
                  <div style={{ color: "#FAFAFA", fontSize: 18, fontWeight: 700 }}>{goals.targetSGPA || "—"}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#666", textTransform: "uppercase" }}>Target CGPA</span>
                  <div style={{ color: "#FAFAFA", fontSize: 18, fontWeight: 700 }}>{goals.targetCGPA || "—"}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#666", textTransform: "uppercase" }}>Study Hours/Day</span>
                  <div style={{ color: "#FAFAFA", fontSize: 18, fontWeight: 700 }}>{goals.studyHours || "—"}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Personality Traits */}
        {aboutYou.personalityTraits && aboutYou.personalityTraits.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>🧠 Personality Traits</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>Your self-identified study personality</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {aboutYou.personalityTraits.map((t) => (
                <span key={t} style={{ padding: "8px 16px", borderRadius: 20, backgroundColor: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)", color: "#8B5CF6", fontSize: 13, fontWeight: 600 }}>
                  {TRAIT_LABELS[t] || t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Evaluation Pattern */}
        <div style={{ ...cardStyle, marginBottom: 0 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>📋 Evaluation Pattern</h3>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#888" }}>How your grades are calculated</p>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ backgroundColor: "#0D0D0D", border: "1px solid #282828", borderRadius: 10, padding: "14px 20px", flex: 1 }}>
              <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", marginBottom: 4 }}>Grading System</div>
              <div style={{ color: GOLD, fontSize: 16, fontWeight: 700 }}>{profile.gradingSystem || "—"}</div>
            </div>
            <div style={{ backgroundColor: "#0D0D0D", border: "1px solid #282828", borderRadius: 10, padding: "14px 20px", flex: 1 }}>
              <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", marginBottom: 4 }}>Evaluation Type</div>
              <div style={{ color: "#FAFAFA", fontSize: 16, fontWeight: 700 }}>{profile.evaluationPattern || "—"}</div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
