import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { createRoom, joinRoom } from "../utils/rooms";

const GOLD = "#D4A017";

const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10,
  backgroundColor: "#171717", border: "1px solid #282828",
  color: "#FAFAFA", fontSize: 14, outline: "none", boxSizing: "border-box",
};

const labelStyle = { fontSize: 12, color: "#888", display: "block", marginBottom: 6, fontWeight: 600 };

export default function ArenasPage() {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Create form
  const [topics, setTopics] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [difficulty, setDifficulty] = useState("Medium");

  // Join form
  const [joinCode, setJoinCode] = useState("");

  const userName = userProfile?.aboutYou?.preferredName || currentUser?.displayName || "Player";

  const handleCreate = async () => {
    if (!topics.trim()) {
      setError("Enter at least one topic for the battle.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const code = await createRoom(currentUser.uid, userName, {
        topics: topics.trim(),
        questionCount,
        timePerQuestion,
        difficulty,
      });
      navigate("/battle/" + code);
    } catch (err) {
      setError(err.message || "Failed to create room.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length !== 6) {
      setError("Enter a valid 6-character room code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await joinRoom(code, currentUser.uid, userName);
      navigate("/battle/" + code);
    } catch (err) {
      setError(err.message || "Failed to join room.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "48px 32px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "inline-block", padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>
            Real-Time Battles
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, margin: "0 0 6px" }}>Arenas</h1>
          <p style={{ color: "#888", fontSize: 15, margin: 0 }}>Challenge friends to a real-time quiz battle. Create a room or join with a code.</p>
        </div>

        {!mode && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <button
              onClick={() => { setMode("create"); setError(""); }}
              style={{
                backgroundColor: "#111", border: "1px solid #222", borderRadius: 20, padding: "48px 32px",
                cursor: "pointer", textAlign: "center", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.boxShadow = "0 0 30px rgba(212,160,23,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#FAFAFA", margin: "0 0 8px" }}>Create Room</h2>
              <p style={{ color: "#888", fontSize: 14, margin: 0 }}>Set up a battle with your own rules — topics, difficulty, timer, and more.</p>
            </button>

            <button
              onClick={() => { setMode("join"); setError(""); }}
              style={{
                backgroundColor: "#111", border: "1px solid #222", borderRadius: 20, padding: "48px 32px",
                cursor: "pointer", textAlign: "center", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#10B981"; e.currentTarget.style.boxShadow = "0 0 30px rgba(16,185,129,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎟️</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#FAFAFA", margin: "0 0 8px" }}>Join Room</h2>
              <p style={{ color: "#888", fontSize: 14, margin: 0 }}>Got a room code? Enter it and jump straight into the battle.</p>
            </button>
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "12px 18px", borderRadius: 12, marginTop: 20, fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* CREATE ROOM FORM */}
        {mode === "create" && (
          <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 20, padding: 32, marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#FAFAFA" }}>Create Battle Room</h3>
              <button onClick={() => setMode(null)} style={{ padding: "6px 14px", borderRadius: 8, backgroundColor: "#1F1F1F", border: "1px solid #333", color: "#aaa", fontSize: 12, cursor: "pointer" }}>
                Back
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <label style={labelStyle}>Topics *</label>
                <input
                  style={inputStyle}
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  placeholder='e.g., "Operating Systems, Deadlocks, Memory Management"'
                />
                <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>Comma-separated. Questions will be generated from these topics.</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <div>
                  <label style={labelStyle}>Questions</label>
                  <select style={inputStyle} value={questionCount} onChange={(e) => setQuestionCount(parseInt(e.target.value))}>
                    {[3, 5, 8, 10, 15, 20].map((n) => <option key={n} value={n}>{n} questions</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Time per Question</label>
                  <select style={inputStyle} value={timePerQuestion} onChange={(e) => setTimePerQuestion(parseInt(e.target.value))}>
                    {[15, 20, 30, 45, 60, 90].map((t) => <option key={t} value={t}>{t} seconds</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Difficulty</label>
                  <select style={inputStyle} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                    {["Easy", "Medium", "Hard"].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={loading || !topics.trim()}
                style={{
                  padding: "14px 28px", borderRadius: 12, backgroundColor: GOLD, color: "#0A0A0A",
                  fontWeight: 700, fontSize: 15, border: "none",
                  cursor: loading || !topics.trim() ? "not-allowed" : "pointer",
                  opacity: loading || !topics.trim() ? 0.6 : 1,
                }}
              >
                {loading ? "Creating Room..." : "Create & Enter Lobby"}
              </button>
            </div>
          </div>
        )}

        {/* JOIN ROOM FORM */}
        {mode === "join" && (
          <div style={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 20, padding: 32, marginTop: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#FAFAFA" }}>Join Battle Room</h3>
              <button onClick={() => setMode(null)} style={{ padding: "6px 14px", borderRadius: 8, backgroundColor: "#1F1F1F", border: "1px solid #333", color: "#aaa", fontSize: 12, cursor: "pointer" }}>
                Back
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.06em", marginBottom: 8 }}>Enter Room Code</div>
                <input
                  style={{ ...inputStyle, width: 280, textAlign: "center", fontSize: 28, fontWeight: 700, letterSpacing: 8, textTransform: "uppercase", padding: "16px" }}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="XXXXXX"
                  maxLength={6}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={loading || joinCode.length !== 6}
                style={{
                  padding: "14px 40px", borderRadius: 12, backgroundColor: "#10B981", color: "#000",
                  fontWeight: 700, fontSize: 15, border: "none",
                  cursor: loading || joinCode.length !== 6 ? "not-allowed" : "pointer",
                  opacity: loading || joinCode.length !== 6 ? 0.6 : 1,
                }}
              >
                {loading ? "Joining..." : "Join Battle"}
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
