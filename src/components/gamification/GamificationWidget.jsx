import React from "react";
import { useNavigate } from "react-router";
import XpBar from "./XpBar";
import StreakWidget from "./StreakWidget";

export default function GamificationWidget({ level, levelData, streak, totalFocusMinutes, totalSessions, totalQuizzes, arenaWins }) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        backgroundColor: "#111111",
        border: "1px solid #222",
        borderRadius: 16,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
      }}
    >
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
          Progress
        </div>
        <XpBar
          compact
          level={level}
          progressPct={levelData.progressPct}
          progress={levelData.progress}
          needed={levelData.needed}
        />
      </div>

      <div style={{ height: 1, backgroundColor: "#1C1C1C" }} />

      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
          Streak
        </div>
        <StreakWidget streak={streak} compact />
      </div>

      <div style={{ height: 1, backgroundColor: "#1C1C1C" }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[
          { label: "Focus", value: totalFocusMinutes >= 60 ? `${Math.round(totalFocusMinutes / 60)}h` : `${totalFocusMinutes}m`, color: "#3B82F6" },
          { label: "Sessions", value: totalSessions, color: "#10B981" },
          { label: "Quizzes", value: totalQuizzes, color: "#D4A017" },
          { label: "Arena Wins", value: arenaWins, color: "#8B5CF6" },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: "center", padding: "8px 4px", borderRadius: 8, backgroundColor: "#0D0D0D" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: stat.color, fontFamily: "'Space Grotesk', sans-serif" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 10, color: "#666" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/achievements")}
        style={{
          padding: "8px 14px",
          borderRadius: 8,
          backgroundColor: "transparent",
          border: "1px solid #333",
          color: "#D4A017",
          fontWeight: 600,
          fontSize: 12,
          cursor: "pointer",
          textAlign: "center",
          transition: "border-color 0.2s, background-color 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D4A017"; e.currentTarget.style.backgroundColor = "rgba(212,160,23,0.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        View Achievements
      </button>
    </div>
  );
}
