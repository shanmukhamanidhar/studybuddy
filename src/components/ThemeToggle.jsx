import React from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ showLabel = false, style = {}, className = "" }) {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.94 }}
      onClick={toggleTheme}
      type="button"
      className={className}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: showLabel ? "8px 14px" : "8px",
        borderRadius: "10px",
        border: "1px solid var(--color-border, #2B2B2B)",
        backgroundColor: "var(--color-surface, #171717)",
        color: "var(--color-text, #FAFAFA)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        outline: "none",
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#D4A017";
        e.currentTarget.style.color = "#D4A017";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--color-border, #2B2B2B)";
        e.currentTarget.style.color = "var(--color-text, #FAFAFA)";
      }}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -30, opacity: 0, scale: 0.8 }}
        animate={{ rotate: 0, opacity: 1, scale: 1 }}
        exit={{ rotate: 30, opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2 }}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {isDark ? (
          <Sun size={18} strokeWidth={2.2} className="text-amber-400" color="#D4A017" />
        ) : (
          <Moon size={18} strokeWidth={2.2} className="text-indigo-400" color="#6366F1" />
        )}
      </motion.div>

      {showLabel && (
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </motion.button>
  );
}
