import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";

export default function DailyLoginPopup({ isOpen, onDismiss, xpGained, streak, level, isNewUser }) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPhase(0);
      const t1 = setTimeout(() => setPhase(1), 400);
      const t2 = setTimeout(() => setPhase(2), 1000);
      const t3 = setTimeout(() => setPhase(3), 1600);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getMessage = () => {
    if (isNewUser) return "Welcome to StudyBuddy!";
    if (streak >= 30) return "You're a legend!";
    if (streak >= 14) return "Incredible dedication!";
    if (streak >= 7) return "On fire this week!";
    if (streak >= 3) return "Nice streak going!";
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning!";
    if (hour < 18) return "Good afternoon!";
    return "Good evening!";
  };

  const getSubtitle = () => {
    if (isNewUser) return "Your learning journey starts now.";
    if (streak >= 7) return `${streak} days in a row — keep it up!`;
    if (streak >= 3) return `${streak}-day streak and counting.`;
    return "Ready to study today?";
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          cursor: "pointer",
          padding: 20,
        }}
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", damping: 14, stiffness: 260 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#111111",
            border: "2px solid #D4A017",
            borderRadius: 28,
            padding: "48px 52px",
            maxWidth: 440,
            width: "100%",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 0 80px rgba(212, 160, 23, 0.15), 0 24px 64px rgba(0,0,0,0.5)",
          }}
        >
          {/* Radial glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "radial-gradient(circle at 50% 30%, rgba(212,160,23,0.1) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          {/* Decorative particles */}
          {phase >= 1 && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.2, 0.8],
                    x: [0, (Math.random() - 0.5) * 200],
                    y: [0, -80 - Math.random() * 120],
                  }}
                  transition={{ duration: 1.5, delay: i * 0.1, ease: "easeOut" }}
                  style={{
                    position: "absolute",
                    top: "40%",
                    left: "50%",
                    fontSize: 18 + Math.random() * 10,
                    pointerEvents: "none",
                  }}
                >
                  {["✦", "⚡", "🔥", "✨", "⭐", "💫", "🎯", "🏆"][i]}
                </motion.div>
              ))}
            </>
          )}

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={phase >= 0 ? { scale: 1, rotate: 0 } : {}}
            transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.1 }}
            style={{ fontSize: 52, marginBottom: 18 }}
          >
            {isNewUser ? "🚀" : "☀️"}
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
          >
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 28,
                fontWeight: 700,
                color: "#FAFAFA",
                margin: "0 0 6px",
              }}
            >
              {getMessage()}
            </h2>
            <p style={{ fontSize: 14, color: "#888", margin: "0 0 28px" }}>
              {getSubtitle()}
            </p>
          </motion.div>

          {/* XP Gain - Big Centered Number */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={phase >= 2 ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: "spring", damping: 12, stiffness: 300 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 32px",
              borderRadius: 16,
              backgroundColor: "rgba(212,160,23,0.1)",
              border: "2px solid rgba(212,160,23,0.4)",
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 28 }}>⚡</span>
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "#D4A017",
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: 1,
              }}
            >
              +{xpGained} XP
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : {}}
            transition={{ duration: 0.3 }}
            style={{ fontSize: 13, color: "#888", marginBottom: 28 }}
          >
            Daily Login Bonus
          </motion.div>

          {/* Stats Row */}
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 28,
                marginBottom: 28,
                paddingTop: 20,
                borderTop: "1px solid #1C1C1C",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#D4A017", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Lv.{level}
                </div>
                <div style={{ fontSize: 11, color: "#666" }}>Level</div>
              </div>
              <div style={{ width: 1, backgroundColor: "#1C1C1C" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: streak > 0 ? "#EF4444" : "#555", fontFamily: "'Space Grotesk', sans-serif" }}>
                  🔥 {streak}
                </div>
                <div style={{ fontSize: 11, color: "#666" }}>Day Streak</div>
              </div>
            </motion.div>
          )}

          {/* Dismiss Button */}
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}
            >
              <button
                onClick={onDismiss}
                style={{
                  padding: "14px 40px",
                  borderRadius: 12,
                  backgroundColor: "#D4A017",
                  color: "#0A0A0A",
                  fontWeight: 700,
                  fontSize: 15,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'Space Grotesk', sans-serif",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(212,160,23,0.3)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                Start Studying
              </button>
              <button
                onClick={onDismiss}
                style={{
                  background: "none",
                  border: "none",
                  color: "#555",
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "6px 12px",
                }}
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
