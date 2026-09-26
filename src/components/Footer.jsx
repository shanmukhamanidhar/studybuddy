import React from "react";
import { Link } from "react-router";

export default function Footer() {
  const linkStyle = {
    color: "#A3A3A3",
    fontSize: 13,
    fontWeight: 500,
    textDecoration: "none",
    transition: "color 0.2s",
  };

  const hover = {
    onMouseEnter: (e) => (e.currentTarget.style.color = "#FAFAFA"),
    onMouseLeave: (e) => (e.currentTarget.style.color = "#A3A3A3"),
  };

  return (
    <footer
      style={{
        borderTop: "1px solid #2B2B2B",
        backgroundColor: "#0A0A0A",
        padding: "36px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              backgroundColor: "#D4A017",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 13V5.5L8 3l5 2.5V13" stroke="#0A0A0A" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
              <path d="M6 13V9h4v4" stroke="#0A0A0A" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ color: "#FAFAFA", fontWeight: 600, fontSize: 13, letterSpacing: "-0.01em" }}>StudyBuddy</span>
        </Link>

        {/* Links */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
          <Link to="/" style={linkStyle} {...hover}>Home</Link>
          <a href="/#about" style={linkStyle} {...hover}>About</a>
          <Link to="/login" style={linkStyle} {...hover}>Login</Link>
          <Link to="/register" style={linkStyle} {...hover}>Register</Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...linkStyle, display: "flex", alignItems: "center", gap: 6 }}
            {...hover}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>

        <p style={{ color: "#A3A3A3", fontSize: 12, margin: 0 }}>
          © {new Date().getFullYear()} StudyBuddy
        </p>
      </div>
    </footer>
  );
}
