import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import {
  getProfile,
  practiceHistoryDb,
  studySessionsDb,
  examsDb,
  assignmentsDb,
  notesDb,
  resourcesDb,
} from "../lib/supabaseDb";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { generateAcademicAiResponse } from "../utils/gemini";
import ReactMarkdown from "react-markdown";
import { WorkspaceOverviewSkeleton, NoteCardSkeleton, ListItemSkeleton } from "../components/studyspace/SkeletonLoader";

const GOLD = "#D4A017";

const EVAL_LABELS = {
  "Class Test 1": "CT 1", "Class Test 2": "CT 2",
  "Sessional 1": "S1", "Sessional 2": "S2",
  "Mid 1": "Mid 1", "Mid 2": "Mid 2", "Assignments / Quiz": "Assign",
};

const RESOURCE_CATEGORIES = ["Video", "Article", "Documentation", "Tutorial", "Paper", "Book", "Other"];

const cardStyle = { backgroundColor: "#111", border: "1px solid #222", borderRadius: 14, padding: "20px 22px" };

const WYSIWG_BTN = { padding: "4px 10px", borderRadius: 6, backgroundColor: "#1a1a1a", border: "1px solid #333", color: "#aaa", cursor: "pointer", fontSize: 13, fontWeight: 600 };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#1A1A1A", border: "1px solid #333", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#FAFAFA" }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}</div>
      ))}
    </div>
  );
};

const WysiwygEditor = React.memo(function WysiwygEditor({ initialHtml, onSave, onCancel, saving, editorRef: externalRef }) {
  const internalRef = useRef(null);
  const editorRef = externalRef || internalRef;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (editorRef.current && !ready) {
      editorRef.current.innerHTML = initialHtml || "";
      setReady(true);
    }
  }, [initialHtml, ready, editorRef]);

  const handleBtn = (cmd, val) => (e) => {
    e.preventDefault();
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
  };

  const handleSave = () => {
    if (onSave) onSave(editorRef.current?.innerHTML || "");
  };

  return (
    <div style={{ border: "1px solid #333", borderRadius: 12, overflow: "hidden", backgroundColor: "#0D0D0D" }}>
      <div style={{ display: "flex", gap: 4, padding: "8px 10px", borderBottom: "1px solid #282828", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" style={WYSIWG_BTN} onMouseDown={handleBtn("bold")}><b>B</b></button>
        <button type="button" style={WYSIWG_BTN} onMouseDown={handleBtn("italic")}><i>I</i></button>
        <button type="button" style={WYSIWG_BTN} onMouseDown={handleBtn("underline")}><u>U</u></button>
        <button type="button" style={WYSIWG_BTN} onMouseDown={handleBtn("strikeThrough")}><s>S</s></button>
        <div style={{ width: 1, height: 20, backgroundColor: "#333", margin: "0 4px" }} />
        <button type="button" style={WYSIWG_BTN} onMouseDown={handleBtn("formatBlock", "<h2>")}>H2</button>
        <button type="button" style={WYSIWG_BTN} onMouseDown={handleBtn("formatBlock", "<h3>")}>H3</button>
        <button type="button" style={WYSIWG_BTN} onMouseDown={handleBtn("formatBlock", "<p>")}>P</button>
        <div style={{ width: 1, height: 20, backgroundColor: "#333", margin: "0 4px" }} />
        <button type="button" style={WYSIWG_BTN} onMouseDown={handleBtn("insertUnorderedList")}>&bull; List</button>
        <button type="button" style={WYSIWG_BTN} onMouseDown={handleBtn("insertOrderedList")}>1. List</button>
        <div style={{ width: 1, height: 20, backgroundColor: "#333", margin: "0 4px" }} />
        <button type="button" style={WYSIWG_BTN} onMouseDown={handleBtn("formatBlock", "<blockquote>")}>&#10077; Quote</button>
        <button type="button" style={WYSIWG_BTN} onMouseDown={handleBtn("removeFormat")}>Clear</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        style={{
          minHeight: 200, padding: "16px 18px", color: "#E5E5E5", fontSize: 14, lineHeight: 1.7,
          outline: "none", overflowY: "auto", maxHeight: 400,
        }}
      />
      <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderTop: "1px solid #282828" }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, backgroundColor: GOLD, color: "#0A0A0A", fontWeight: 700, border: "none", cursor: saving ? "wait" : "pointer", fontSize: 14 }}>
          {saving ? "Saving..." : "Save Note"}
        </button>
        <button onClick={onCancel} style={{ padding: "10px 20px", borderRadius: 10, backgroundColor: "transparent", border: "1px solid #333", color: "#888", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
});

function RenderedNote({ html }) {
  return (
    <div
      style={{ color: "#D4D4D4", fontSize: 14, lineHeight: 1.7 }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function SubjectWorkspacePage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [subject, setSubject] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const [practiceHistory, setPracticeHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [scheduledExams, setScheduledExams] = useState([]);

  const [activeTab, setActiveTab] = useState("Overview");

  const [assignments, setAssignments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [resources, setResources] = useState([]);

  // Notes editor state
  const [noteEditorOpen, setNoteEditorOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteGenerating, setNoteGenerating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [noteEditorHtml, setNoteEditorHtml] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const noteEditorRef = useRef(null);

  // Resource state
  const [resTitle, setResTitle] = useState("");
  const [resUrl, setResUrl] = useState("");
  const [resCategory, setResCategory] = useState("Article");

  // AI Tutor
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch subject + user doc
  useEffect(() => {
    async function fetchSubject() {
      if (!currentUser || !subjectId) return;
      try {
        setLoading(true);
        const data = await getProfile(currentUser.uid);
        if (data) {
          const subjectsArr = Array.isArray(data.subjects) ? data.subjects : [];
          setSubject(subjectsArr.find((s) => s.id === subjectId || String(s.id) === String(subjectId)) || null);
          setUserDoc(data);
        }
      } catch (err) {
        console.error("Error fetching subject:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubject();
  }, [currentUser, subjectId]);

  // Real-time listeners
  useEffect(() => {
    if (!currentUser || !subjectId) return;
    const unsubP = practiceHistoryDb.subscribe(currentUser.uid, (items) => {
      setPracticeHistory(items.filter((p) => p.subjectId === subjectId || String(p.subjectId) === String(subjectId)));
    });
    const unsubS = studySessionsDb.subscribe(currentUser.uid, (items) => {
      setSessions(items.filter((s) => s.subjectId === subjectId || String(s.subjectId) === String(subjectId)));
    });
    const unsubE = examsDb.subscribe(currentUser.uid, (items) => {
      setScheduledExams(items.filter((e) => e.subjectId === subjectId || String(e.subjectId) === String(subjectId)));
    });
    return () => { unsubP(); unsubS(); unsubE(); };
  }, [currentUser, subjectId]);

  useEffect(() => {
    if (!currentUser || !subjectId) return;
    const unsubA = assignmentsDb.subscribe(currentUser.uid, (items) => setAssignments(items), { subjectId });
    const unsubN = notesDb.subscribe(currentUser.uid, (items) => setNotes(items), { subjectId });
    const unsubR = resourcesDb.subscribe(currentUser.uid, (items) => setResources(items), { subjectId });
    return () => { unsubA(); unsubN(); unsubR(); };
  }, [currentUser, subjectId]);

  // Notes CRUD
  const openNewNote = () => {
    setEditingNoteId(null);
    setNoteTitle("");
    setNoteEditorHtml("");
    setEditorKey((k) => k + 1);
    setNoteEditorOpen(true);
    setViewingNote(null);
  };

  const openEditNote = (n) => {
    setEditingNoteId(n.id);
    setNoteTitle(n.title || "");
    setNoteEditorHtml(n.html || "");
    setEditorKey((k) => k + 1);
    setNoteEditorOpen(true);
    setViewingNote(null);
  };

  const handleSaveNote = async (html) => {
    if (!noteTitle.trim() && !html.trim()) return;
    setNoteSaving(true);
    try {
      const data = {
        subjectId, subjectName: subject?.name || "",
        title: noteTitle.trim() || "Untitled Note",
        html,
      };
      if (editingNoteId) {
        await notesDb.update(editingNoteId, data);
      } else {
        await notesDb.add(currentUser.uid, data);
      }
      setNoteEditorOpen(false);
      setEditingNoteId(null);
      setNoteTitle("");
      setNoteEditorHtml("");
    } catch (err) {
      console.error("Error saving note:", err);
    } finally {
      setNoteSaving(false);
    }
  };

  const deleteNote = async (id) => {
    if (!confirm("Delete this note?")) return;
    await notesDb.delete(id);
    if (viewingNote?.id === id) setViewingNote(null);
  };

  const generateNotes = async () => {
    setNoteGenerating(true);
    try {
      const prompt = `Generate comprehensive study notes for the subject "${subject?.name || "General"}". 
Format the output in clean HTML (using h2, h3, p, ul, li, strong, em, blockquote tags). 
Cover key concepts, definitions, formulas where relevant, and important points a student should know.
Do NOT include <html>, <head>, <body> tags. Only return the content HTML.`;
      const html = await generateAcademicAiResponse(prompt, { subjects: [subject] });
      if (noteEditorRef.current) {
        noteEditorRef.current.innerHTML = html || "<p>No content generated.</p>";
      }
      if (!noteTitle.trim()) setNoteTitle(`${subject?.name || "Subject"} Notes`);
    } catch (err) {
      console.error("AI notes generation error:", err);
      if (noteEditorRef.current) noteEditorRef.current.innerHTML = "<p>Failed to generate notes.</p>";
    } finally {
      setNoteGenerating(false);
    }
  };

  // Resources CRUD
  const addResource = async () => {
    if (!resTitle.trim() || !resUrl.trim()) return;
    try {
      await resourcesDb.add(currentUser.uid, {
        subjectId, subjectName: subject?.name || "",
        title: resTitle.trim(), url: resUrl.trim(), category: resCategory,
      });
      setResTitle(""); setResUrl(""); setResCategory("Article");
    } catch (err) {
      console.error("Error adding resource:", err);
    }
  };

  const deleteResource = async (id) => {
    if (!confirm("Delete this resource?")) return;
    await resourcesDb.delete(id);
  };

  const resourcesByCategory = useMemo(() => {
    const map = {};
    resources.forEach((r) => {
      const cat = r.category || "Other";
      if (!map[cat]) map[cat] = [];
      map[cat].push(r);
    });
    return map;
  }, [resources]);

  // AI Tutor
  const handleAskTutor = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim() || aiLoading) return;
    setAiLoading(true);
    try {
      const prompt = `Explain or help with this topic in ${subject?.name || "this subject"}: ${aiQuery}. 
Format your response using markdown: use headers (##), bold, bullet points, code blocks, and numbered lists where appropriate for clarity.`;
      const ans = await generateAcademicAiResponse(prompt, { subjects: [subject] });
      setAiAnswer(ans);
    } catch {
      setAiAnswer("Failed to generate response.");
    } finally {
      setAiLoading(false);
    }
  };

  // Derived stats
  const quizzes = useMemo(() => practiceHistory.filter((p) => p.type === "quiz"), [practiceHistory]);
  const exams = useMemo(() => practiceHistory.filter((p) => p.type === "exam"), [practiceHistory]);
  const flashcards = useMemo(() => practiceHistory.filter((p) => p.type === "flashcard"), [practiceHistory]);
  const totalQuizScore = useMemo(() => quizzes.reduce((a, q) => a + (q.score || 0), 0), [quizzes]);
  const totalQuizMax = useMemo(() => quizzes.reduce((a, q) => a + (q.total || 0), 0), [quizzes]);
  const totalExamScore = useMemo(() => exams.reduce((a, e) => a + (e.score || 0), 0), [exams]);
  const totalExamMax = useMemo(() => exams.reduce((a, e) => a + (e.total || 0), 0), [exams]);
  const totalStudyMinutes = useMemo(() => sessions.reduce((a, s) => a + (s.actualMinutes || 0), 0), [sessions]);

  const marksData = useMemo(() => {
    const raw = userDoc?.marks?.[subjectId] || {};
    const entries = [];
    Object.entries(raw).forEach(([key, val]) => {
      if (key === "attendance") return;
      if (val && typeof val === "object" && val.mode !== "Not Attempted" && val.obtained !== "" && val.max !== "") {
        const obtained = parseFloat(val.obtained);
        const max = parseFloat(val.max);
        if (!isNaN(obtained) && !isNaN(max) && max > 0)
          entries.push({ key, label: EVAL_LABELS[key] || key, obtained, max, pct: Math.round((obtained / max) * 100) });
      }
    });
    return entries;
  }, [userDoc, subjectId]);

  const attendance = useMemo(() => {
    const raw = userDoc?.marks?.[subjectId] || {};
    return parseFloat(raw.attendance) || null;
  }, [userDoc, subjectId]);

  const marksLineData = useMemo(() => marksData.map((m) => ({ name: m.label, score: m.pct })), [marksData]);

  const interactionLineData = useMemo(() => {
    const dateMap = {};
    sessions.forEach((s) => {
      const d = s.createdAt?.toDate?.();
      if (!d) return;
      const key = d.toISOString().split("T")[0];
      if (!dateMap[key]) dateMap[key] = { date: key, minutes: 0, quizzes: 0, exams: 0 };
      dateMap[key].minutes += s.actualMinutes || 0;
    });
    practiceHistory.forEach((p) => {
      const d = p.createdAt?.toDate?.();
      if (!d) return;
      const key = d.toISOString().split("T")[0];
      if (!dateMap[key]) dateMap[key] = { date: key, minutes: 0, quizzes: 0, exams: 0 };
      if (p.type === "quiz") dateMap[key].quizzes += 1;
      else if (p.type === "exam") dateMap[key].exams += 1;
    });
    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
  }, [sessions, practiceHistory]);

  if (loading) {
    return <SidebarLayout><div style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 32px 80px" }}><WorkspaceOverviewSkeleton /></div></SidebarLayout>;
  }

  if (!subject) {
    return (
      <SidebarLayout>
        <div style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 32px 80px", textAlign: "center" }}>
          <h2 style={{ color: "#FAFAFA" }}>Subject Not Found</h2>
          <button onClick={() => navigate("/courses")} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 8, backgroundColor: GOLD, color: "#0A0A0A", fontWeight: 700, border: "none", cursor: "pointer" }}>Return to Courses</button>
        </div>
      </SidebarLayout>
    );
  }

  const tabs = ["Overview", "Notes", "Assignments", "Resources", "AI Tutor"];

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 32px 80px" }}>
        {/* Back */}
        <button onClick={() => navigate("/courses")} style={{ background: "transparent", border: "none", color: "#888888", fontSize: 14, fontWeight: 500, cursor: "pointer", marginBottom: 24, display: "inline-flex", alignItems: "center", gap: 6 }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFAFA")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}>
          ← Back to Courses
        </button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: subject.color || GOLD, display: "inline-block" }} />
            <span style={{ fontSize: 13, fontFamily: "monospace", color: "#888888", fontWeight: 600 }}>{subject.courseCode || "—"}</span>
            <span style={{ fontSize: 13, color: "#666" }}>· {subject.credits || 3} Credits</span>
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: "#FAFAFA", margin: 0 }}>{subject.name}</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid #222", paddingBottom: 12, marginBottom: 32 }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "8px 18px", borderRadius: 8, backgroundColor: activeTab === t ? "rgba(212,160,23,0.12)" : "transparent", border: activeTab === t ? "1px solid rgba(212,160,23,0.3)" : "1px solid transparent", color: activeTab === t ? "#D4A017" : "#888888", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              {t}
            </button>
          ))}
        </div>

        {/* ========== OVERVIEW ========== */}
        {activeTab === "Overview" && (<>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Quizzes", value: quizzes.length, sub: totalQuizMax > 0 ? `${totalQuizScore}/${totalQuizMax}` : "—", color: GOLD },
              { label: "Exams Written", value: exams.length, sub: totalExamMax > 0 ? `${totalExamScore}/${totalExamMax}` : "—", color: "#3B82F6" },
              { label: "Study Sessions", value: sessions.length, sub: totalStudyMinutes > 0 ? `${totalStudyMinutes} min` : "—", color: "#10B981" },
              { label: "Scheduled Exams", value: scheduledExams.length, sub: scheduledExams[0]?.date ? `Next: ${scheduledExams[0].date}` : "—", color: "#8B5CF6" },
              { label: "Flashcards", value: flashcards.length, sub: flashcards.reduce((a, f) => a + (f.totalCards || 0), 0) + " cards", color: "#EC4899" },
            ].map((s) => (
              <div key={s.label} style={cardStyle}>
                <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#FAFAFA", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: s.color, marginTop: 4, fontWeight: 600 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {marksData.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>📊 Grades</h3>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "#888" }}>Performance in class tests, sessionals & mids</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {marksData.map((m) => (
                  <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #1a1a1a" }}>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#FAFAFA" }}>{m.key}</div>
                    <div style={{ fontSize: 13, color: "#888", width: 80, textAlign: "right" }}>{m.obtained} / {m.max}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, padding: "3px 10px", borderRadius: 6, minWidth: 48, textAlign: "center", backgroundColor: m.pct >= 80 ? "rgba(16,185,129,0.12)" : m.pct >= 50 ? "rgba(212,160,23,0.12)" : "rgba(239,68,68,0.12)", color: m.pct >= 80 ? "#10B981" : m.pct >= 50 ? GOLD : "#EF4444" }}>{m.pct}%</div>
                  </div>
                ))}
                {attendance !== null && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #1a1a1a" }}>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#FAFAFA" }}>Attendance</div>
                    <div style={{ fontSize: 13, fontWeight: 700, padding: "3px 10px", borderRadius: 6, minWidth: 48, textAlign: "center", backgroundColor: attendance >= 80 ? "rgba(16,185,129,0.12)" : attendance >= 60 ? "rgba(212,160,23,0.12)" : "rgba(239,68,68,0.12)", color: attendance >= 80 ? "#10B981" : attendance >= 60 ? GOLD : "#EF4444" }}>{attendance}%</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {marksLineData.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>📈 Exam Marks</h3>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>Score % across tests and assessments</p>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={marksLineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 12 }} axisLine={{ stroke: "#333" }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#888", fontSize: 12 }} axisLine={{ stroke: "#333" }} tickFormatter={(v) => v + "%"} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="score" stroke={GOLD} strokeWidth={2.5} dot={{ r: 5, fill: GOLD }} activeDot={{ r: 7 }} name="Score %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {interactionLineData.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>📉 Study Activity</h3>
              <p style={{ margin: "0 0 20px", fontSize: 13, color: "#888" }}>Study minutes, quizzes & exams over time</p>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={interactionLineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} axisLine={{ stroke: "#333" }} tickFormatter={(v) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                    <YAxis tick={{ fill: "#888", fontSize: 12 }} axisLine={{ stroke: "#333" }} />
                    <Tooltip content={({ active, payload, label }) => { if (!active || !payload?.length) return null; return (<div style={{ backgroundColor: "#1A1A1A", border: "1px solid #333", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#FAFAFA" }}><div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>{payload.map((p, i) => (<div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>))}</div>); }} />
                    <Line type="monotone" dataKey="minutes" stroke="#10B981" strokeWidth={2} dot={{ r: 4, fill: "#10B981" }} name="Minutes" />
                    <Line type="monotone" dataKey="quizzes" stroke={GOLD} strokeWidth={2} dot={{ r: 4, fill: GOLD }} name="Quizzes" />
                    <Line type="monotone" dataKey="exams" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4, fill: "#8B5CF6" }} name="Exams" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {marksLineData.length === 0 && interactionLineData.length === 0 && (
            <div style={{ ...cardStyle, textAlign: "center", padding: 48 }}>
              <p style={{ color: "#666", fontSize: 14, margin: 0 }}>No marks, sessions, or practice data yet for this subject. Start studying to see your progress!</p>
            </div>
          )}
        </>)}

        {/* ========== NOTES ========== */}
        {activeTab === "Notes" && (<>
          {/* Viewing a note */}
          {viewingNote && !noteEditorOpen && (
            <div style={{ marginBottom: 20 }}>
              <button onClick={() => setViewingNote(null)} style={{ background: "transparent", border: "none", color: "#888", fontSize: 14, cursor: "pointer", marginBottom: 16, display: "inline-flex", alignItems: "center", gap: 6 }} onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFAFA")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}>
                ← Back to Notes
              </button>
              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "#FAFAFA", margin: 0 }}>{viewingNote.title}</h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => openEditNote(viewingNote)} style={{ padding: "6px 14px", borderRadius: 8, backgroundColor: "rgba(212,160,23,0.12)", border: "1px solid rgba(212,160,23,0.3)", color: GOLD, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Edit</button>
                    <button onClick={() => deleteNote(viewingNote.id)} style={{ padding: "6px 14px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Delete</button>
                  </div>
                </div>
                <RenderedNote html={viewingNote.html || ""} />
              </div>
            </div>
          )}

          {/* Editor */}
          {noteEditorOpen && (
            <div style={{ ...cardStyle, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>{editingNoteId ? "Edit Note" : "New Note"}</h3>
                <button onClick={generateNotes} disabled={noteGenerating} style={{ padding: "6px 14px", borderRadius: 8, backgroundColor: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#8B5CF6", fontSize: 13, fontWeight: 600, cursor: noteGenerating ? "wait" : "pointer" }}>
                  {noteGenerating ? "Generating..." : "✨ Generate with AI"}
                </button>
              </div>
              <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #333", color: "#FAFAFA", fontSize: 15, fontWeight: 600, outline: "none", marginBottom: 14 }} />
              <WysiwygEditor
                key={editorKey}
                editorRef={noteEditorRef}
                initialHtml={noteEditorHtml}
                onSave={handleSaveNote}
                onCancel={() => { setNoteEditorOpen(false); setEditingNoteId(null); setNoteEditorHtml(""); }}
                saving={noteSaving}
              />
            </div>
          )}

          {/* Notes list */}
          {!noteEditorOpen && !viewingNote && (
            <>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                <button onClick={openNewNote} style={{ padding: "8px 20px", borderRadius: 10, backgroundColor: GOLD, color: "#0A0A0A", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14 }}>
                  + New Note
                </button>
              </div>
              {notes.length === 0 ? (
                <div style={{ ...cardStyle, color: "#737373", textAlign: "center", padding: 40 }}>No notes yet. Click "New Note" to get started.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {notes.map((n) => (
                    <div key={n.id} style={{ ...cardStyle, cursor: "pointer", transition: "background-color 0.15s" }} onClick={() => setViewingNote(n)} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#161616")} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#111")}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#FAFAFA" }}>{n.title || "Untitled"}</h4>
                        <span style={{ fontSize: 11, color: "#555" }}>{n.createdAt?.toDate?.().toLocaleDateString?.() || ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>)}

        {/* ========== ASSIGNMENTS ========== */}
        {activeTab === "Assignments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {assignments.length === 0 ? (
              <div style={{ ...cardStyle, color: "#737373", textAlign: "center", padding: 40 }}>No assignments logged for this subject yet.</div>
            ) : assignments.map((a) => (
              <div key={a.id} style={cardStyle}>
                <h4 style={{ margin: "0 0 4px", fontSize: 16, color: "#FAFAFA" }}>{a.title}</h4>
                <span style={{ fontSize: 12, color: "#888" }}>Due: {a.deadline} · Status: {a.status}</span>
              </div>
            ))}
          </div>
        )}

        {/* ========== RESOURCES ========== */}
        {activeTab === "Resources" && (<>
          {/* Add resource form */}
          <div style={{ ...cardStyle, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 700, color: "#FAFAFA" }}>Add Resource</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 140px auto", gap: 10, alignItems: "center" }}>
              <input type="text" value={resTitle} onChange={(e) => setResTitle(e.target.value)} placeholder="Title" style={{ padding: "10px 14px", borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #333", color: "#FAFAFA", fontSize: 14, outline: "none" }} />
              <input type="url" value={resUrl} onChange={(e) => setResUrl(e.target.value)} placeholder="https://..." style={{ padding: "10px 14px", borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #333", color: "#FAFAFA", fontSize: 14, outline: "none" }} />
              <select value={resCategory} onChange={(e) => setResCategory(e.target.value)} style={{ padding: "10px 12px", borderRadius: 10, backgroundColor: "#0D0D0D", border: "1px solid #333", color: "#FAFAFA", fontSize: 13, outline: "none", cursor: "pointer" }}>
                {RESOURCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={addResource} disabled={!resTitle.trim() || !resUrl.trim()} style={{ padding: "10px 20px", borderRadius: 10, backgroundColor: GOLD, color: "#0A0A0A", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14, opacity: !resTitle.trim() || !resUrl.trim() ? 0.4 : 1 }}>
                Add
              </button>
            </div>
          </div>

          {/* Resources grouped by category */}
          {resources.length === 0 ? (
            <div style={{ ...cardStyle, color: "#737373", textAlign: "center", padding: 40 }}>No resources added yet.</div>
          ) : (
            RESOURCE_CATEGORIES.filter((cat) => resourcesByCategory[cat]?.length > 0).map((cat) => (
              <div key={cat} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#FAFAFA" }}>{cat}</span>
                  <span style={{ fontSize: 12, color: "#555", backgroundColor: "#1a1a1a", padding: "2px 8px", borderRadius: 6 }}>{resourcesByCategory[cat].length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {resourcesByCategory[cat].map((r) => (
                    <div key={r.id} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#FAFAFA", marginBottom: 2 }}>{r.title}</div>
                        <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#3B82F6", wordBreak: "break-all" }}>{r.url}</a>
                      </div>
                      <button onClick={() => deleteResource(r.id)} style={{ padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", fontSize: 12, cursor: "pointer", flexShrink: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>)}

        {/* ========== AI TUTOR ========== */}
        {activeTab === "AI Tutor" && (
          <div style={{ ...cardStyle, borderRadius: 18, padding: 28 }}>
            <h3 style={{ fontSize: 18, color: "#FAFAFA", margin: "0 0 16px" }}>AI Tutor for {subject.name}</h3>
            <form onSubmit={handleAskTutor} style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <input type="text" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)} placeholder={`Ask a question about ${subject.name}...`} style={{ flex: 1, padding: "12px 16px", borderRadius: 10, backgroundColor: "#171717", border: "1px solid #282828", color: "#FAFAFA", fontSize: 14, outline: "none" }} />
              <button type="submit" disabled={aiLoading} style={{ padding: "12px 24px", borderRadius: 10, backgroundColor: GOLD, color: "#0A0A0A", fontWeight: 700, border: "none", cursor: "pointer" }}>
                {aiLoading ? "Thinking..." : "Ask Tutor"}
              </button>
            </form>
            {aiLoading ? (
              <div style={{ color: "#737373", fontSize: 14 }}>Generating explanation...</div>
            ) : aiAnswer ? (
              <div style={{ backgroundColor: "#171717", border: "1px solid #282828", borderRadius: 14, padding: 24, color: "#E5E5E5", fontSize: 14, lineHeight: 1.7 }}>
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => <h2 style={{ fontSize: 20, fontWeight: 700, color: "#FAFAFA", margin: "20px 0 10px", fontFamily: "'Space Grotesk', sans-serif" }}>{children}</h2>,
                    h3: ({ children }) => <h3 style={{ fontSize: 17, fontWeight: 700, color: "#FAFAFA", margin: "16px 0 8px" }}>{children}</h3>,
                    p: ({ children }) => <p style={{ margin: "0 0 12px", color: "#D4D4D4" }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ margin: "0 0 12px", paddingLeft: 20, color: "#D4D4D4" }}>{children}</ul>,
                    ol: ({ children }) => <ol style={{ margin: "0 0 12px", paddingLeft: 20, color: "#D4D4D4" }}>{children}</ol>,
                    li: ({ children }) => <li style={{ marginBottom: 4, lineHeight: 1.6 }}>{children}</li>,
                    strong: ({ children }) => <strong style={{ color: "#FAFAFA", fontWeight: 700 }}>{children}</strong>,
                    em: ({ children }) => <em style={{ color: "#bbb" }}>{children}</em>,
                    code: ({ children, className }) => {
                      const isBlock = className?.includes("language-");
                      if (isBlock) return <pre style={{ backgroundColor: "#0D0D0D", border: "1px solid #282828", borderRadius: 10, padding: "14px 18px", margin: "12px 0", overflowX: "auto", fontSize: 13, color: "#E5E5E5" }}><code>{children}</code></pre>;
                      return <code style={{ backgroundColor: "#1a1a1a", padding: "2px 6px", borderRadius: 4, fontSize: 13, color: "#EC4899" }}>{children}</code>;
                    },
                    blockquote: ({ children }) => <blockquote style={{ borderLeft: "3px solid " + GOLD, paddingLeft: 16, margin: "12px 0", color: "#aaa", fontStyle: "italic" }}>{children}</blockquote>,
                    hr: () => <hr style={{ border: "none", borderTop: "1px solid #282828", margin: "16px 0" }} />,
                    a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" style={{ color: "#3B82F6", textDecoration: "underline" }}>{children}</a>,
                  }}
                >
                  {aiAnswer}
                </ReactMarkdown>
              </div>
            ) : (
              <div style={{ color: "#737373", fontSize: 13 }}>Ask any question to receive tailored explanations for this subject.</div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
