import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ACCENT_COLORS = [
  "#D4A017", // Amber / Gold
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F97316", // Orange
  "#06B6D4", // Cyan
];

const DIFFICULTIES = ["Easy", "Medium", "Hard"];

export default function CreateSubjectModal({ isOpen, onClose, onSubmit, editingSubject = null }) {
  const [name, setName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [color, setColor] = useState("#D4A017");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name || "");
      setCourseCode(editingSubject.courseCode || "");
      setDifficulty(editingSubject.difficulty || "Medium");
      setColor(editingSubject.color || "#D4A017");
    } else {
      setName("");
      setCourseCode("");
      setDifficulty("Medium");
      setColor("#D4A017");
    }
    setErrorMsg("");
  }, [editingSubject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Subject name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");
      await onSubmit({
        name: name.trim(),
        courseCode: courseCode.trim(),
        difficulty,
        color,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to save subject. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEdit = Boolean(editingSubject);

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          backgroundColor: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(6px)",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 480,
            width: "100%",
            backgroundColor: "#111111",
            border: "1px solid #2B2B2B",
            borderRadius: 24,
            padding: 32,
            boxShadow: "0 24px 64px rgba(0,0,0,0.8)",
            color: "#FAFAFA",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3
              style={{
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
              }}
            >
              {isEdit ? "Edit Subject" : "Create New Subject"}
            </h3>
            <button
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#A3A3A3",
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Subject Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#A3A3A3",
                  marginBottom: 8,
                }}
              >
                Subject Name <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Database Management Systems"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 12,
                  backgroundColor: "#171717",
                  border: "1px solid #2B2B2B",
                  color: "#FAFAFA",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            {/* Course Code */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#A3A3A3",
                  marginBottom: 8,
                }}
              >
                Course Code <span style={{ color: "#555", fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CS301"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 12,
                  backgroundColor: "#171717",
                  border: "1px solid #2B2B2B",
                  color: "#FAFAFA",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>

            {/* Difficulty */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#A3A3A3",
                  marginBottom: 8,
                }}
              >
                Difficulty Level
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {DIFFICULTIES.map((d) => {
                  const active = difficulty === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      style={{
                        padding: "10px 0",
                        borderRadius: 10,
                        backgroundColor: active ? "rgba(212, 160, 23, 0.12)" : "#171717",
                        border: `1px solid ${active ? "#D4A017" : "#2B2B2B"}`,
                        color: active ? "#D4A017" : "#A3A3A3",
                        fontWeight: active ? 700 : 500,
                        fontSize: 13,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accent Color */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#A3A3A3",
                  marginBottom: 8,
                }}
              >
                Accent Color
              </label>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: c,
                      border: color === c ? "3px solid #FAFAFA" : "2px solid transparent",
                      cursor: "pointer",
                      transition: "transform 0.15s ease",
                      transform: color === c ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <div
                style={{
                  color: "#EF4444",
                  fontSize: 13,
                  padding: "10px 14px",
                  borderRadius: 10,
                  backgroundColor: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  backgroundColor: "transparent",
                  border: "1px solid #2B2B2B",
                  color: "#A3A3A3",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "12px 28px",
                  borderRadius: 12,
                  backgroundColor: "#D4A017",
                  color: "#0A0A0A",
                  fontSize: 14,
                  fontWeight: 700,
                  border: "none",
                  cursor: isSubmitting ? "wait" : "pointer",
                  opacity: isSubmitting ? 0.7 : 1,
                  boxShadow: "0 4px 16px rgba(212, 160, 23, 0.3)",
                }}
              >
                {isSubmitting ? "Saving..." : isEdit ? "Update Subject" : "Create Subject"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
