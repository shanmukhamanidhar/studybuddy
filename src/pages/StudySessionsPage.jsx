import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useSubjects } from "../hooks/useSubjects";

export default function StudySessionsPage() {
  const { currentUser } = useAuth();
  const { subjects, updateSubject } = useSubjects(currentUser?.uid);

  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState(25); // 25 min pomodoro

  useEffect(() => {
    let timer = null;
    if (isRunning && secondsLeft > 0) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      if (selectedSubjectId) {
        const sub = subjects.find((s) => s.id === selectedSubjectId);
        if (sub) {
          updateSubject(sub.id, { totalStudyMinutes: (sub.totalStudyMinutes || 0) + sessionType });
        }
      }
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, secondsLeft, selectedSubjectId]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(sessionType * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "48px 32px 80px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, margin: "0 0 6px", color: "#FAFAFA" }}>
          Deep Focus Study Session
        </h1>
        <p style={{ color: "#A3A3A3", fontSize: 15, margin: "0 0 36px" }}>
          Select a subject, start your focus timer, and track deep work duration.
        </p>

        {/* Timer Card */}
        <div style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 24, padding: "48px 32px", maxWidth: 520, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, color: "#888888", display: "block", marginBottom: 8 }}>Target Subject</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              style={{ padding: "10px 16px", borderRadius: 10, backgroundColor: "#171717", border: "1px solid #282828", color: "#FAFAFA", fontSize: 14, width: "100%", outline: "none" }}
            >
              <option value="">General Focus Session</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div
            style={{
              fontFamily: "monospace",
              fontSize: "clamp(56px, 8vw, 84px)",
              fontWeight: 700,
              color: isRunning ? "#D4A017" : "#FAFAFA",
              margin: "24px 0",
              letterSpacing: "0.04em",
            }}
          >
            {formattedTime}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
            {!isRunning ? (
              <button
                onClick={handleStart}
                style={{ padding: "14px 36px", borderRadius: 14, backgroundColor: "#D4A017", color: "#0A0A0A", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(212,160,23,0.25)" }}
              >
                ▶ Start Focus
              </button>
            ) : (
              <button
                onClick={handlePause}
                style={{ padding: "14px 36px", borderRadius: 14, backgroundColor: "#EAB308", color: "#0A0A0A", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer" }}
              >
                ⏸ Pause
              </button>
            )}

            <button
              onClick={handleReset}
              style={{ padding: "14px 24px", borderRadius: 14, backgroundColor: "#1C1C1C", border: "1px solid #282828", color: "#FAFAFA", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
