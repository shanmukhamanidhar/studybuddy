import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

const steps = [
  {
    number: "01",
    icon: "📄",
    title: "Upload your syllabus",
    description:
      "Drop in your course syllabus PDF at the start of semester. StudyBuddy reads it and understands your academic calendar.",
    accent: true,
  },
  {
    number: "02",
    icon: "🗓️",
    title: "Your semester is built automatically",
    description:
      "Every lecture, assignment deadline, and exam is extracted and placed on a clean semester timeline — no manual entry.",
    accent: false,
  },
  {
    number: "03",
    icon: "✅",
    title: "Daily tasks appear on their own",
    description:
      "Each morning you get a focused list of what to study and what to submit. No more forgetting what's due.",
    accent: false,
  },
  {
    number: "04",
    icon: "🧪",
    title: "Launch Interactive Labs",
    description:
      "Dive into topic-specific study labs with practice questions, summaries, and active recall tools.",
    accent: true,
  },
  {
    number: "05",
    icon: "📈",
    title: "Track your mastery",
    description:
      "See progress by subject, track completed tasks, and understand exactly where you stand before exams.",
    accent: false,
  },
];

function TimelineStep({ step, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const isRight = index % 2 !== 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: isRight ? 28 : -28 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 28,
        flexDirection: isRight ? "row-reverse" : "row",
        textAlign: isRight ? "right" : "left",
      }}
    >
      {/* Content */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
            flexDirection: isRight ? "row-reverse" : "row",
          }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 700,
              color: "#D4A017",
              letterSpacing: "0.04em",
            }}
          >
            {step.number}
          </span>
          <span style={{ fontSize: 18 }}>{step.icon}</span>
        </div>
        <h3
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: "clamp(18px, 2.5vw, 22px)",
            fontWeight: 700,
            color: "var(--color-text, #FAFAFA)",
            margin: "0 0 10px",
            lineHeight: 1.3,
            letterSpacing: "-0.02em",
          }}
        >
          {step.title}
        </h3>
        <p
          style={{
            color: "var(--color-muted, #A3A3A3)",
            fontSize: 14,
            lineHeight: 1.7,
            margin: 0,
            maxWidth: 360,
            ...(isRight ? { marginLeft: "auto" } : {}),
          }}
        >
          {step.description}
        </p>

        {step.accent && (
          <div
            style={{
              display: "inline-block",
              marginTop: 16,
              height: 2,
              width: 40,
              backgroundColor: "#D4A017",
              borderRadius: 2,
            }}
          />
        )}
      </div>

      {/* Centre node */}
      <div
        style={{
          flexShrink: 0,
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: step.accent ? "#D4A017" : "var(--color-elevated, #1F1F1F)",
          border: step.accent ? "none" : "1px solid var(--color-border, #2B2B2B)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 2,
          boxShadow: step.accent ? "0 0 0 6px rgba(212,160,23,0.12)" : "none",
          transition: "box-shadow 0.2s",
        }}
      >
        <span style={{ fontSize: 16 }}>{step.icon}</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />
    </motion.div>
  );
}

export default function AboutSection() {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-80px" });

  return (
    <section
      id="about"
      style={{
        backgroundColor: "var(--color-surface, #111111)",
        borderTop: "1px solid var(--color-border, #2B2B2B)",
        padding: "112px 24px",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div ref={headerRef} style={{ textAlign: "center", marginBottom: 80 }}>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#D4A017",
              marginBottom: 16,
            }}
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: "clamp(32px, 5vw, 54px)",
              fontWeight: 800,
              color: "var(--color-text, #FAFAFA)",
              margin: "0 0 20px",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            What is StudyBuddy?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              color: "var(--color-muted, #A3A3A3)",
              fontSize: 16,
              lineHeight: 1.7,
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            An academic workspace that transforms your syllabus into a structured
            semester — so you can focus on understanding, not just surviving.
          </motion.p>
        </div>

        {/* Timeline */}
        <div style={{ position: "relative" }}>
          {/* Vertical line */}
          <div
            style={{
              position: "absolute",
              top: 22,
              bottom: 22,
              left: "50%",
              transform: "translateX(-50%)",
              width: 1,
              backgroundColor: "var(--color-border, #2B2B2B)",
              zIndex: 0,
            }}
          />

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: 60, position: "relative", zIndex: 1 }}>
            {steps.map((step, i) => (
              <TimelineStep key={step.number} step={step} index={i} />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", marginTop: 80 }}
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
              padding: "12px 32px",
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
            Start your semester
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
