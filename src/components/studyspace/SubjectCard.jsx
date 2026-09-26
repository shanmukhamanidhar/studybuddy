import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

export default function SubjectCard({ subject, onEdit, onDelete }) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const color = subject.color || "#D4A017";
  const progress = subject.progress || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        backgroundColor: "#111111",
        border: "1px solid #242424",
        borderRadius: 20,
        padding: "24px 28px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        marginBottom: 20,
        transition: "border-color 0.25s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}40`)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#242424")}
    >
      {/* Notebook Spine Color Accent */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 16,
          bottom: 16,
          width: 4,
          borderRadius: "0 4px 4px 0",
          backgroundColor: color,
        }}
      />

      {/* Main Info */}
      <div style={{ flex: 1, paddingLeft: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h4
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: "#FAFAFA",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {subject.name}
          </h4>
          {subject.courseCode && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#737373",
                fontFamily: "monospace",
                letterSpacing: "0.04em",
              }}
            >
              {subject.courseCode}
            </span>
          )}
        </div>

        {/* Minimal Sub-line */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "#888888" }}>
          <span>{progress}% completed</span>
          <span>•</span>
          <span>{subject.lastStudiedAt ? "Studied recently" : "Not started yet"}</span>
        </div>
      </div>

      {/* Action Right Area */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Subtle Options Menu */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => onEdit(subject)}
            title="Edit Subject"
            style={{
              background: "transparent",
              border: "none",
              color: "#555555",
              fontSize: 14,
              padding: "6px 8px",
              cursor: "pointer",
              borderRadius: 6,
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#FAFAFA")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
          >
            ✏️
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Delete Subject"
              style={{
                background: "transparent",
                border: "none",
                color: "#555555",
                fontSize: 14,
                padding: "6px 8px",
                cursor: "pointer",
                borderRadius: 6,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#555555")}
            >
              🗑️
            </button>
          ) : (
            <button
              onClick={() => {
                onDelete(subject.id);
                setConfirmDelete(false);
              }}
              style={{
                padding: "4px 8px",
                borderRadius: 6,
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #EF4444",
                color: "#EF4444",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Delete?
            </button>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => navigate(`/subjects/${subject.id}`)}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            backgroundColor: color,
            color: "#0A0A0A",
            fontSize: 14,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: `0 4px 16px ${color}35`,
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = `0 6px 22px ${color}55`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = `0 4px 16px ${color}35`;
          }}
        >
          Continue Studying →
        </button>
      </div>
    </motion.div>
  );
}
