import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useSubjects } from "../hooks/useSubjects";
import { generateAcademicAiResponse } from "../utils/gemini";
import { db } from "../firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";

export default function AiAssistantPage() {
  const { currentUser, userProfile } = useAuth();
  const { subjects } = useSubjects(currentUser?.uid);

  const [assignments, setAssignments] = useState([]);
  const [exams, setExams] = useState([]);

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `Hello ${userProfile?.aboutYou?.preferredName || "Student"}! I am your AI Academic Assistant. I have full context of your enrolled subjects, pending assignments, and target goals. How can I assist your studies today?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsubA = onSnapshot(collection(db, "users", currentUser.uid, "assignments"), (snap) => {
      setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubE = onSnapshot(collection(db, "users", currentUser.uid, "exams"), (snap) => {
      setExams(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubA();
      unsubE();
    };
  }, [currentUser]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    const userContext = {
      name: userProfile?.aboutYou?.preferredName || currentUser?.displayName || "Student",
      program: userProfile?.academicInfo?.program,
      branch: userProfile?.academicInfo?.branch,
      semester: userProfile?.academicInfo?.semester,
      subjects,
      assignments,
      exams,
      goals: userProfile?.goals,
    };

    const aiText = await generateAcademicAiResponse(userText, userContext);
    setMessages((prev) => [...prev, { sender: "ai", text: aiText }]);
    setLoading(false);
  };

  const samplePrompts = [
    "What should I study today?",
    "How should I prioritize my pending assignments?",
    "How should I prepare for my upcoming exams?",
    "Rearrange my daily study schedule",
  ];

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px 40px", display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 28 }}>🤖</span>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, margin: 0, color: "#FAFAFA" }}>
              AI Academic Assistant
            </h1>
          </div>
          <p style={{ color: "#A3A3A3", fontSize: 14, margin: "4px 0 0" }}>
            Intelligent guidance powered by Gemini AI with complete awareness of your academic context.
          </p>
        </div>

        {/* Quick Sample Prompts */}
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, marginBottom: 16 }}>
          {samplePrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInput(promptText);
              }}
              style={{
                padding: "8px 14px",
                borderRadius: 100,
                backgroundColor: "#171717",
                border: "1px solid #282828",
                color: "#D4A017",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              ✨ {promptText}
            </button>
          ))}
        </div>

        {/* Chat History Box */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#111111",
            border: "1px solid #222222",
            borderRadius: 20,
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginBottom: 20,
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                backgroundColor: msg.sender === "user" ? "#D4A017" : "#1A1A1A",
                color: msg.sender === "user" ? "#0A0A0A" : "#FAFAFA",
                padding: "14px 18px",
                borderRadius: msg.sender === "user" ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                fontSize: 14,
                lineHeight: 1.6,
                boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start", backgroundColor: "#1A1A1A", color: "#888888", padding: "12px 16px", borderRadius: 14, fontSize: 13 }}>
              Thinking and analyzing your academic context...
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSend} style={{ display: "flex", gap: 12 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your Academic Assistant anything..."
            style={{
              flex: 1,
              padding: "14px 20px",
              borderRadius: 14,
              backgroundColor: "#111111",
              border: "1px solid #242424",
              color: "#FAFAFA",
              fontSize: 15,
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px 28px",
              borderRadius: 14,
              backgroundColor: "#D4A017",
              color: "#0A0A0A",
              fontWeight: 700,
              fontSize: 15,
              border: "none",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </SidebarLayout>
  );
}
