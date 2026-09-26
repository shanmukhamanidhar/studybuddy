import React from "react";
import { motion } from "framer-motion";

export default function AchievementBadge({ achievement, size = "normal" }) {
  const { name, desc, icon, xp, unlocked, category } = achievement;

  const categoryColors = {
    study: "#3B82F6",
    quiz: "#D4A017",
    streak: "#EF4444",
    tasks: "#10B981",
    arena: "#8B5CF6",
    profile: "#F97316",
  };

  const color = categoryColors[category] || "#D4A017";

  if (size === "small") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 10,
          backgroundColor: unlocked ? `${color}10` : "#0D0D0D",
          border: `1px solid ${unlocked ? `${color}40` : "#1C1C1C"}`,
          opacity: unlocked ? 1 : 0.4,
        }}
      >
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: unlocked ? "#FAFAFA" : "#555" }}>
            {name}
          </div>
          <div style={{ fontSize: 10, color: unlocked ? "#888" : "#444" }}>+{xp} XP</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      style={{
        backgroundColor: unlocked ? `${color}08` : "#0D0D0D",
        border: `1px solid ${unlocked ? `${color}30` : "#1C1C1C"}`,
        borderRadius: 14,
        padding: "18px 16px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        cursor: "default",
        transition: "border-color 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => { if (unlocked) e.currentTarget.style.borderColor = color; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = unlocked ? `${color}30` : "#1C1C1C"; }}
    >
      {unlocked && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: color,
          }}
        />
      )}

      <div
        style={{
          fontSize: 32,
          marginBottom: 10,
          filter: unlocked ? "none" : "grayscale(1) opacity(0.4)",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: unlocked ? "#FAFAFA" : "#555",
          marginBottom: 4,
        }}
      >
        {name}
      </div>

      <div
        style={{
          fontSize: 11,
          color: unlocked ? "#888" : "#444",
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        {desc}
      </div>

      <div
        style={{
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: 6,
          backgroundColor: unlocked ? `${color}15` : "#161616",
          color: unlocked ? color : "#555",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {unlocked ? `+${xp} XP` : "Locked"}
      </div>
    </motion.div>
  );
}
