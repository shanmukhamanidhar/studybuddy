import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useAuth } from "../context/AuthContext";
import { useSubjects } from "../hooks/useSubjects";
import { useGamification } from "../hooks/useGamification";
import { generateAcademicAiResponse } from "../utils/gemini";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function PracticePage() {
  const { currentUser } = useAuth();
  const { subjects } = useSubjects(currentUser?.uid);
  const { award } = useGamification(currentUser?.uid);
  const location = useLocation();

  const [activeTab, setActiveTab] = useState("quizzes"); // "quizzes" | "exams" | "flashcards"
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [topicPrompt, setTopicPrompt] = useState(location.state?.topic || "");
  const [difficulty, setDifficulty] = useState("Medium");

  useEffect(() => {
    if (location.state?.topic) {
      setTopicPrompt(location.state.topic);
    }
  }, [location.state]);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);

  // Active Interactive Mode State
  const [userAnswers, setUserAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  // Exam Grading State
  const [examAnswers, setExamAnswers] = useState({});
  const [examGrades, setExamGrades] = useState(null);
  const [isGrading, setIsGrading] = useState(false);

  // Error state
  const [generationError, setGenerationError] = useState(null);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) ||
    subjects[0] || {
      name: "General Academic",
      id: "general",
    };

  // Save practice session to Firestore history
  const saveToHistory = async (type, data) => {
    if (!currentUser?.uid) return;
    try {
      await addDoc(
        collection(db, "users", currentUser.uid, "practiceHistory"),
        {
          type,
          subjectName: selectedSubject?.name || "General",
          subjectId: selectedSubject?.id || "general",
          topic: topicPrompt.trim() || null,
          difficulty,
          ...data,
          createdAt: serverTimestamp(),
        },
      );
    } catch (err) {
      console.error("Failed to save practice history:", err);
    }
  };

  // Generate Quizzes / Exams / Flashcards via Gemini AI — NO FALLBACKS
  const handleGenerate = async (mode = activeTab) => {
    setIsGenerating(true);
    setGeneratedContent(null);
    setGenerationError(null);
    setUserAnswers({});
    setShowResults(false);
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
    setExamAnswers({});
    setExamGrades(null);

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (!apiKey) {
      setGenerationError(
        "VITE_GEMINI_API_KEY is not set in your .env file. Get a free key at aistudio.google.com/apikey and restart the dev server.",
      );
      setIsGenerating(false);
      return;
    }

    const subName = selectedSubject?.name || "General Academic";
    const topicText = topicPrompt.trim()
      ? `on topic "${topicPrompt.trim()}"`
      : "";

    let prompt = "";
    if (mode === "quizzes") {
      prompt = `Generate a 4-question multiple choice quiz for ${subName} ${topicText} (Difficulty: ${difficulty}).
Return ONLY a valid raw JSON array (no markdown, no backticks, no explanation):
[{"id":1,"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]`;
    } else if (mode === "exams") {
      prompt = `Generate a 3-question mock practice exam for ${subName} ${topicText} (Difficulty: ${difficulty}) with model answers.
Return ONLY a valid raw JSON array (no markdown, no backticks, no explanation):
[{"id":1,"title":"...","marks":10,"question":"...","modelAnswer":"..."}]`;
    } else if (mode === "flashcards") {
      prompt = `Generate 5 flashcards for spaced repetition studying in ${subName} ${topicText}.
Return ONLY a valid raw JSON array (no markdown, no backticks, no explanation):
[{"id":1,"front":"...","back":"...","topic":"..."}]`;
    }

    try {
      // Try gemini-2.0-flash first
      let res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        },
      );

      if (!res.ok) {
        // Try gemini-3.5-flash as fallback model
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          },
        );
      }

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gemini API returned ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error(
          "Gemini returned an empty response. No candidates or text found in API response.",
        );
      }

      const jsonText = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(jsonText);

      if (mode === "quizzes") {
        setGeneratedContent({ type: "quiz", questions: parsed });
      } else if (mode === "exams") {
        setGeneratedContent({ type: "exam", questions: parsed });
      } else if (mode === "flashcards") {
        setGeneratedContent({ type: "flashcard", cards: parsed });
      }
    } catch (err) {
      console.error("Gemini generation error:", err);
      setGenerationError(err.message || String(err));
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate Quiz Score
  const quizScore = useMemo(() => {
    if (!generatedContent || generatedContent.type !== "quiz" || !showResults)
      return null;
    let correct = 0;
    generatedContent.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) correct++;
    });
    return { score: correct, total: generatedContent.questions.length };
  }, [generatedContent, userAnswers, showResults]);

  // Grade Exam Answers with Gemini AI
  const handleGradeExam = async () => {
    if (!generatedContent || generatedContent.type !== "exam") return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (!apiKey) {
      setGenerationError("VITE_GEMINI_API_KEY is not set.");
      return;
    }

    const hasAnswers = generatedContent.questions.some((q) =>
      (examAnswers[q.id] || "").trim(),
    );
    if (!hasAnswers) {
      setGenerationError("Write at least one answer before grading.");
      return;
    }

    setIsGrading(true);
    setGenerationError(null);

    const questionsForGrading = generatedContent.questions.map((q) => ({
      id: q.id,
      question: q.question,
      marks: q.marks,
      modelAnswer: q.modelAnswer,
      studentAnswer: (examAnswers[q.id] || "").trim() || "(No answer provided)",
    }));

    const prompt = `You are an exam grader. Grade the following student answers against the model answers.
For each question, provide a score out of the maximum marks and brief feedback.

Questions and Answers:
${JSON.stringify(questionsForGrading, null, 2)}

Return ONLY a valid raw JSON array (no markdown, no backticks):
[{"id":1,"score":7,"maxMarks":10,"feedback":"Brief grading feedback"}]`;

    try {
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

      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Gemini API returned ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText)
        throw new Error("Gemini returned an empty grading response.");

      const jsonText = rawText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
      const grades = JSON.parse(jsonText);
      setExamGrades(grades);

      // Save exam results to history
      const scored = grades.reduce((sum, g) => sum + (g.score || 0), 0);
      const max = grades.reduce((sum, g) => sum + (g.maxMarks || 0), 0);
      saveToHistory("exam", {
        score: scored,
        total: max,
        questions: generatedContent.questions.map((q) => ({
          id: q.id,
          title: q.title,
          question: q.question,
          marks: q.marks,
          modelAnswer: q.modelAnswer,
          userAnswer:
            (examAnswers[q.id] || "").trim() || "(No answer provided)",
          grade: grades.find((g) => g.id === q.id) || null,
        })),
      });
      // Award XP for exam completion
      award("exam_complete", { difficulty });
    } catch (err) {
      console.error("Exam grading error:", err);
      setGenerationError(err.message || String(err));
    } finally {
      setIsGrading(false);
    }
  };

  // Total exam score
  const examTotalScore = useMemo(() => {
    if (!examGrades) return null;
    const scored = examGrades.reduce((sum, g) => sum + (g.score || 0), 0);
    const max = examGrades.reduce((sum, g) => sum + (g.maxMarks || 0), 0);
    return { scored, max };
  }, [examGrades]);

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
        {/* Header Title */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 6,
              backgroundColor: "rgba(212, 160, 23, 0.12)",
              border: "1px solid rgba(212, 160, 23, 0.3)",
              color: "#D4A017",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            🔥 Active Learning & Practice
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              margin: "0 0 6px",
            }}
          >
            Practice & AI Quizzes
          </h1>
          <p style={{ color: "#888888", fontSize: 15, margin: 0 }}>
            Generate exams, interactive quizzes, and spaced-repetition
            flashcards using Gemini AI.
          </p>
        </div>

        {/* Gemini API Key Warning */}
        {!import.meta.env.VITE_GEMINI_API_KEY && (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 12,
              padding: "14px 20px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div
                style={{
                  color: "#EF4444",
                  fontWeight: 700,
                  fontSize: 14,
                  marginBottom: 2,
                }}
              >
                Gemini AI Not Connected
              </div>
              <div style={{ color: "#AAA", fontSize: 13 }}>
                Add{" "}
                <code
                  style={{
                    backgroundColor: "#1A1A1A",
                    padding: "2px 6px",
                    borderRadius: 4,
                    color: "#D4A017",
                  }}
                >
                  VITE_GEMINI_API_KEY=your_key
                </code>{" "}
                to your{" "}
                <code
                  style={{
                    backgroundColor: "#1A1A1A",
                    padding: "2px 6px",
                    borderRadius: 4,
                    color: "#D4A017",
                  }}
                >
                  .env
                </code>{" "}
                file. Get a free key at{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3B82F6", textDecoration: "underline" }}
                >
                  aistudio.google.com/apikey
                </a>
                . Restart dev server after adding.
              </div>
            </div>
          </div>
        )}

        {/* Practice Mode Selector Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: "1px solid #1F1F1F",
            paddingBottom: 12,
            marginBottom: 28,
          }}
        >
          {[
            {
              id: "quizzes",
              label: "⚡ Quizzes",
              desc: "Interactive MCQs with grading",
            },
            {
              id: "exams",
              label: "🎯 Mock Exams",
              desc: "Short answer problem solving",
            },
            {
              id: "flashcards",
              label: "🃏 Flashcards",
              desc: "Spaced repetition recall",
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setGeneratedContent(null);
              }}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                backgroundColor:
                  activeTab === tab.id ? "#1A1A1A" : "transparent",
                border:
                  activeTab === tab.id
                    ? "1px solid #333"
                    : "1px solid transparent",
                color: activeTab === tab.id ? "#FAFAFA" : "#777",
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: 14,
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div>{tab.label}</div>
            </button>
          ))}
        </div>

        {/* AI Generator Control Box */}
        <div
          style={{
            backgroundColor: "#111111",
            border: "1px solid #222222",
            borderRadius: 16,
            padding: "24px",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 18 }}>✨</span>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "#FAFAFA",
              }}
            >
              Gemini AI{" "}
              {activeTab === "quizzes"
                ? "Quiz"
                : activeTab === "exams"
                  ? "Mock Exam"
                  : "Flashcard"}{" "}
              Generator
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.5fr 1fr",
              gap: 14,
              marginBottom: 20,
            }}
            className="generator-grid"
          >
            <div>
              <label
                style={{
                  fontSize: 12,
                  color: "#888",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Subject / Course
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  backgroundColor: "#0A0A0A",
                  border: "1px solid #282828",
                  color: "#FAFAFA",
                  fontSize: 13,
                }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: "#888",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Topic Focus (Optional)
              </label>
              <input
                type="text"
                placeholder='e.g., "CPU Scheduling" or "Deadlocks"'
                value={topicPrompt}
                onChange={(e) => setTopicPrompt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  backgroundColor: "#0A0A0A",
                  border: "1px solid #282828",
                  color: "#FAFAFA",
                  fontSize: 13,
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: "#888",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  backgroundColor: "#0A0A0A",
                  border: "1px solid #282828",
                  color: "#FAFAFA",
                  fontSize: 13,
                }}
              >
                <option value="Easy">Easy (Fundamentals)</option>
                <option value="Medium">Medium (Standard)</option>
                <option value="Hard">Hard (Exam Ready)</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => handleGenerate(activeTab)}
            disabled={isGenerating}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              backgroundColor: "#D4A017",
              color: "#0A0A0A",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: isGenerating ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {isGenerating ? (
              <span>✨ Gemini Generating {activeTab}...</span>
            ) : (
              <span>
                ⚡ Generate{" "}
                {activeTab === "quizzes"
                  ? "Quiz"
                  : activeTab === "exams"
                    ? "Mock Exam"
                    : "Flashcards"}{" "}
                Now
              </span>
            )}
          </button>
        </div>

        {/* Display Area for Practice Content */}
        {generationError ? (
          <div
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: 16,
              padding: "28px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>❌</div>
            <h4
              style={{
                margin: "0 0 8px",
                fontSize: 17,
                color: "#EF4444",
                fontWeight: 700,
              }}
            >
              Gemini AI Error
            </h4>
            <p
              style={{
                color: "#CCC",
                fontSize: 13,
                margin: "0 0 16px",
                maxWidth: 600,
                marginInline: "auto",
                lineHeight: 1.6,
                wordBreak: "break-word",
              }}
            >
              {generationError}
            </p>
            <button
              onClick={() => {
                setGenerationError(null);
                handleGenerate(activeTab);
              }}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                backgroundColor: "#D4A017",
                color: "#000",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              🔄 Retry with Gemini
            </button>
          </div>
        ) : isGenerating ? (
          <div style={{ textAlign: "center", padding: 60, color: "#777" }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>🤖</div>
            <p>
              Gemini AI is generating {activeTab} for {selectedSubject?.name}...
            </p>
          </div>
        ) : !generatedContent ? (
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
              Ready to test your knowledge?
            </h4>
            <p style={{ color: "#777", fontSize: 13, margin: "0 0 20px" }}>
              Select a course above and click Generate — Gemini AI will create
              real questions for you.
            </p>
            <button
              onClick={() => handleGenerate(activeTab)}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                backgroundColor: "#1F1F1F",
                border: "1px solid #333",
                color: "#D4A017",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ⚡ Generate with Gemini AI
            </button>
          </div>
        ) : (
          <div>
            {/* QUIZ VIEW */}
            {generatedContent.type === "quiz" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 20 }}
              >
                {generatedContent.questions.map((q, qIdx) => (
                  <div
                    key={q.id || qIdx}
                    style={{
                      backgroundColor: "#111111",
                      border: "1px solid #222",
                      borderRadius: 16,
                      padding: "24px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "#D4A017",
                        fontWeight: 700,
                        marginBottom: 6,
                      }}
                    >
                      Question {qIdx + 1} of {generatedContent.questions.length}
                    </div>
                    <h3
                      style={{
                        fontSize: 17,
                        color: "#FAFAFA",
                        margin: "0 0 16px",
                        fontWeight: 600,
                      }}
                    >
                      {q.question}
                    </h3>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                        marginBottom: 16,
                      }}
                    >
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[q.id] === optIdx;
                        const isCorrect = q.correctIndex === optIdx;
                        let btnBg = "#161616";
                        let btnBorder = "#282828";
                        let btnColor = "#CCC";

                        if (showResults) {
                          if (isCorrect) {
                            btnBg = "rgba(16, 185, 129, 0.15)";
                            btnBorder = "#10B981";
                            btnColor = "#10B981";
                          } else if (isSelected) {
                            btnBg = "rgba(239, 68, 68, 0.15)";
                            btnBorder = "#EF4444";
                            btnColor = "#EF4444";
                          }
                        } else if (isSelected) {
                          btnBg = "rgba(212, 160, 23, 0.15)";
                          btnBorder = "#D4A017";
                          btnColor = "#FAFAFA";
                        }

                        return (
                          <button
                            key={optIdx}
                            disabled={showResults}
                            onClick={() =>
                              setUserAnswers({ ...userAnswers, [q.id]: optIdx })
                            }
                            style={{
                              padding: "12px 16px",
                              borderRadius: 10,
                              backgroundColor: btnBg,
                              border: `1px solid ${btnBorder}`,
                              color: btnColor,
                              fontSize: 14,
                              textAlign: "left",
                              cursor: showResults ? "default" : "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <span style={{ fontWeight: 700, marginRight: 10 }}>
                              {String.fromCharCode(65 + optIdx)}.
                            </span>{" "}
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {showResults && (
                      <div
                        style={{
                          backgroundColor: "#0E0E0E",
                          borderLeft: "3px solid #D4A017",
                          padding: "12px 16px",
                          borderRadius: "0 8px 8px 0",
                          color: "#AAA",
                          fontSize: 13,
                        }}
                      >
                        💡 <strong>Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 12,
                  }}
                >
                  {!showResults ? (
                    <button
                      onClick={() => {
                        setShowResults(true);
                        // Save quiz results to history
                        let correct = 0;
                        generatedContent.questions.forEach((q) => {
                          if (userAnswers[q.id] === q.correctIndex) correct++;
                        });
                        saveToHistory("quiz", {
                          score: correct,
                          total: generatedContent.questions.length,
                          questions: generatedContent.questions.map((q) => ({
                            id: q.id,
                            question: q.question,
                            options: q.options,
                            correctIndex: q.correctIndex,
                            explanation: q.explanation,
                            userAnswer: userAnswers[q.id] ?? null,
                          })),
                        });
                        // Award XP for quiz completion
                        award("quiz_complete", {
                          score: correct,
                          total: generatedContent.questions.length,
                          difficulty,
                        });
                        if (correct === generatedContent.questions.length) {
                          award("quiz_perfect", { difficulty });
                        }
                      }}
                      disabled={Object.keys(userAnswers).length === 0}
                      style={{
                        padding: "12px 28px",
                        borderRadius: 10,
                        backgroundColor: "#10B981",
                        color: "#000",
                        fontWeight: 700,
                        border: "none",
                        cursor:
                          Object.keys(userAnswers).length > 0
                            ? "pointer"
                            : "not-allowed",
                      }}
                    >
                      Submit & Grade Quiz
                    </button>
                  ) : (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <span
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#10B981",
                        }}
                      >
                        Score: {quizScore?.score} / {quizScore?.total}
                      </span>
                      <button
                        onClick={() => handleGenerate("quizzes")}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 8,
                          backgroundColor: "#D4A017",
                          color: "#000",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Try Another Quiz
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* EXAM VIEW */}
            {generatedContent.type === "exam" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 24 }}
              >
                {generatedContent.questions.map((q, idx) => {
                  const grade = examGrades?.find((g) => g.id === q.id);
                  return (
                    <div
                      key={q.id || idx}
                      style={{
                        backgroundColor: "#111111",
                        border: grade
                          ? `1px solid ${grade.score >= grade.maxMarks * 0.7 ? "#10B981" : grade.score >= grade.maxMarks * 0.4 ? "#D4A017" : "#EF4444"}`
                          : "1px solid #222",
                        borderRadius: 16,
                        padding: "28px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#D4A017",
                          }}
                        >
                          {q.title}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {grade && (
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color:
                                  grade.score >= grade.maxMarks * 0.7
                                    ? "#10B981"
                                    : grade.score >= grade.maxMarks * 0.4
                                      ? "#D4A017"
                                      : "#EF4444",
                                backgroundColor: "#1A1A1A",
                                padding: "3px 10px",
                                borderRadius: 6,
                              }}
                            >
                              {grade.score}/{grade.maxMarks}
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 12,
                              color: "#777",
                              backgroundColor: "#1A1A1A",
                              padding: "3px 10px",
                              borderRadius: 6,
                            }}
                          >
                            [{q.marks} Marks]
                          </span>
                        </div>
                      </div>

                      <p
                        style={{
                          fontSize: 16,
                          color: "#FAFAFA",
                          lineHeight: 1.6,
                          marginBottom: 20,
                        }}
                      >
                        {q.question}
                      </p>

                      <div style={{ marginBottom: 16 }}>
                        <label
                          style={{
                            fontSize: 12,
                            color: "#888",
                            display: "block",
                            marginBottom: 6,
                          }}
                        >
                          Your Answer:
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Write your answer here..."
                          value={examAnswers[q.id] || ""}
                          onChange={(e) =>
                            setExamAnswers({
                              ...examAnswers,
                              [q.id]: e.target.value,
                            })
                          }
                          disabled={!!examGrades}
                          style={{
                            width: "100%",
                            padding: 12,
                            borderRadius: 8,
                            backgroundColor: "#0D0D0D",
                            border: "1px solid #282828",
                            color: "#FAFAFA",
                            fontSize: 13,
                            outline: "none",
                            boxSizing: "border-box",
                            opacity: examGrades ? 0.7 : 1,
                          }}
                        />
                      </div>

                      {/* Gemini AI Grade Feedback */}
                      {grade && (
                        <div
                          style={{
                            backgroundColor: "rgba(212, 160, 23, 0.08)",
                            borderLeft: `3px solid ${grade.score >= grade.maxMarks * 0.7 ? "#10B981" : grade.score >= grade.maxMarks * 0.4 ? "#D4A017" : "#EF4444"}`,
                            padding: "12px 16px",
                            borderRadius: "0 8px 8px 0",
                            marginBottom: 12,
                            fontSize: 13,
                            color: "#CCC",
                            lineHeight: 1.6,
                          }}
                        >
                          <strong style={{ color: "#D4A017" }}>
                            🤖 Gemini Feedback:
                          </strong>{" "}
                          {grade.feedback}
                        </div>
                      )}

                      <details style={{ cursor: "pointer" }}>
                        <summary
                          style={{
                            fontSize: 13,
                            color: "#10B981",
                            fontWeight: 600,
                          }}
                        >
                          🔍 View Model Solution
                        </summary>
                        <div
                          style={{
                            marginTop: 12,
                            padding: 16,
                            backgroundColor: "#0A0A0A",
                            border: "1px solid #222",
                            borderRadius: 10,
                            color: "#CCC",
                            fontSize: 13,
                            lineHeight: 1.6,
                          }}
                        >
                          {q.modelAnswer}
                        </div>
                      </details>
                    </div>
                  );
                })}

                {/* Grade Button & Score Display */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 8,
                  }}
                >
                  {!examGrades ? (
                    <button
                      onClick={handleGradeExam}
                      disabled={
                        isGrading ||
                        !Object.values(examAnswers).some((a) => a?.trim())
                      }
                      style={{
                        padding: "12px 28px",
                        borderRadius: 10,
                        backgroundColor: isGrading ? "#333" : "#10B981",
                        color: "#000",
                        fontWeight: 700,
                        fontSize: 14,
                        border: "none",
                        cursor: isGrading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {isGrading
                        ? "🤖 Gemini Grading..."
                        : "🎯 Grade Exam with Gemini AI"}
                    </button>
                  ) : (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <div
                        style={{
                          padding: "12px 20px",
                          borderRadius: 10,
                          backgroundColor: "#111",
                          border: "1px solid #333",
                        }}
                      >
                        <span style={{ fontSize: 13, color: "#888" }}>
                          Total Score:{" "}
                        </span>
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color:
                              examTotalScore &&
                              examTotalScore.scored >= examTotalScore.max * 0.7
                                ? "#10B981"
                                : examTotalScore &&
                                    examTotalScore.scored >=
                                      examTotalScore.max * 0.4
                                  ? "#D4A017"
                                  : "#EF4444",
                          }}
                        >
                          {examTotalScore?.scored} / {examTotalScore?.max}
                        </span>
                      </div>
                      <button
                        onClick={() => handleGenerate("exams")}
                        style={{
                          padding: "10px 20px",
                          borderRadius: 8,
                          backgroundColor: "#D4A017",
                          color: "#000",
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        Generate New Exam
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FLASHCARDS VIEW */}
            {generatedContent.type === "flashcard" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "20px 0",
                }}
              >
                {generatedContent.cards &&
                  generatedContent.cards.length > 0 && (
                    <div style={{ maxWidth: 540, width: "100%" }}>
                      <div
                        style={{
                          textAlign: "center",
                          color: "#777",
                          fontSize: 13,
                          marginBottom: 14,
                        }}
                      >
                        Card {flashcardIndex + 1} of{" "}
                        {generatedContent.cards.length}
                      </div>

                      {/* Interactive Flip Card */}
                      <div
                        onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                        style={{
                          backgroundColor: "#141414",
                          border: "1px solid #282828",
                          borderRadius: 20,
                          padding: "48px 36px",
                          minHeight: 220,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          textAlign: "center",
                          boxShadow: "0 12px 36px rgba(0,0,0,0.5)",
                          transition: "transform 0.2s ease",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            color: "#D4A017",
                            textTransform: "uppercase",
                            letterSpacing: "0.06em",
                            marginBottom: 14,
                          }}
                        >
                          {flashcardFlipped
                            ? "💡 Answer / Explanation"
                            : "❓ Question / Concept (Click to Flip)"}
                        </span>
                        <h3
                          style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: "#FAFAFA",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {flashcardFlipped
                            ? generatedContent.cards[flashcardIndex].back
                            : generatedContent.cards[flashcardIndex].front}
                        </h3>
                      </div>

                      {/* Controls */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginTop: 24,
                        }}
                      >
                        <button
                          disabled={flashcardIndex === 0}
                          onClick={() => {
                            setFlashcardIndex(flashcardIndex - 1);
                            setFlashcardFlipped(false);
                          }}
                          style={{
                            padding: "10px 20px",
                            borderRadius: 8,
                            backgroundColor: "#1A1A1A",
                            border: "1px solid #333",
                            color: flashcardIndex === 0 ? "#444" : "#FAFAFA",
                            cursor:
                              flashcardIndex === 0 ? "default" : "pointer",
                          }}
                        >
                          ← Previous
                        </button>

                        <button
                          onClick={() => setFlashcardFlipped(!flashcardFlipped)}
                          style={{
                            padding: "10px 20px",
                            borderRadius: 8,
                            backgroundColor: "#D4A017",
                            color: "#000",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          🔄 Flip Card
                        </button>

                        <button
                          disabled={
                            flashcardIndex === generatedContent.cards.length - 1
                          }
                          onClick={() => {
                            setFlashcardIndex(flashcardIndex + 1);
                            setFlashcardFlipped(false);
                          }}
                          style={{
                            padding: "10px 20px",
                            borderRadius: 8,
                            backgroundColor: "#1A1A1A",
                            border: "1px solid #333",
                            color:
                              flashcardIndex ===
                              generatedContent.cards.length - 1
                                ? "#444"
                                : "#FAFAFA",
                            cursor:
                              flashcardIndex ===
                              generatedContent.cards.length - 1
                                ? "default"
                                : "pointer",
                          }}
                        >
                          Next →
                        </button>
                      </div>

                      {/* Save Flashcard Deck to History */}
                      <div style={{ textAlign: "center", marginTop: 20 }}>
                        <button
                          onClick={() => {
                            saveToHistory("flashcard", {
                              totalCards: generatedContent.cards.length,
                              cards: generatedContent.cards.map((c) => ({
                                id: c.id,
                                front: c.front,
                                back: c.back,
                                topic: c.topic,
                              })),
                            });
                            award("flashcard_generate", { difficulty });
                          }}
                          style={{
                            padding: "10px 20px",
                            borderRadius: 8,
                            backgroundColor: "#1F1F1F",
                            border: "1px solid #333",
                            color: "#D4A017",
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          💾 Save Deck to History
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
