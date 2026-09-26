import React from "react";

export function SidebarFocusWidget({ todayMins = 45, goalMins = 120, streakDays = 3 }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        backgroundColor: "#111111",
        border: "1px solid #222222",
        borderRadius: 20,
        padding: "24px 20px",
        width: "100%",
      }}
    >
      {/* Today's Focus Widget */}
      <div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#737373",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            display: "block",
            marginBottom: 8,
          }}
        >
          Today's Focus
        </span>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#FAFAFA" }}>
          {todayMins} <span style={{ fontSize: 14, color: "#737373", fontWeight: 400 }}>/ {goalMins} mins</span>
        </div>
        <div
          style={{
            width: "100%",
            height: 4,
            borderRadius: 100,
            backgroundColor: "#1C1C1C",
            overflow: "hidden",
            marginTop: 10,
          }}
        >
          <div
            style={{
              width: `${Math.min(Math.round((todayMins / goalMins) * 100), 100)}%`,
              height: "100%",
              backgroundColor: "#D4A017",
              borderRadius: 100,
            }}
          />
        </div>
      </div>

      {/* Streak Widget */}
      <div style={{ paddingTop: 16, borderTop: "1px solid #1C1C1C" }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#737373",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            display: "block",
            marginBottom: 8,
          }}
        >
          Current Streak
        </span>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#D4A017", display: "flex", alignItems: "center", gap: 8 }}>
          🔥 {streakDays} days
        </div>
      </div>
    </div>
  );
}
