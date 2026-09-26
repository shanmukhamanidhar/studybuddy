import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function XpGainToast({ toast }) {
  if (!toast) return null;

  const actionLabels = {
    session_complete: "Session Complete",
    session_reflection: "Reflection",
    quiz_complete: "Quiz Complete",
    quiz_perfect: "Perfect Score!",
    exam_complete: "Exam Complete",
    flashcard_generate: "Flashcards",
    battle_complete: "Battle Complete",
    battle_win: "Battle Won!",
    assignment_complete: "Assignment Done",
    assignment_early: "Early Bird",
    roadmap_milestone: "Milestone",
    daily_login: "Daily Login",
    daily_goal_hit: "Daily Goal Hit!",
  };

  return (
    <AnimatePresence>
      <motion.div
        key="xp-toast"
        initial={{ opacity: 0, y: 40, x: 0 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: 20 }}
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 9998,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 20px",
          borderRadius: 12,
          backgroundColor: "#111111",
          border: "1px solid #D4A017",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4), 0 0 20px rgba(212,160,23,0.15)",
        }}
      >
        <span style={{ fontSize: 18 }}>⚡</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#D4A017", fontFamily: "'Space Grotesk', sans-serif" }}>
            +{toast.xp} XP
          </div>
          <div style={{ fontSize: 11, color: "#888" }}>
            {actionLabels[toast.action] || toast.action}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
