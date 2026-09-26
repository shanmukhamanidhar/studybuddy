import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LevelUpPopup({ info, onDismiss }) {
  useEffect(() => {
    if (info) {
      const t = setTimeout(onDismiss, 3500);
      return () => clearTimeout(t);
    }
  }, [info, onDismiss]);

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            cursor: "pointer",
          }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#111111",
              border: "2px solid #D4A017",
              borderRadius: 24,
              padding: "48px 56px",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
              maxWidth: 400,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(circle at center, rgba(212,160,23,0.08) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            <motion.div
              animate={{ rotate: [0, -5, 5, -3, 3, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{ fontSize: 56, marginBottom: 20 }}
            >
              🎉
            </motion.div>

            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#D4A017",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              Level Up!
            </div>

            <div
              style={{
                fontSize: 48,
                fontWeight: 700,
                color: "#FAFAFA",
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: 1,
                marginBottom: 12,
              }}
            >
              {info.newLevel}
            </div>

            <div style={{ fontSize: 14, color: "#888" }}>
              You've reached Level {info.newLevel}!
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
