import React from "react";
import { motion } from "framer-motion";

export default function XpBar({ level, progressPct, progress, needed, xp, compact = false }) {
  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "2px solid #D4A017",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            color: "#D4A017",
            backgroundColor: "rgba(212,160,23,0.1)",
            flexShrink: 0,
          }}
        >
          {level}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              height: 6,
              backgroundColor: "#1C1C1C",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                height: "100%",
                backgroundColor: "#D4A017",
                borderRadius: 3,
              }}
            />
          </div>
          <div style={{ fontSize: 10, color: "#666", marginTop: 3 }}>
            {progress}/{needed} XP
          </div>
        </div>
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
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "3px solid #D4A017",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 700,
            color: "#D4A017",
            backgroundColor: "rgba(212,160,23,0.08)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {level}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#FAFAFA" }}>
            Level {level}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>
            {xp?.toLocaleString()} total XP
          </div>
        </div>
      </div>
      <div
        style={{
          height: 8,
          backgroundColor: "#1C1C1C",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            height: "100%",
            backgroundColor: "#D4A017",
            borderRadius: 4,
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "#666" }}>
        <span>{progress} XP earned</span>
        <span>{needed - progress} XP to Level {level + 1}</span>
      </div>
    </div>
  );
}
