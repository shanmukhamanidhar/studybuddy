import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useAuth } from "../context/AuthContext";
import RoadmapVisual from "../components/RoadmapVisual";
import { practiceHistoryDb, studySessionsDb, roadmapsDb } from "../lib/supabaseDb";
import { HistoryCardSkeleton, TabBarSkeleton } from "../components/studyspace/SkeletonLoader";

export default function HistoryPage() {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [viewingRoadmap, setViewingRoadmap] = useState(null);

  useEffect(() => {
    if (!currentUser?.uid) return;
    setLoading(true);

    let loaded = 0;
    const checkDone = () => {
      loaded++;
      if (loaded === 3) setLoading(false);
    };

    const unsubHistory = practiceHistoryDb.subscribe(currentUser.uid, (items) => {
      setHistory(items.map((d) => ({ ...d, _collection: "practiceHistory" })));
      checkDone();
    });

    const unsubSessions = studySessionsDb.subscribe(currentUser.uid, (items) => {
      setSessions(items.map((d) => ({ ...d, _collection: "studySessions" })));
      checkDone();
    });

    const unsubRoadmaps = roadmapsDb.subscribe(currentUser.uid, (items) => {
      setRoadmaps(items.map((d) => ({ ...d, _collection: "roadmaps" })));
      checkDone();
    });

    return () => {
      unsubHistory();
      unsubSessions();
      unsubRoadmaps();
    };
  }, [currentUser?.uid]);

  const allItems = [...history, ...sessions, ...roadmaps].sort((a, b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
    return tb - ta;
  });

  const filtered =
    filter === "all"
      ? allItems
      : filter === "roadmap"
        ? roadmaps
        : allItems.filter((h) => h.type === filter);

  const handleDelete = async (item) => {
    if (!currentUser?.uid) return;
    try {
      const col = item._collection || "practiceHistory";
      if (col === "practiceHistory") await practiceHistoryDb.delete(item.id);
      else if (col === "studySessions") await studySessionsDb.delete(item.id);
      else if (col === "roadmaps") await roadmapsDb.delete(item.id);
    } catch (err) {
      console.error("Failed to delete history item:", err);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return "Unknown date";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(date.getTime())) return "Unknown date";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const typeConfig = {
    study: { icon: "📚", label: "Study Session", color: "#3B82F6" },
    quiz: { icon: "⚡", label: "Quiz", color: "#10B981" },
    exam: { icon: "🎯", label: "Mock Exam", color: "#D4A017" },
    flashcard: { icon: "🃏", label: "Flashcard", color: "#8B5CF6" },
    roadmap: { icon: "🗺️", label: "Roadmap", color: "#F97316" },
  };

  return (
    <SidebarLayout>
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "40px 24px 80px",
          color: "#FAFAFA",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 6,
              backgroundColor: "rgba(59, 130, 246, 0.12)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              color: "#3B82F6",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            📊 History
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              margin: "0 0 6px",
            }}
          >
            History
          </h1>
          <p style={{ color: "#888888", fontSize: 15, margin: 0 }}>
            Review your study sessions, quizzes, mock exams, and flashcards.
          </p>
        </div>

        {/* Filter Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {[
            { id: "all", label: "All" },
            { id: "study", label: "📚 Study Sessions" },
            { id: "quiz", label: "⚡ Quizzes" },
            { id: "exam", label: "🎯 Exams" },
            { id: "flashcard", label: "🃏 Flashcards" },
            { id: "roadmap", label: "🗺️ Roadmaps" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                backgroundColor:
                  filter === tab.id ? "#1A1A1A" : "transparent",
                border:
                  filter === tab.id
                    ? "1px solid #333"
                    : "1px solid transparent",
                color: filter === tab.id ? "#FAFAFA" : "#777",
                fontWeight: filter === tab.id ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <>
            <TabBarSkeleton count={6} />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 5 }).map((_, i) => <HistoryCardSkeleton key={i} />)}
            </div>
          </>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              backgroundColor: "#0D0D0D",
              border: "1px dashed #222",
              borderRadius: 16,
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
            <h4 style={{ margin: "0 0 6px", fontSize: 17, color: "#FAFAFA" }}>
              No history yet
            </h4>
            <p style={{ color: "#777", fontSize: 13, margin: 0 }}>
              Complete a study session, quiz, exam, or flashcard deck to see it
              here.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map((item) => {
              const isRoadmap = item._collection === "roadmaps" || item.nodes;
              const itemType = isRoadmap ? "roadmap" : item.type;
              const config = typeConfig[itemType] || typeConfig.quiz;
              const isExpanded = expandedId === item.id;
              const isStudySession = item.type === "study";

              return (
                <motion.div
                  key={item.id}
                  layout
                  style={{
                    backgroundColor: "#111111",
                    border: "1px solid #222",
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                >
                  {/* Summary Row */}
                  <div
                    onClick={() =>
                      setExpandedId(isExpanded ? null : item.id)
                    }
                    style={{
                      padding: "20px 24px",
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#161616")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "transparent")
                    }
                  >
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 10,
                        backgroundColor: `${config.color}15`,
                        border: `1px solid ${config.color}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {config.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </span>
                        {!isStudySession && item.difficulty && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "#555",
                              backgroundColor: "#1A1A1A",
                              padding: "2px 8px",
                              borderRadius: 4,
                            }}
                          >
                            {item.difficulty}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#FAFAFA",
                          marginBottom: 2,
                        }}
                      >
                        {isRoadmap ? (item.title || "Untitled Roadmap") : (item.subjectName || "General")}
                        {!isRoadmap && !isStudySession && item.topic && (
                          <span style={{ color: "#888", fontWeight: 400 }}>
                            {" "}
                            — {item.topic}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {formatDate(item.createdAt)}
                        {isStudySession &&
                          item.actualMinutes &&
                          ` · ${item.actualMinutes} min`}
                      </div>
                    </div>

                    {/* Study Session Duration Badge */}
                    {isStudySession && (
                      <div
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          backgroundColor: "#1A1A1A",
                          border: "1px solid #333",
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#3B82F6",
                          }}
                        >
                          {item.actualMinutes || "?"}
                        </div>
                        <div style={{ fontSize: 11, color: "#777" }}>min</div>
                      </div>
                    )}

                    {/* Quiz Score Badge */}
                    {item.type === "quiz" &&
                      item.score != null &&
                      item.total != null && (
                        <div
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            backgroundColor: "#1A1A1A",
                            border: "1px solid #333",
                            textAlign: "center",
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color:
                                item.score / item.total >= 0.7
                                  ? "#10B981"
                                  : item.score / item.total >= 0.4
                                    ? "#D4A017"
                                    : "#EF4444",
                            }}
                          >
                            {Math.round((item.score / item.total) * 100)}%
                          </div>
                          <div style={{ fontSize: 11, color: "#777" }}>
                            {item.score}/{item.total}
                          </div>
                        </div>
                      )}

                    {/* Exam Score Badge */}
                    {item.type === "exam" &&
                      item.score != null &&
                      item.total != null && (
                        <div
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            backgroundColor: "#1A1A1A",
                            border: "1px solid #333",
                            textAlign: "center",
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color:
                                item.score / item.total >= 0.7
                                  ? "#10B981"
                                  : item.score / item.total >= 0.4
                                    ? "#D4A017"
                                    : "#EF4444",
                            }}
                          >
                            {item.score}/{item.total}
                          </div>
                          <div style={{ fontSize: 11, color: "#777" }}>
                            marks
                          </div>
                        </div>
                      )}

                    {/* Flashcard Count Badge */}
                    {item.type === "flashcard" && item.totalCards && (
                      <div
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          backgroundColor: "#1A1A1A",
                          border: "1px solid #333",
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#8B5CF6",
                          }}
                        >
                          {item.totalCards}
                        </div>
                        <div style={{ fontSize: 11, color: "#777" }}>
                          cards
                        </div>
                      </div>
                    )}

                    {/* Roadmap Progress Badge */}
                    {isRoadmap && item.nodes && (
                      <div
                        style={{
                          padding: "6px 14px",
                          borderRadius: 8,
                          backgroundColor: "#1A1A1A",
                          border: "1px solid #333",
                          textAlign: "center",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#F97316",
                          }}
                        >
                          {item.nodes.filter((n) => n.status === "completed").length}/{item.nodes.length}
                        </div>
                        <div style={{ fontSize: 11, color: "#777" }}>
                          milestones
                        </div>
                      </div>
                    )}

                    {/* Expand Arrow */}
                    <span
                      style={{
                        fontSize: 14,
                        color: "#555",
                        transform: isExpanded
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      ▼
                    </span>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div
                          style={{
                            padding: "0 24px 20px",
                            borderTop: "1px solid #1C1C1C",
                          }}
                        >
                          {/* Study Session Details */}
                          {isStudySession && (
                            <div style={{ paddingTop: 16 }}>
                              {item.plannedMinutes && (
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#888",
                                    marginBottom: 12,
                                  }}
                                >
                                  Planned: {item.plannedMinutes} min · Actual:{" "}
                                  {item.actualMinutes} min
                                </div>
                              )}

                              {item.learned && (
                                <div
                                  style={{
                                    padding: "12px 16px",
                                    marginBottom: 10,
                                    borderRadius: 10,
                                    backgroundColor: "#0D0D0D",
                                    border: "1px solid rgba(16, 185, 129, 0.3)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "#10B981",
                                      marginBottom: 4,
                                    }}
                                  >
                                    ✓ What I Learned
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: "#CCC",
                                      lineHeight: 1.5,
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {item.learned}
                                  </div>
                                </div>
                              )}

                              {item.wishedLearned && (
                                <div
                                  style={{
                                    padding: "12px 16px",
                                    marginBottom: 10,
                                    borderRadius: 10,
                                    backgroundColor: "#0D0D0D",
                                    border: "1px solid rgba(212, 160, 23, 0.3)",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "#D4A017",
                                      marginBottom: 4,
                                    }}
                                  >
                                    💡 What I Wished I Learned
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: "#CCC",
                                      lineHeight: 1.5,
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {item.wishedLearned}
                                  </div>
                                </div>
                              )}

                              {item.dailyPlanSnapshot && (
                                <div
                                  style={{
                                    padding: "12px 16px",
                                    borderRadius: 10,
                                    backgroundColor: "#0D0D0D",
                                    border: "1px solid #222",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "#3B82F6",
                                      marginBottom: 6,
                                    }}
                                  >
                                    📋 Daily Plan
                                  </div>
                                  {item.dailyPlanSnapshot.summary && (
                                    <div
                                      style={{
                                        fontSize: 13,
                                        color: "#AAA",
                                        marginBottom: 6,
                                      }}
                                    >
                                      {item.dailyPlanSnapshot.summary}
                                    </div>
                                  )}
                                  {item.dailyPlanSnapshot.blocks?.map(
                                    (b, i) => (
                                      <div
                                        key={i}
                                        style={{
                                          fontSize: 12,
                                          color: "#777",
                                          marginBottom: 2,
                                        }}
                                      >
                                        · {b.subject}: {b.topic}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quiz Details */}
                          {item.type === "quiz" && item.questions && (
                            <div style={{ paddingTop: 16 }}>
                              {item.questions.map((q, idx) => {
                                const isCorrect =
                                  q.userAnswer === q.correctIndex;
                                return (
                                  <div
                                    key={q.id || idx}
                                    style={{
                                      padding: "12px 16px",
                                      marginBottom: 10,
                                      borderRadius: 10,
                                      backgroundColor: "#0D0D0D",
                                      border: `1px solid ${isCorrect ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: isCorrect
                                          ? "#10B981"
                                          : "#EF4444",
                                        marginBottom: 4,
                                      }}
                                    >
                                      {isCorrect
                                        ? "✓ Correct"
                                        : "✗ Incorrect"}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 14,
                                        color: "#FAFAFA",
                                        marginBottom: 6,
                                      }}
                                    >
                                      {q.question}
                                    </div>
                                    {q.explanation && (
                                      <div
                                        style={{
                                          fontSize: 12,
                                          color: "#AAA",
                                          lineHeight: 1.5,
                                        }}
                                      >
                                        {q.explanation}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Exam Details */}
                          {item.type === "exam" && item.questions && (
                            <div style={{ paddingTop: 16 }}>
                              {item.questions.map((q, idx) => (
                                <div
                                  key={q.id || idx}
                                  style={{
                                    padding: "12px 16px",
                                    marginBottom: 10,
                                    borderRadius: 10,
                                    backgroundColor: "#0D0D0D",
                                    border: "1px solid #222",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      marginBottom: 4,
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 12,
                                        fontWeight: 700,
                                        color: "#D4A017",
                                      }}
                                    >
                                      {q.title}
                                    </span>
                                    {q.grade && (
                                      <span
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 700,
                                          color:
                                            q.grade.score >=
                                            q.grade.maxMarks * 0.7
                                              ? "#10B981"
                                              : q.grade.score >=
                                                  q.grade.maxMarks * 0.4
                                                ? "#D4A017"
                                                : "#EF4444",
                                        }}
                                      >
                                        {q.grade.score}/{q.grade.maxMarks}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: "#CCC",
                                      marginBottom: 8,
                                    }}
                                  >
                                    {q.question}
                                  </div>
                                  {q.grade?.feedback && (
                                    <div
                                      style={{
                                        fontSize: 12,
                                        color: "#AAA",
                                        backgroundColor: "#161616",
                                        padding: "8px 12px",
                                        borderRadius: 6,
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      <strong style={{ color: "#D4A017" }}>
                                        Feedback:{" "}
                                      </strong>
                                      {q.grade.feedback}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                           {/* Flashcard Details */}
                          {item.type === "flashcard" && item.cards && (
                            <div style={{ paddingTop: 16 }}>
                              {item.cards.map((c, idx) => (
                                <div
                                  key={c.id || idx}
                                  style={{
                                    padding: "12px 16px",
                                    marginBottom: 10,
                                    borderRadius: 10,
                                    backgroundColor: "#0D0D0D",
                                    border: "1px solid #222",
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: "#FAFAFA",
                                      marginBottom: 6,
                                    }}
                                  >
                                    {c.front}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      color: "#8B5CF6",
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {c.back}
                                  </div>
                                  {c.topic && (
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "#777",
                                        marginTop: 6,
                                      }}
                                    >
                                      Topic: {c.topic}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Roadmap Details */}
                          {isRoadmap && (
                            <div style={{ paddingTop: 16 }}>
                              {item.description && (
                                <p style={{ fontSize: 13, color: "#AAA", margin: "0 0 12px" }}>
                                  {item.description}
                                </p>
                              )}
                              {item.nodes && (
                                <RoadmapVisual
                                  roadmap={item}
                                  onToggleStatus={() => {}}
                                />
                              )}
                            </div>
                          )}

                          {/* Delete Button */}
                          <div
                            style={{
                              marginTop: 12,
                              textAlign: "right",
                            }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(item);
                              }}
                              style={{
                                padding: "6px 14px",
                                borderRadius: 6,
                                backgroundColor: "transparent",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                                color: "#EF4444",
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              🗑 Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
