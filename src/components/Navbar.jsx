import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, getUserInitials } from "../context/AuthContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => (location.pathname === "/" ? "Home" : null));
  const { currentUser, logout } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location.pathname === "/" && location.hash === "#about") {
      setActiveTab("About");
    } else if (location.pathname === "/") {
      setActiveTab("Home");
    } else {
      setActiveTab(null);
    }
  }, [location]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/#about" },
    ...(currentUser ? [{ label: "Dashboard", href: "/app" }] : []),
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setUserDropdownOpen(false);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const initials = getUserInitials(currentUser);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: "#111111",
        borderBottom: "1px solid #2B2B2B",
        boxShadow: scrolled ? "0 12px 32px rgba(0,0,0,0.6)" : "0 4px 20px rgba(0,0,0,0.3)",
        transition: "padding 0.3s ease, boxShadow 0.3s ease",
        padding: scrolled ? "12px 0" : "18px 0",
      }}
    >
      <style>{`
        .sb-nav-desktop { display: none; }
        .sb-nav-hamburger { display: flex; }
        @media (min-width: 768px) {
          .sb-nav-desktop { display: flex !important; }
          .sb-nav-hamburger { display: none !important; }
        }
      `}</style>

      <nav
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          padding: "0 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo Anchor */}
        <Link
          to="/"
          style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 14 }}
          onClick={() => setActiveTab("Home")}
        >
          <img
            src="/image.png"
            alt="StudyBuddy"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              objectFit: "cover",
              flexShrink: 0,
              boxShadow: "0 4px 16px rgba(212, 160, 23, 0.25)",
            }}
          />
          <span
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              color: "#FAFAFA",
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: "-0.02em",
            }}
          >
            StudyBuddy
          </span>
        </Link>

        {/* Center Links with Pill Highlight Anchor */}
        <div className="sb-nav-desktop" style={{ gap: 8, alignItems: "center" }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.label;
            return (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setActiveTab(item.label)}
                style={{
                  position: "relative",
                  color: isActive ? "#D4A017" : "#FAFAFA",
                  fontSize: "16px",
                  fontWeight: 600,
                  textDecoration: "none",
                  padding: "8px 20px",
                  borderRadius: "100px",
                  transition: "color 0.2s ease",
                  letterSpacing: "-0.01em",
                  display: "inline-flex",
                  alignItems: "center",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#FAFAFA";
                }}
              >
                {/* Active Pill Anchor Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: "rgba(212, 160, 23, 0.12)",
                      border: "1px solid rgba(212, 160, 23, 0.3)",
                      borderRadius: "100px",
                      zIndex: 0,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}

                <span style={{ position: "relative", zIndex: 1 }}>{item.label}</span>
              </a>
            );
          })}
        </div>

        {/* Right CTA / User Profile Area */}
        <div className="sb-nav-desktop" style={{ gap: 14, alignItems: "center" }}>
          {currentUser ? (
            /* User Avatar Button & Dropdown */
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
                title={currentUser.displayName || currentUser.email}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User Avatar"}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #D4A017",
                      boxShadow: "0 2px 10px rgba(212, 160, 23, 0.25)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: "#171717",
                      border: "2px solid #D4A017",
                      color: "#D4A017",
                      fontWeight: 700,
                      fontSize: 14,
                      fontFamily: "'Space Grotesk', system-ui, sans-serif",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      letterSpacing: "0.05em",
                      boxShadow: "0 2px 10px rgba(212, 160, 23, 0.2)",
                    }}
                  >
                    {initials}
                  </div>
                )}
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {userDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 50,
                      width: 220,
                      backgroundColor: "#171717",
                      border: "1px solid #2B2B2B",
                      borderRadius: 14,
                      padding: "16px 18px",
                      boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                      zIndex: 110,
                    }}
                  >
                    <div style={{ marginBottom: 12, borderBottom: "1px solid #2B2B2B", paddingBottom: 10 }}>
                      <p style={{ color: "#FAFAFA", fontWeight: 600, fontSize: 14, margin: "0 0 2px" }}>
                        {currentUser.displayName || "Student"}
                      </p>
                      <p style={{ color: "#A3A3A3", fontSize: 12, margin: 0, wordBreak: "break-all" }}>
                        {currentUser.email}
                      </p>
                    </div>

                    <button
                      onClick={handleLogout}
                      style={{
                        width: "100%",
                        padding: "9px 12px",
                        borderRadius: 8,
                        backgroundColor: "transparent",
                        border: "1px solid #2B2B2B",
                        color: "#FAFAFA",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        transition: "border-color 0.2s, background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#EF4444";
                        e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.08)";
                        e.currentTarget.style.color = "#EF4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#2B2B2B";
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#FAFAFA";
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Login & Register Buttons */
            <>
              <Link
                to="/login"
                style={{
                  fontSize: "15px",
                  fontWeight: 500,
                  color: "#FAFAFA",
                  textDecoration: "none",
                  padding: "9px 22px",
                  borderRadius: "12px",
                  border: "1px solid #3F3F46",
                  backgroundColor: "#171717",
                  transition: "border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#D4A017";
                  e.currentTarget.style.backgroundColor = "rgba(212, 160, 23, 0.08)";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#3F3F46";
                  e.currentTarget.style.backgroundColor = "#171717";
                  e.currentTarget.style.color = "#FAFAFA";
                }}
              >
                Login
              </Link>

              <Link
                to="/register"
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#0A0A0A",
                  textDecoration: "none",
                  padding: "10px 24px",
                  borderRadius: "12px",
                  backgroundColor: "#D4A017",
                  boxShadow: "0 2px 10px rgba(212, 160, 23, 0.2)",
                  transition: "background-color 0.2s ease, transform 0.15s ease, boxShadow 0.2s ease",
                  display: "inline-block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#E4B63B";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(212, 160, 23, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#D4A017";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(212, 160, 23, 0.2)";
                }}
              >
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="sb-nav-hamburger"
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#FAFAFA",
            padding: 8,
            alignItems: "center",
          }}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </>
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              overflow: "hidden",
              borderTop: "1px solid #2B2B2B",
              backgroundColor: "#171717",
            }}
          >
            <div style={{ padding: "20px 36px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => {
                    setActiveTab(item.label);
                    setMenuOpen(false);
                  }}
                  style={{
                    color: activeTab === item.label ? "#D4A017" : "#FAFAFA",
                    fontSize: "16px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {item.label}
                </a>
              ))}

              {currentUser ? (
                <div style={{ borderTop: "1px solid #2B2B2B", paddingTop: 14, marginTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="Avatar" style={{ width: 36, height: 36, borderRadius: "50%" }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#0A0A0A", border: "1px solid #D4A017", color: "#D4A017", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {initials}
                      </div>
                    )}
                    <div>
                      <p style={{ color: "#FAFAFA", fontWeight: 600, fontSize: 14, margin: 0 }}>{currentUser.displayName || "Student"}</p>
                      <p style={{ color: "#A3A3A3", fontSize: 12, margin: 0 }}>{currentUser.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 12,
                      backgroundColor: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#EF4444",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, paddingTop: 10 }}>
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "11px 0",
                      borderRadius: 12,
                      border: "1px solid #3F3F46",
                      color: "#FAFAFA",
                      fontSize: "15px",
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "11px 0",
                      borderRadius: 12,
                      backgroundColor: "#D4A017",
                      color: "#0A0A0A",
                      fontSize: "15px",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
