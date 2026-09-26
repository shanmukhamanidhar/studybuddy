import React from "react";

export default function StreakWidget({ streak, compact = false }) {
  const getStreakColor = () => {
    if (streak >= 30) return "#EF4444";
    if (streak >= 14) return "#F97316";
    if (streak >= 7) return "#D4A017";
    if (streak >= 3) return "#EAB308";
    return "#888";
  };

  const color = getStreakColor();

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 16,
            animation: streak > 0 ? "streak-pulse 1.5s ease-in-out infinite" : "none",
          }}
        >
          🔥
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, color }}>
          {streak}
        </span>
        <span style={{ fontSize: 10, color: "#666" }}>day{streak !== 1 ? "s" : ""}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#111111",
        border: "1px solid #222",
        borderRadius: 16,
        padding: "18px 22px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span
          style={{
            fontSize: 28,
            animation: streak > 0 ? "streak-pulse 1.5s ease-in-out infinite" : "none",
          }}
        >
          🔥
        </span>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'Space Grotesk', sans-serif" }}>
            {streak}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>
            day streak{streak >= 7 ? " — keep it going!" : ""}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const active = i < streak;
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                backgroundColor: active ? color : "#1C1C1C",
                transition: "background-color 0.3s",
              }}
            />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} style={{ fontSize: 9, color: "#555", flex: 1, textAlign: "center" }}>
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
