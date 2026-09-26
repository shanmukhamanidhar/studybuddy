import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SessionReflection({
  isOpen,
  sessionData,
  subjectName,
  onSave,
  onSkip,
  onSuggestQuiz,
}) {
  const [learned, setLearned] = useState("");
  const [wishedLearned, setWishedLearned] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      ...sessionData,
      subjectName,
      learned: learned.trim(),
      wishedLearned: wishedLearned.trim(),
    });
    setLearned("");
    setWishedLearned("");
    setSaving(false);
  };

  const handleSkip = () => {
    setLearned("");
    setWishedLearned("");
    onSkip?.();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          style={{
            backgroundColor: "#111111",
            border: "1px solid #222",
            borderRadius: 20,
            padding: "36px 40px",
            maxWidth: 560,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: 6,
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                color: "#10B981",
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              ✅ Session Complete
            </div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: "#FAFAFA",
                margin: "0 0 6px",
              }}
            >
              Session Reflection
            </h2>
            <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
              {sessionData?.plannedMinutes} min planned
              {sessionData?.actualMinutes
                ? ` · ${sessionData.actualMinutes} min actual`
                : ""}
              {subjectName ? ` · ${subjectName}` : ""}
            </p>
          </div>

          {/* What did you learn */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#FAFAFA",
                display: "block",
                marginBottom: 8,
              }}
            >
              What did you learn?
            </label>
            <textarea
              rows={4}
              placeholder="e.g., CPU scheduling algorithms, process synchronization, deadlock detection..."
              value={learned}
              onChange={(e) => setLearned(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                backgroundColor: "#0A0A0A",
                border: "1px solid #282828",
                color: "#FAFAFA",
                fontSize: 14,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* What did you wish you learned */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#FAFAFA",
                display: "block",
                marginBottom: 8,
              }}
            >
              What do you wish you had learned?
            </label>
            <textarea
              rows={3}
              placeholder="e.g., wanted to cover memory management but ran out of time..."
              value={wishedLearned}
              onChange={(e) => setWishedLearned(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                backgroundColor: "#0A0A0A",
                border: "1px solid #282828",
                color: "#FAFAFA",
                fontSize: 14,
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: "12px 24px",
                borderRadius: 10,
                backgroundColor: "#10B981",
                color: "#000",
                fontWeight: 700,
                fontSize: 14,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : "💾 Save Reflection"}
            </button>

            <button
              onClick={handleSkip}
              style={{
                padding: "12px 20px",
                borderRadius: 10,
                backgroundColor: "transparent",
                color: "#888",
                fontWeight: 600,
                fontSize: 14,
                border: "1px solid #333",
                cursor: "pointer",
              }}
            >
              Skip
            </button>
          </div>

          {/* Suggest Quiz */}
          {onSuggestQuiz && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <button
                onClick={onSuggestQuiz}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  backgroundColor: "rgba(212, 160, 23, 0.12)",
                  border: "1px solid rgba(212, 160, 23, 0.3)",
                  color: "#D4A017",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                ⚡ Take a Quiz on Today's Topics
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
