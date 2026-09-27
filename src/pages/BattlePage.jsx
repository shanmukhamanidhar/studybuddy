import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useGamification } from "../hooks/useGamification";
import {
  listenToRoom,
  toggleReady,
  leaveRoom,
  startBattle,
  submitAnswer,
  finishBattle,
} from "../utils/rooms";
import { practiceHistoryDb } from "../lib/supabaseDb";

const GOLD = "#D4A017";

const btnPrimary = {
  padding: "12px 28px",
  borderRadius: 12,
  backgroundColor: GOLD,
  color: "#0A0A0A",
  fontWeight: 700,
  fontSize: 14,
  border: "none",
  cursor: "pointer",
};

const btnSecondary = {
  padding: "10px 20px",
  borderRadius: 10,
  backgroundColor: "#1F1F1F",
  border: "1px solid #333",
  color: "#aaa",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

async function generateBattleQuestions(config) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  if (!apiKey) throw new Error("Gemini API key not configured.");

  const topicsText = config.topics || "General Academic";
  const prompt = `Generate a ${config.difficulty} difficulty multiple choice quiz with ${config.questionCount} questions on topic(s): "${topicsText}".
Return ONLY a valid raw JSON array (no markdown, no backticks, no explanation):
[{"id":1,"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"...","topic":"..."}]`;

  let res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );

  if (!res.ok) {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      },
    );
  }

  if (!res.ok) throw new Error("Gemini API failed.");

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Empty AI response.");

  const json = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(json);
}

export default function BattlePage() {
  const { code } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const { award } = useGamification(currentUser?.uid);

  const [room, setRoom] = useState(null);
  const [view, setView] = useState("lobby"); // lobby | quiz | results
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const timerRef = useRef(null);
  const answersRef = useRef({});
  const roomRef = useRef(null);

  const uid = currentUser?.uid;
  const isHost = room?.host === uid;
  const userName =
    userProfile?.aboutYou?.preferredName ||
    currentUser?.displayName ||
    "Player";

  // Listen to room in real-time
  useEffect(() => {
    if (!code) return;
    const unsub = listenToRoom(code, (data) => {
      roomRef.current = data;
      setRoom(data);

      if (data?.status === "active" && view === "lobby") {
        setView("quiz");
        setCurrentQ(0);
        setTimeLeft(data.config?.timePerQuestion || 30);
      }
      if (data?.status === "finished") {
        setResults(data.results);
        setView("results");
      }
    });
    return () => unsub();
  }, [code]);

  // Quiz timer per question
  useEffect(() => {
    if (view !== "quiz" || !room?.questions?.length || !startTimeRef.current) return;

    const totalQ = room.questions.length;
    const tpq = room.config.timePerQuestion || 30;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const qIndex = Math.floor(elapsed / (tpq * 1000));

      if (qIndex >= totalQ) {
        handleFinishQuiz();
        return;
      }

      setCurrentQ(qIndex);
      const qStart = qIndex * tpq * 1000;
      const remaining = Math.max(
        0,
        tpq - Math.floor((elapsed - qStart) / 1000),
      );
      setTimeLeft(remaining);
    };

    timerRef.current = setInterval(tick, 250);
    return () => clearInterval(timerRef.current);
  }, [view, room, currentQ, answers]);

  // Save answer to Firestore
  const saveAnswer = useCallback(
    async (qIndex, aIndex) => {
      if (!code || !uid) return;
      answersRef.current = { ...answersRef.current, [qIndex]: aIndex };
      setAnswers((prev) => ({ ...prev, [qIndex]: aIndex }));
      try {
        await submitAnswer(code, uid, qIndex, aIndex);
      } catch (e) {
        console.error("Answer save failed:", e);
      }
    },
    [code, uid],
  );

  // Auto-submit on time up
  useEffect(() => {
    if (view !== "quiz" || !room?.questions?.length || timeLeft > 0) return;

    const totalQ = room.questions.length;
    const tpq = room.config.timePerQuestion || 30;

    if (currentQ < totalQ - 1) {
      setCurrentQ((prev) => prev + 1);
      setTimeLeft(tpq);
    } else {
      handleFinishQuiz();
    }
  }, [timeLeft, view, room, currentQ]);

  const handleStart = async () => {
    if (!isHost || !room) return;
    setGenerating(true);
    setError("");
    try {
      const questions = await generateBattleQuestions(room.config);
      await startBattle(code, questions);
    } catch (err) {
      setError(err.message || "Failed to generate questions.");
      setGenerating(false);
    }
  };

  const handleFinishQuiz = async () => {
    clearInterval(timerRef.current);
    try {
      const result = await finishBattle(code);
      if (result) {
        // Save to each participant's practice history
        for (const r of result.results) {
          try {
            await practiceHistoryDb.add(r.uid, {
              type: "quiz",
              subjectName: "Arena Battle",
              topic: room.config.topics,
              difficulty: room.config.difficulty,
              score: r.score,
              total: r.total,
              questions: (result.room.questions || []).map((q, i) => ({
                id: q.id,
                question: q.question,
                options: q.options,
                correctIndex: q.correctIndex,
                explanation: q.explanation,
                userAnswer: r.details?.[i]?.userAnswer ?? null,
              })),
              arenaCode: code,
            });
          } catch (e) {
            console.error("History save failed for", r.uid, e);
          }
        }
        setResults(result.results);
        setView("results");
        // Award XP for battle completion
        const me = result.results.find((r) => r.uid === uid);
        if (me) {
          award("battle_complete", { difficulty: room.config.difficulty });
          const myRank = result.results.findIndex((r) => r.uid === uid) + 1;
          if (myRank === 1) {
            award("battle_win", { difficulty: room.config.difficulty });
          }
        }
      }
    } catch (e) {
      console.error("Finish failed:", e);
    }
  };

  const handleLeave = async () => {
    await leaveRoom(code, uid);
    navigate("/arenas");
  };

  const allReady = room?.participants?.every((p) => p.ready);
  const myParticipant = room?.participants?.find((p) => p.uid === uid);

  // ========== LOBBY ==========
  if (view === "lobby" && room) {
    return (
      <SidebarLayout>
        <div
          style={{ maxWidth: 740, margin: "0 auto", padding: "48px 32px 80px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 32,
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: 6,
                  backgroundColor: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  color: "#EF4444",
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Battle Lobby
              </div>
              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 28,
                  fontWeight: 700,
                  margin: 0,
                }}
              >
                Room {code}
              </h1>
            </div>
            <button onClick={handleLeave} style={btnSecondary}>
              Leave Room
            </button>
          </div>

          {/* Room Config */}
          <div
            style={{
              backgroundColor: "#111",
              border: "1px solid #222",
              borderRadius: 16,
              padding: "20px 24px",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#666",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              Battle Settings
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <span style={{ color: "#888", fontSize: 13 }}>Topics: </span>
                <span
                  style={{ color: "#FAFAFA", fontWeight: 600, fontSize: 14 }}
                >
                  {room.config.topics}
                </span>
              </div>
              <div>
                <span style={{ color: "#888", fontSize: 13 }}>Questions: </span>
                <span style={{ color: GOLD, fontWeight: 700, fontSize: 14 }}>
                  {room.config.questionCount}
                </span>
              </div>
              <div>
                <span style={{ color: "#888", fontSize: 13 }}>Timer: </span>
                <span
                  style={{ color: "#FAFAFA", fontWeight: 600, fontSize: 14 }}
                >
                  {room.config.timePerQuestion}s each
                </span>
              </div>
              <div>
                <span style={{ color: "#888", fontSize: 13 }}>
                  Difficulty:{" "}
                </span>
                <span
                  style={{
                    color:
                      room.config.difficulty === "Easy"
                        ? "#10B981"
                        : room.config.difficulty === "Medium"
                          ? GOLD
                          : "#EF4444",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {room.config.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Participants */}
          <div
            style={{
              backgroundColor: "#111",
              border: "1px solid #222",
              borderRadius: 16,
              padding: "20px 24px",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#666",
                  textTransform: "uppercase",
                  fontWeight: 700,
                }}
              >
                Players ({room.participants.length}/10)
              </div>
              <div style={{ fontSize: 11, color: "#555" }}>
                Share code:{" "}
                <span
                  style={{
                    color: GOLD,
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: 3,
                  }}
                >
                  {code}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {room.participants.map((p) => (
                <div
                  key={p.uid}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: 10,
                    backgroundColor:
                      p.uid === uid ? "rgba(212,160,23,0.06)" : "#0D0D0D",
                    border:
                      p.uid === uid
                        ? "1px solid rgba(212,160,23,0.2)"
                        : "1px solid #1a1a1a",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      backgroundColor: p.uid === uid ? GOLD : "#333",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: p.uid === uid ? "#000" : "#aaa",
                    }}
                  >
                    {p.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: p.uid === uid ? GOLD : "#FAFAFA",
                        fontSize: 14,
                      }}
                    >
                      {p.name}{" "}
                      {p.uid === room.host && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#F97316",
                            fontWeight: 600,
                          }}
                        >
                          (HOST)
                        </span>
                      )}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      backgroundColor: p.ready
                        ? "rgba(16,185,129,0.12)"
                        : "rgba(136,136,136,0.08)",
                      color: p.ready ? "#10B981" : "#666",
                      border: "1px solid " + (p.ready ? "#10B981" : "#333"),
                    }}
                  >
                    {p.ready ? "READY" : "WAITING"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          {error && (
            <div
              style={{
                backgroundColor: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#EF4444",
                padding: "12px 18px",
                borderRadius: 12,
                marginBottom: 20,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => toggleReady(code, uid)}
              style={{
                ...btnPrimary,
                backgroundColor: myParticipant?.ready ? "#10B981" : GOLD,
              }}
            >
              {myParticipant?.ready ? "Unready" : "Ready Up"}
            </button>

            {isHost && (
              <button
                onClick={handleStart}
                disabled={!allReady || generating}
                style={{
                  ...btnPrimary,
                  backgroundColor: generating
                    ? "#333"
                    : allReady
                      ? "#10B981"
                      : "#333",
                  color: generating ? "#888" : allReady ? "#000" : "#666",
                  cursor: !allReady || generating ? "not-allowed" : "pointer",
                }}
              >
                {generating
                  ? "Generating Questions..."
                  : allReady
                    ? "Start Battle"
                    : "Wait for Players"}
              </button>
            )}
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // ========== QUIZ ==========
  if (view === "quiz" && room?.questions?.length) {
    const totalQ = room.questions.length;
    const safeQ = Math.min(currentQ, totalQ - 1);
    const q = room.questions[safeQ];
    if (!q) return null;
    const tpq = room.config.timePerQuestion || 30;
    const progress = ((safeQ + 1) / totalQ) * 100;
    const answeredCount = Object.keys(answers).length;

    return (
      <SidebarLayout>
        <div
          style={{ maxWidth: 740, margin: "0 auto", padding: "32px 24px 80px" }}
        >
          {/* Timer Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 12, color: "#888", fontWeight: 600 }}>
              Question {safeQ + 1} / {totalQ}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor:
                    timeLeft > 10 ? "#10B981" : timeLeft > 5 ? GOLD : "#EF4444",
                  animation: timeLeft <= 10 ? "pulse 0.5s infinite" : "none",
                }}
              />
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  color:
                    timeLeft > 10 ? "#FAFAFA" : timeLeft > 5 ? GOLD : "#EF4444",
                }}
              >
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: "100%",
              height: 4,
              backgroundColor: "#1a1a1a",
              borderRadius: 2,
              marginBottom: 28,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: progress + "%",
                height: "100%",
                backgroundColor: GOLD,
                borderRadius: 2,
                transition: "width 0.3s",
              }}
            />
          </div>

          {/* Question */}
          <div
            style={{
              backgroundColor: "#111",
              border: "1px solid #222",
              borderRadius: 20,
              padding: "32px",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: GOLD,
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {q.topic || "Question"}
            </div>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#FAFAFA",
                margin: "0 0 24px",
                lineHeight: 1.5,
              }}
            >
              {q.question}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.options.map((opt, i) => {
                const isSelected = answers[safeQ] === i;
                return (
                  <button
                    key={i}
                    onClick={() => saveAnswer(safeQ, i)}
                    disabled={answers[safeQ] !== undefined}
                    style={{
                      padding: "14px 18px",
                      borderRadius: 12,
                      textAlign: "left",
                      backgroundColor: isSelected
                        ? "rgba(212,160,23,0.12)"
                        : "#0D0D0D",
                      border: isSelected
                        ? "1px solid " + GOLD
                        : "1px solid #282828",
                      color: isSelected ? "#FAFAFA" : "#CCC",
                      fontSize: 15,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        marginRight: 12,
                        color: isSelected ? GOLD : "#555",
                      }}
                    >
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom nav */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => {
                if (safeQ > 0) setCurrentQ((p) => p - 1);
              }}
              disabled={safeQ === 0}
              style={{
                ...btnSecondary,
                color: safeQ === 0 ? "#333" : "#aaa",
              }}
            >
              Previous
            </button>
            <div style={{ fontSize: 13, color: "#666" }}>
              {answeredCount}/{totalQ} answered
            </div>
            {safeQ === totalQ - 1 ? (
              <button
                onClick={handleFinishQuiz}
                style={{ ...btnPrimary, backgroundColor: "#10B981" }}
              >
                Finish Battle
              </button>
            ) : (
              <button
                onClick={() => setCurrentQ((p) => Math.min(p + 1, totalQ - 1))}
                style={btnPrimary}
              >
                Next
              </button>
            )}
          </div>
        </div>

        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
      </SidebarLayout>
    );
  }

  // ========== RESULTS ==========
  if (view === "results" && results) {
    const me = results.find((r) => r.uid === uid);
    const rank = results.findIndex((r) => r.uid === uid) + 1;

    const getRankIcon = (r) => {
      if (r === 1) return "\uD83E\uDD47";
      if (r === 2) return "\uD83E\uDD48";
      if (r === 3) return "\uD83E\uDD49";
      return "#" + r;
    };

    return (
      <SidebarLayout>
        <div
          style={{ maxWidth: 740, margin: "0 auto", padding: "48px 32px 80px" }}
        >
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div
              style={{
                fontSize: 14,
                color: "#888",
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: "0.06em",
                marginBottom: 8,
              }}
            >
              Battle Complete
            </div>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 32,
                fontWeight: 700,
                margin: "0 0 6px",
                color: rank === 1 ? GOLD : "#FAFAFA",
              }}
            >
              {rank === 1
                ? "Victory!"
                : rank <= 3
                  ? "Great Fight!"
                  : "Battle Over"}
            </h1>
            <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
              Room {code}
            </p>
          </div>

          {/* Your Result */}
          {me && (
            <div
              style={{
                backgroundColor: "#111",
                border: "1px solid " + GOLD,
                borderRadius: 20,
                padding: "28px 32px",
                marginBottom: 28,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 14, color: "#888", marginBottom: 6 }}>
                Your Rank
              </div>
              <div style={{ fontSize: 48, marginBottom: 8 }}>
                {getRankIcon(rank)}
              </div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 700,
                  color: GOLD,
                  marginBottom: 4,
                }}
              >
                {me.score} / {me.total}
              </div>
              <div style={{ fontSize: 14, color: "#888" }}>
                {me.total > 0 ? Math.round((me.score / me.total) * 100) : 0}%
                correct
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div
            style={{
              backgroundColor: "#111",
              border: "1px solid #222",
              borderRadius: 16,
              padding: "20px 24px",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#666",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              Final Standings
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {results.map((r, i) => (
                <div
                  key={r.uid}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 16px",
                    borderRadius: 10,
                    backgroundColor:
                      r.uid === uid ? "rgba(212,160,23,0.06)" : "#0D0D0D",
                    border:
                      r.uid === uid
                        ? "1px solid rgba(212,160,23,0.2)"
                        : "1px solid #1a1a1a",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      textAlign: "center",
                      fontSize: i < 3 ? 22 : 14,
                      fontWeight: 700,
                      color:
                        i === 0
                          ? "#FFD700"
                          : i === 1
                            ? "#C0C0C0"
                            : i === 2
                              ? "#CD7F32"
                              : "#888",
                    }}
                  >
                    {getRankIcon(i + 1)}
                  </div>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      backgroundColor: r.uid === uid ? GOLD : "#333",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: r.uid === uid ? "#000" : "#aaa",
                    }}
                  >
                    {r.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      fontWeight: 700,
                      color: r.uid === uid ? GOLD : "#FAFAFA",
                      fontSize: 14,
                    }}
                  >
                    {r.name}{" "}
                    {r.uid === uid && (
                      <span
                        style={{ fontSize: 11, color: "#888", fontWeight: 500 }}
                      >
                        (you)
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color:
                        r.score >= r.total * 0.8
                          ? "#10B981"
                          : r.score >= r.total * 0.5
                            ? GOLD
                            : "#EF4444",
                    }}
                  >
                    {r.score}/{r.total}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Question Review */}
          <div
            style={{
              backgroundColor: "#111",
              border: "1px solid #222",
              borderRadius: 16,
              padding: "20px 24px",
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#666",
                textTransform: "uppercase",
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              Question Review
            </div>
            {room?.questions?.map((q, qi) => {
              const myAnswer = me?.details?.[qi];
              const isCorrect = myAnswer?.correct;
              return (
                <div
                  key={qi}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 10,
                    marginBottom: 8,
                    backgroundColor: isCorrect
                      ? "rgba(16,185,129,0.06)"
                      : "rgba(239,68,68,0.06)",
                    border:
                      "1px solid " +
                      (isCorrect
                        ? "rgba(16,185,129,0.2)"
                        : "rgba(239,68,68,0.2)"),
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 18, marginTop: 2 }}>
                      {isCorrect ? "\u2705" : "\u274C"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#FAFAFA",
                          fontSize: 14,
                          marginBottom: 4,
                        }}
                      >
                        {q.question}
                      </div>
                      <div style={{ fontSize: 12, color: "#888" }}>
                        Your answer:{" "}
                        <span
                          style={{ color: isCorrect ? "#10B981" : "#EF4444" }}
                        >
                          {myAnswer?.userAnswer != null
                            ? String.fromCharCode(65 + myAnswer.userAnswer) +
                              ". " +
                              q.options[myAnswer.userAnswer]
                            : "Skipped"}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#10B981",
                            marginTop: 2,
                          }}
                        >
                          Correct: {String.fromCharCode(65 + q.correctIndex)}.{" "}
                          {q.options[q.correctIndex]}
                        </div>
                      )}
                      {q.explanation && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#666",
                            marginTop: 4,
                            fontStyle: "italic",
                          }}
                        >
                          {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <button onClick={() => navigate("/arenas")} style={btnPrimary}>
              New Battle
            </button>
            <button onClick={() => navigate("/history")} style={btnSecondary}>
              View History
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Loading
  return (
    <SidebarLayout>
      <div
        style={{
          maxWidth: 740,
          margin: "0 auto",
          padding: "80px 32px",
          textAlign: "center",
          color: "#888",
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 12 }}>Loading battle...</div>
      </div>
    </SidebarLayout>
  );
}
