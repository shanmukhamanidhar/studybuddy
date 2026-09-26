import React from "react";
import { motion } from "framer-motion";

export default function EmptyState({ onCreateClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "80px 24px",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: "rgba(212, 160, 23, 0.08)",
          border: "1px solid rgba(212, 160, 23, 0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginBottom: 28,
        }}
      >
        📖
      </div>

      <h3
        style={{
          fontFamily: "'Space Grotesk', system-ui, sans-serif",
          fontSize: 24,
          fontWeight: 700,
          color: "#FAFAFA",
          margin: "0 0 10px",
          letterSpacing: "-0.02em",
        }}
      >
        Your study space is empty.
      </h3>

      <p
        style={{
          color: "#A3A3A3",
          fontSize: 15,
          lineHeight: 1.6,
          margin: "0 0 32px",
        }}
      >
        Create your first subject to begin.
      </p>

      <button
        onClick={onCreateClick}
        style={{
          padding: "14px 36px",
          borderRadius: 14,
          backgroundColor: "#D4A017",
          color: "#0A0A0A",
          fontSize: 15,
          fontWeight: 700,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 6px 24px rgba(212, 160, 23, 0.25)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 10px 30px rgba(212, 160, 23, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(212, 160, 23, 0.25)";
        }}
      >
        + Create Subject
      </button>
    </motion.div>
  );
}
