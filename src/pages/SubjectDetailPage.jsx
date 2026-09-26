import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import Navbar from "../components/Navbar";

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    async function fetchSubject() {
      if (!currentUser || !subjectId) return;
      try {
        setLoading(true);
        const userRef = doc(db, "users", currentUser.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          const subjects = Array.isArray(data.subjects) ? data.subjects : [];
          const found = subjects.find((s, idx) => s.id === subjectId || String(s.id) === String(subjectId) || String(idx) === String(subjectId));
          setSubject(found || null);
        } else {
          setSubject(null);
        }
      } catch (err) {
        console.error("Error fetching subject:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubject();
  }, [currentUser, subjectId]);

  const color = subject?.color || "#D4A017";

  return (
    <div style={{ backgroundColor: "#0A0A0A", minHeight: "100vh", color: "#FAFAFA", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main
        className="notebook-grid"
        style={{
          flex: 1,
          maxWidth: 820,
          margin: "0 auto",
          width: "100%",
          padding: "130px 24px 80px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Back Link */}
        <button
          onClick={() => navigate("/courses")}
          style={{
            background: "transparent",
            border: "none",
            color: "#888888",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            marginBottom: 36,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            alignSelf: "flex-start",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFAFA")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#888888")}
        >
          ← Study Space
        </button>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#737373" }}>
            Preparing notebook...
          </div>
        ) : !subject ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, marginBottom: 12 }}>Subject Not Found</h2>
            <button
              onClick={() => navigate("/courses")}
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
              Return to Study Space
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Subject Notebook Header */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    backgroundColor: color,
                    display: "inline-block",
                  }}
                />
                {subject.courseCode && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#737373", fontFamily: "monospace" }}>
                    {subject.courseCode}
                  </span>
                )}
                <span style={{ fontSize: 12, color: "#555555" }}>• {subject.difficulty || "Medium"}</span>
              </div>

              <h1
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontSize: "clamp(32px, 5vw, 44px)",
                  fontWeight: 700,
                  color: "#FAFAFA",
                  margin: "0 0 16px",
                  letterSpacing: "-0.02em",
                }}
              >
                {subject.name}
              </h1>

              {/* Progress Line */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 14, color: "#A3A3A3" }}>
                <span>{subject.progress || 0}% Completed</span>
                <span>•</span>
                <span>{subject.totalStudyMinutes || 0} mins studied total</span>
              </div>
            </div>

            {/* Primary Start Study Session Hero Button */}
            <div style={{ marginBottom: 48 }}>
              <button
                onClick={() => setSessionActive(!sessionActive)}
                style={{
                  width: "100%",
                  padding: "20px 32px",
                  borderRadius: 18,
                  backgroundColor: sessionActive ? "#16A34A" : color,
                  color: sessionActive ? "#FAFAFA" : "#0A0A0A",
                  fontSize: 18,
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: `0 8px 32px ${color}40`,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {sessionActive ? "⏸ Pause Study Session" : "▶ Start Study Session"}
              </button>
            </div>

            {/* Notes Workspace */}
            <div
              style={{
                backgroundColor: "#111111",
                border: "1px solid #222222",
                borderRadius: 20,
                padding: "28px",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#FAFAFA",
                  margin: "0 0 16px",
                }}
              >
                Study Notes
              </h3>

              <textarea
                placeholder="Write your study notes, formulas, or key insights for this subject..."
                rows={8}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 14,
                  backgroundColor: "#171717",
                  border: "1px solid #242424",
                  color: "#FAFAFA",
                  fontSize: 15,
                  lineHeight: 1.6,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
