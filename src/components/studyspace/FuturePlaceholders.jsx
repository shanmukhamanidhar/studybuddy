import React from "react";

const UPCOMING_MODULES = [
  { icon: "🤖", title: "AI Study Planner", desc: "Automated daily study schedule generation based on exam dates." },
  { icon: "🧠", title: "AI Tutor Chat", desc: "Instant explanations, formula lookup, and practice problem solver." },
  { icon: "🎴", title: "Smart Flashcards", desc: "Spaced-repetition card decks generated directly from your topics." },
  { icon: "🎯", title: "Quiz Mode", desc: "Interactive practice tests with instant feedback & analytics." },
  { icon: "📅", title: "Revision Planner", desc: "Smart revision cycles to lock concepts into long-term memory." },
  { icon: "⏱️", title: "Focus Timer", desc: "Custom Pomodoro timer synced to your subject study logs." },
];

export default function FuturePlaceholders() {
  return (
    <div style={{ marginTop: 56 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h3
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: 20,
            fontWeight: 700,
            color: "#FAFAFA",
            margin: 0,
          }}
        >
          🚀 Upcoming Modules
        </h3>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 100,
            backgroundColor: "#171717",
            border: "1px solid #2B2B2B",
            color: "#A3A3A3",
          }}
        >
          Coming Soon
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {UPCOMING_MODULES.map((mod, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "#0D0D0D",
              border: "1px dashed #222222",
              borderRadius: 18,
              padding: 20,
              opacity: 0.65,
              position: "relative",
              userSelect: "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>{mod.icon}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#D4A017",
                  backgroundColor: "rgba(212,160,23,0.08)",
                  border: "1px solid rgba(212,160,23,0.2)",
                  padding: "2px 8px",
                  borderRadius: 100,
                }}
              >
                SOON
              </span>
            </div>
            <h4 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 15, fontWeight: 700, color: "#FAFAFA", margin: "0 0 6px" }}>
              {mod.title}
            </h4>
            <p style={{ color: "#737373", fontSize: 13, lineHeight: 1.4, margin: 0 }}>
              {mod.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
