import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { db } from "../firebase";
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { useSubjects } from "../hooks/useSubjects";
import { ExamCardSkeleton } from "../components/studyspace/SkeletonLoader";

export default function ExamsPage() {
  const { currentUser } = useAuth();
  const { subjects } = useSubjects(currentUser?.uid);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [examName, setExamName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState("");
  const [coverage, setCoverage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [hoveredDeleteId, setHoveredDeleteId] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "users", currentUser.uid, "exams"), orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setExams(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!examName.trim() || !currentUser) return;
    const selectedSub = subjects.find((s) => s.id === subjectId);
    await addDoc(collection(db, "users", currentUser.uid, "exams"), {
      examName: examName.trim(),
      subjectId: subjectId || "general",
      subjectName: selectedSub?.name || "General Exam",
      date: date || new Date().toISOString().split("T")[0],
      coverage: coverage.trim(),
      createdAt: serverTimestamp(),
    });
    setExamName("");
    setCoverage("");
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "users", currentUser.uid, "exams", id));
  };

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 32px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
          <div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, margin: "0 0 6px" }}>
              Exams & Midterms
            </h1>
            <p style={{ color: "#A3A3A3", fontSize: 15, margin: 0 }}>
              Track upcoming examinations, syllabus coverage, and preparation countdowns.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: "12px 24px",
              borderRadius: 12,
              backgroundColor: "#D4A017",
              color: "#0A0A0A",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
            }}
          >
            + Schedule Exam
          </button>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => <ExamCardSkeleton key={i} />)}
          </div>
        ) : exams.length === 0 ? (
          <div style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 20, padding: 48, textAlign: "center" }}>
            <h3 style={{ fontSize: 20, color: "#FAFAFA", marginBottom: 8 }}>No exams scheduled</h3>
            <p style={{ color: "#888888", fontSize: 14, marginBottom: 24 }}>Schedule upcoming tests or midterms to track your readiness.</p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                backgroundColor: "#D4A017",
                color: "#0A0A0A",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
              }}
            >
              + Schedule Exam
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {exams.map((ex) => (
              <div key={ex.id} style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 16, padding: 24, position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Exam
                    </span>
                    <h3 style={{ margin: "4px 0 2px", fontSize: 18, fontWeight: 700, color: "#FAFAFA" }}>{ex.examName}</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "#D4A017", fontWeight: 600 }}>{ex.subjectName}</p>
                  </div>

                  <button
                    onClick={() => handleDelete(ex.id)}
                    onMouseEnter={() => setHoveredDeleteId(ex.id)}
                    onMouseLeave={() => setHoveredDeleteId(null)}
                    aria-label={`Delete ${ex.examName}`}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: hoveredDeleteId === ex.id ? "#F87171" : "#888",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 8px",
                      borderRadius: 999,
                      position: "relative",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <Trash2 size={16} />
                    {hoveredDeleteId === ex.id && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#F87171", whiteSpace: "nowrap" }}>Delete</span>
                    )}
                  </button>
                </div>

                <div style={{ fontSize: 13, color: "#A3A3A3", borderTop: "1px solid #1C1C1C", paddingTop: 12, marginTop: 12 }}>
                  <div>📅 Date: <strong>{ex.date}</strong></div>
                  {ex.coverage && <div style={{ marginTop: 4 }}>📖 Coverage: {ex.coverage}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
            <div style={{ backgroundColor: "#171717", border: "1px solid #282828", borderRadius: 20, padding: 32, maxWidth: 420, width: "90%" }}>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, color: "#FAFAFA", margin: "0 0 16px" }}>Schedule Exam</h3>
              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, color: "#A3A3A3", display: "block", marginBottom: 4 }}>Exam Title *</label>
                  <input
                    type="text"
                    required
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    placeholder="e.g. DBMS Midterm Exam"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, backgroundColor: "#111", border: "1px solid #282828", color: "#FAFAFA" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#A3A3A3", display: "block", marginBottom: 4 }}>Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, backgroundColor: "#111", border: "1px solid #282828", color: "#FAFAFA" }}
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#A3A3A3", display: "block", marginBottom: 4 }}>Exam Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, backgroundColor: "#111", border: "1px solid #282828", color: "#FAFAFA" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#A3A3A3", display: "block", marginBottom: 4 }}>Syllabus Coverage</label>
                  <input
                    type="text"
                    value={coverage}
                    onChange={(e) => setCoverage(e.target.value)}
                    placeholder="e.g. Units 1 to 4"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, backgroundColor: "#111", border: "1px solid #282828", color: "#FAFAFA" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "transparent", border: "1px solid #282828", color: "#FAFAFA", cursor: "pointer" }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#D4A017", color: "#0A0A0A", fontWeight: 700, border: "none", cursor: "pointer" }}>Save Exam</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
