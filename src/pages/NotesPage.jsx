import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useSubjects } from "../hooks/useSubjects";
import { notesDb } from "../lib/supabaseDb";
import { FormCardSkeleton, NoteCardSkeleton } from "../components/studyspace/SkeletonLoader";

export default function NotesPage() {
  const { currentUser } = useAuth();
  const { subjects } = useSubjects(currentUser?.uid);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubId, setSelectedSubId] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    const unsub = notesDb.subscribe(currentUser.uid, (items) => {
      setNotes(items);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim() || !currentUser) return;
    const selectedSub = subjects.find((s) => s.id === selectedSubId);
    await notesDb.add(currentUser.uid, {
      title: noteTitle.trim(),
      content: noteContent,
      subjectId: selectedSubId || "general",
      subjectName: selectedSub?.name || "General Notes",
    });
    setNoteTitle("");
    setNoteContent("");
  };

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 32px 80px" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, margin: "0 0 6px" }}>
          Academic Notes Workspace
        </h1>
        <p style={{ color: "#A3A3A3", fontSize: 15, margin: "0 0 36px" }}>
          Organize lecture notes, summaries, and key formulas by subject.
        </p>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 32 }} className="notes-layout">
            <FormCardSkeleton fields={4} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Array.from({ length: 3 }).map((_, i) => <NoteCardSkeleton key={i} />)}
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 32 }} className="notes-layout">
            {/* Create Note Sidebar Form */}
            <div style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 20, padding: 24 }}>
              <h3 style={{ fontSize: 18, color: "#FAFAFA", margin: "0 0 16px" }}>Write Note</h3>
              <form onSubmit={handleSaveNote} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Note Title *</label>
                  <input
                    type="text"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g. Process Scheduling Algorithms"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, backgroundColor: "#171717", border: "1px solid #282828", color: "#FAFAFA", fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Subject</label>
                  <select
                    value={selectedSubId}
                    onChange={(e) => setSelectedSubId(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, backgroundColor: "#171717", border: "1px solid #282828", color: "#FAFAFA", fontSize: 14 }}
                  >
                    <option value="">General Notes</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Content</label>
                  <textarea
                    rows={6}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your note markdown content..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, backgroundColor: "#171717", border: "1px solid #282828", color: "#FAFAFA", fontSize: 14, resize: "vertical" }}
                  />
                </div>

                <button
                  type="submit"
                  style={{ padding: "12px", borderRadius: 10, backgroundColor: "#D4A017", color: "#0A0A0A", fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  Save Note
                </button>
              </form>
            </div>

            {/* Notes Feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {notes.length === 0 ? (
                <div style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 20, padding: 48, textAlign: "center", color: "#888" }}>
                  No notes saved yet. Use the form on the left to write your first note.
                </div>
              ) : (
                notes.map((n) => (
                  <div key={n.id} style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 18, padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "#D4A017", fontWeight: 600 }}>{n.subjectName}</span>
                    </div>
                    <h3 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: "#FAFAFA" }}>{n.title}</h3>
                    <p style={{ margin: 0, fontSize: 14, color: "#CCCCCC", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
