import React, { useState } from "react";
import AchievementBadge from "./AchievementBadge";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "study", label: "Study" },
  { id: "quiz", label: "Quiz" },
  { id: "streak", label: "Streaks" },
  { id: "tasks", label: "Tasks" },
  { id: "arena", label: "Arena" },
  { id: "profile", label: "Profile" },
];

export default function AchievementsPanel({ achievements, totalXp }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = activeCategory === "all"
    ? achievements
    : achievements.filter((a) => a.category === activeCategory);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div
      style={{
        backgroundColor: "#111111",
        border: "1px solid #222",
        borderRadius: 20,
        padding: "24px 28px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 18, fontWeight: 700, color: "#FAFAFA", margin: 0 }}>
            Achievements
          </h3>
          <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>
            {unlockedCount}/{totalCount} unlocked · {totalXp?.toLocaleString()} XP earned
          </p>
        </div>
        <div
          style={{
            padding: "6px 14px",
            borderRadius: 8,
            backgroundColor: unlockedCount === totalCount ? "rgba(16,185,129,0.12)" : "rgba(212,160,23,0.12)",
            border: `1px solid ${unlockedCount === totalCount ? "#10B981" : "rgba(212,160,23,0.3)"}`,
            color: unlockedCount === totalCount ? "#10B981" : "#D4A017",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {Math.round((unlockedCount / totalCount) * 100)}% Complete
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              backgroundColor: activeCategory === cat.id ? "#1A1A1A" : "transparent",
              border: activeCategory === cat.id ? "1px solid #333" : "1px solid transparent",
              color: activeCategory === cat.id ? "#FAFAFA" : "#666",
              fontSize: 12,
              fontWeight: activeCategory === cat.id ? 700 : 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        {filtered.map((ach) => (
          <AchievementBadge key={ach.id} achievement={ach} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 32, color: "#555", fontSize: 13 }}>
          No achievements in this category.
        </div>
      )}
    </div>
  );
}
