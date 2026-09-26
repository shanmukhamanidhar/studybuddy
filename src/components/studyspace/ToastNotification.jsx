import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ToastNotification({ toast, onClose }) {
  if (!toast) return null;

  const isError = toast.type === "error";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 9999,
          backgroundColor: isError ? "#1F1212" : "#111A13",
          border: `1px solid ${isError ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
          borderRadius: 14,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          boxShadow: "0 16px 36px rgba(0, 0, 0, 0.6)",
          color: "#FAFAFA",
          fontSize: 14,
          fontWeight: 500,
          maxWidth: 360,
        }}
      >
        <span style={{ fontSize: 18 }}>{isError ? "⚠️" : "✅"}</span>
        <span style={{ flex: 1 }}>{toast.message}</span>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#A3A3A3",
            cursor: "pointer",
            fontSize: 16,
            padding: "0 4px",
          }}
        >
          ✕
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
