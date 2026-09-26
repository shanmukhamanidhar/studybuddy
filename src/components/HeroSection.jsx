import React from "react";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

/* ─── SVG hand-drawn underline ─────────────────────────────── */
function HandwrittenUnderline() {
  const controls = useAnimation();

  useEffect(() => {
    const timer = setTimeout(() => {
      controls.start({
        pathLength: 1,
        opacity: 1,
        transition: { duration: 1.1, ease: [0.4, 0, 0.2, 1], delay: 0.5 },
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [controls]);

  return (
    <svg
      viewBox="0 0 340 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        bottom: -8,
        left: "50%",
        transform: "translateX(-50%)",
        width: "105%",
        height: 22,
        overflow: "visible",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      {/* stroke 1 – main sweep */}
      <motion.path
        d="M4 14 C 40 8, 90 17, 160 11 C 210 7, 270 16, 336 13"
        stroke="#D4A017"
        strokeWidth="2.8"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={controls}
      />
      {/* stroke 2 – subtle second line */}
      <motion.path
        d="M8 18 C 55 14, 120 19, 200 15 C 255 12, 300 18, 334 16"
        stroke="#D4A017"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeOpacity="0.45"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={controls}
        transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1], delay: 0.65 }}
      />
      {/* stroke 3 – small accent tick at end */}
      <motion.path
        d="M326 10 C 331 12, 336 14, 334 17"
        stroke="#D4A017"
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={controls}
        transition={{ duration: 0.4, ease: "easeOut", delay: 1.4 }}
      />
    </svg>
  );
}

/* ─── Floating study cards ──────────────────────────────────── */
const floatingCards = [
  {
    id: "planner",
    icon: "📄",
    title: "Semester Planner",
    sub: "16 weeks mapped",
    top: "8%",
    left: "2%",
    rotate: -3,
    delay: 0.1,
    floatY: 10,
    floatDuration: 5.2,
  },
  {
    id: "lab",
    icon: "🧪",
    title: "Interactive Lab",
    sub: "Chemistry · Week 7",
    top: "32%",
    left: "-1%",
    rotate: 2,
    delay: 0.25,
    floatY: 14,
    floatDuration: 6.8,
  },
  {
    id: "subjects",
    icon: "📚",
    title: "Subjects",
    sub: "5 courses active",
    top: "60%",
    left: "3%",
    rotate: -2,
    delay: 0.15,
    floatY: 9,
    floatDuration: 5.9,
  },
  {
    id: "assignments",
    icon: "📝",
    title: "Assignments",
    sub: "3 due this week",
    top: "6%",
    right: "1%",
    rotate: 3,
    delay: 0.2,
    floatY: 12,
    floatDuration: 6.1,
  },
  {
    id: "progress",
    icon: "📈",
    title: "Progress",
    sub: "68% semester done",
    top: "35%",
    right: "-1%",
    rotate: -2,
    delay: 0.3,
    floatY: 11,
    floatDuration: 7.0,
  },
  {
    id: "exam",
    icon: "⏳",
    title: "Exam Countdown",
    sub: "Finals in 12 days",
    top: "62%",
    right: "2%",
    rotate: 2,
    delay: 0.1,
    floatY: 13,
    floatDuration: 5.5,
  },
];

function FloatingCard({ card, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.8 + card.delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "absolute",
        top: card.top,
        left: card.left,
        right: card.right,
        rotate: card.rotate,
        zIndex: index % 2 === 0 ? 2 : 1,
      }}
    >
      <motion.div
        animate={{ y: [0, -card.floatY, 0] }}
        transition={{
          duration: card.floatDuration,
          repeat: Infinity,
          ease: "easeInOut",
          delay: card.delay * 2,
        }}
        style={{
          backgroundColor: "var(--color-card, #171717)",
          border: "1px solid var(--color-border, #2B2B2B)",
          borderRadius: 14,
          padding: "14px 18px",
          minWidth: 170,
          boxShadow: "0 8px 32px var(--color-shadow, rgba(0,0,0,0.5))",
          cursor: "default",
          userSelect: "none",
        }}
        whileHover={{ scale: 1.04, boxShadow: "0 12px 40px var(--color-shadow, rgba(0,0,0,0.65))" }}
      >
        <div style={{ fontSize: 22, marginBottom: 8, lineHeight: 1 }}>{card.icon}</div>
        <div style={{ color: "var(--color-text, #FAFAFA)", fontWeight: 600, fontSize: 13, letterSpacing: "-0.01em" }}>
          {card.title}
        </div>
        <div style={{ color: "var(--color-muted, #A3A3A3)", fontSize: 11, marginTop: 3 }}>{card.sub}</div>
        <div
          style={{
            marginTop: 10,
            height: 2,
            width: 28,
            borderRadius: 2,
            backgroundColor: "#D4A017",
            opacity: 0.7,
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ─── Hero ──────────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function HeroSection() {
  return (
    <section
      className="notebook-grid"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        paddingTop: 100,
        paddingBottom: 80,
      }}
    >
      {/* Floating cards layer – desktop only */}
      <style>{`
        @media (min-width: 1024px) { .sb-float-layer { display: block !important; } }
      `}</style>
      <div
        className="sb-float-layer"
        style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "none" }}
        aria-hidden="true"
      >
        {floatingCards.map((card, i) => (
          <FloatingCard key={card.id} card={card} index={i} />
        ))}
      </div>

      {/* Center content */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: 680,
          width: "100%",
          textAlign: "center",
          padding: "0 24px",
        }}
      >
        {/* Badge */}
        <motion.div {...fadeUp(0.1)} style={{ marginBottom: 28 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "var(--color-card, #171717)",
              border: "1px solid var(--color-border, #2B2B2B)",
              borderRadius: 100,
              padding: "6px 16px",
              fontSize: 12,
              fontWeight: 500,
              color: "var(--color-muted, #A3A3A3)",
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#D4A017",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            Built for college students
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div {...fadeUp(0.2)} style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(42px, 7vw, 76px)",
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "var(--color-text, #FAFAFA)",
              margin: 0,
            }}
          >
            Organize your semester.
            <br />
            <span style={{ position: "relative", display: "inline-block", color: "var(--color-text, #FAFAFA)" }}>
              Learn by doing.
              <HandwrittenUnderline />
            </span>
          </h1>
        </motion.div>

        {/* Sub-paragraph */}
        <motion.p
          {...fadeUp(0.35)}
          style={{
            fontSize: "clamp(15px, 2vw, 17px)",
            lineHeight: 1.7,
            color: "var(--color-muted, #A3A3A3)",
            maxWidth: 480,
            margin: "0 auto 40px",
          }}
        >
          StudyBuddy is your all-in-one academic workspace. Manage assignments,
          track subject progress, and stay organised from the first day to finals week.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          {...fadeUp(0.45)}
          style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}
        >
          <a
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#D4A017",
              color: "#0A0A0A",
              fontWeight: 600,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 100,
              textDecoration: "none",
              transition: "background 0.2s, transform 0.15s",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#E4B63B";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#D4A017";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Get Started
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a
            href="/#about"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "transparent",
              color: "#A3A3A3",
              fontWeight: 500,
              fontSize: 14,
              padding: "12px 28px",
              borderRadius: 100,
              border: "1px solid #2B2B2B",
              textDecoration: "none",
              transition: "border-color 0.2s, color 0.2s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#D4A017";
              e.currentTarget.style.color = "#FAFAFA";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#2B2B2B";
              e.currentTarget.style.color = "#A3A3A3";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Explore Demo
          </a>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          {...fadeUp(0.7)}
          style={{ marginTop: 64, display: "flex", justifyContent: "center" }}
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ color: "#A3A3A3", opacity: 0.5 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 4v12M5 11l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </motion.div>
      </div>

      {/* Mobile floating cards */}
      <style>{`
        @media (min-width: 1024px) { .sb-mobile-cards { display: none !important; } }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        className="sb-mobile-cards"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
          padding: "48px 24px 0",
          maxWidth: 600,
          width: "100%",
        }}
      >
        {floatingCards.map((card) => (
          <div
            key={card.id}
            style={{
              backgroundColor: "#171717",
              border: "1px solid #2B2B2B",
              borderRadius: 12,
              padding: "12px 16px",
              minWidth: 140,
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 6 }}>{card.icon}</div>
            <div style={{ color: "#FAFAFA", fontWeight: 600, fontSize: 12 }}>{card.title}</div>
            <div style={{ color: "#A3A3A3", fontSize: 10, marginTop: 2 }}>{card.sub}</div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
