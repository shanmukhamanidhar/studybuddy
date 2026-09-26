import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useSubjects } from "../hooks/useSubjects";
import { db } from "../firebase";
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { FormCardSkeleton, ResourceCardSkeleton } from "../components/studyspace/SkeletonLoader";

export default function ResourcesPage() {
  const { currentUser } = useAuth();
  const { subjects } = useSubjects(currentUser?.uid);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [subjectId, setSubjectId] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "users", currentUser.uid, "resources"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setResources(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [currentUser]);

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!title.trim() || !currentUser) return;
    const selectedSub = subjects.find((s) => s.id === subjectId);
    await addDoc(collection(db, "users", currentUser.uid, "resources"), {
      title: title.trim(),
      url: url.trim(),
      subjectId: subjectId || "general",
      subjectName: selectedSub?.name || "General Resource",
      createdAt: serverTimestamp(),
    });
    setTitle("");
    setUrl("");
  };

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "48px 32px 80px" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, margin: "0 0 6px" }}>
          Academic Resources & Links
        </h1>
        <p style={{ color: "#A3A3A3", fontSize: 15, margin: "0 0 36px" }}>
          Store references, syllabus PDFs, research links, and books per subject.
        </p>

        {loading ? (
          <>
            <FormCardSkeleton fields={3} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginTop: 32 }}>
              {Array.from({ length: 4 }).map((_, i) => <ResourceCardSkeleton key={i} />)}
            </div>
          </>
        ) : (
          <>
            <div style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 20, padding: 24, marginBottom: 32 }}>
              <h3 style={{ fontSize: 18, color: "#FAFAFA", margin: "0 0 16px" }}>Add Resource</h3>
              <form onSubmit={handleAddResource} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 14, alignItems: "end" }}>
                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Textbook Chapter 4 PDF"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, backgroundColor: "#171717", border: "1px solid #282828", color: "#FAFAFA" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>URL / Link</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, backgroundColor: "#171717", border: "1px solid #282828", color: "#FAFAFA" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, backgroundColor: "#171717", border: "1px solid #282828", color: "#FAFAFA" }}
                  >
                    <option value="">General Resource</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" style={{ padding: "10px 20px", borderRadius: 8, backgroundColor: "#D4A017", color: "#0A0A0A", fontWeight: 700, border: "none", cursor: "pointer" }}>
                  Add
                </button>
              </form>
            </div>

            {resources.length === 0 ? (
              <div style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 20, padding: 48, textAlign: "center", color: "#888" }}>
                No resources logged yet.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {resources.map((r) => (
                  <div key={r.id} style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 16, padding: 20 }}>
                    <span style={{ fontSize: 11, color: "#D4A017", fontWeight: 600 }}>{r.subjectName}</span>
                    <h4 style={{ margin: "4px 0 8px", fontSize: 16, fontWeight: 700, color: "#FAFAFA" }}>{r.title}</h4>
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "#3B82F6", textDecoration: "underline" }}>
                        Open Resource Link ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
