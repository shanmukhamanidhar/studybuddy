import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, getUserInitials } from "../../context/AuthContext";

const NAV_ITEMS = [
  { label: "Home", path: "/app", icon: "🏠" },
  { label: "Courses", path: "/courses", icon: "📚" },
  { label: "Assignments & Tasks", path: "/assignments", icon: "📝" },
  { label: "Practice & Quizzes", path: "/practice", icon: "🔥", highlight: true },
  { label: "Exams", path: "/exams", icon: "🎯" },
  { label: "History", path: "/history", icon: "📈" },
];

export default function SidebarLayout({ children }) {
  const { currentUser, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const initials = getUserInitials(currentUser);
  const displayName =
    userProfile?.aboutYou?.preferredName ||
    currentUser?.displayName ||
    userProfile?.displayName ||
    "Chaitanya";

  const sidebarWidth = collapsed ? 76 : 240;

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0A0A0A", color: "#FAFAFA" }}>
      {/* Mobile Top Bar Header */}
      <div
        className="mobile-header"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          backgroundColor: "#111111",
          borderBottom: "1px solid #1E1E1E",
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 120,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src="/image.png"
            alt="StudyBuddy"
            style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }}
          />
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18 }}>
            StudyBuddy
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: "none",
            border: "none",
            color: "#FAFAFA",
            fontSize: 22,
            cursor: "pointer",
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.75)",
              zIndex: 130,
            }}
          />
        )}
      </AnimatePresence>

      {/* Permanent Left Sidebar */}
      <motion.aside
        className={`sidebar-aside ${mobileOpen ? "mobile-open" : ""}`}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          backgroundColor: "#111111",
          borderRight: "1px solid #1C1C1C",
          zIndex: 140,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflowX: "hidden",
        }}
      >
        <div>
          {/* Logo Section */}
          <div
            style={{
              height: 72,
              padding: collapsed ? "0 18px" : "0 22px",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              borderBottom: "1px solid #1C1C1C",
            }}
          >
            <Link
              to="/app"
              style={{
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 12,
                overflow: "hidden",
              }}
            >
              <img
                src="/image.png"
                alt="StudyBuddy"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />

              {!collapsed && (
                <span
                  style={{
                    fontFamily: "'Space Grotesk', system-ui, sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#FAFAFA",
                    letterSpacing: "-0.02em",
                    whiteSpace: "nowrap",
                  }}
                >
                  StudyBuddy
                </span>
              )}
            </Link>

            <button
              className="desktop-collapse-btn"
              onClick={() => setCollapsed(!collapsed)}
              style={{
                background: "transparent",
                border: "none",
                color: "#666666",
                cursor: "pointer",
                padding: 4,
                borderRadius: 4,
                fontSize: 14,
              }}
            >
              {collapsed ? "≫" : "≪"}
            </button>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: "20px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
            {NAV_ITEMS.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/app" && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : ""}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: collapsed ? "10px 0" : "10px 14px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: isActive ? "#FAFAFA" : "#888888",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 500,
                    backgroundColor: isActive
                      ? "rgba(212, 160, 23, 0.1)"
                      : item.highlight
                      ? "rgba(212, 160, 23, 0.04)"
                      : "transparent",
                    border: item.highlight && !isActive ? "1px solid rgba(212, 160, 23, 0.2)" : "1px solid transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  {isActive && (
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 6,
                        bottom: 6,
                        width: 3,
                        borderRadius: "0 4px 4px 0",
                        backgroundColor: "#D4A017",
                      }}
                    />
                  )}

                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>

                  {!collapsed && (
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: item.highlight && !isActive ? "#D4A017" : "inherit" }}>
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid #1C1C1C", position: "relative" }} ref={dropdownRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: collapsed ? "8px 0" : "8px 10px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 8,
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="Avatar"
                style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "#1C1C1C",
                  border: "1px solid #D4A017",
                  color: "#D4A017",
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
            )}

            {!collapsed && (
              <div style={{ overflow: "hidden", flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#FAFAFA", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {displayName}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#666666", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                  {userProfile?.academicInfo?.semester ? `Semester ${userProfile.academicInfo.semester}` : ""}
                </p>
              </div>
            )}
          </button>

          {/* Profile Dropdown */}
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                style={{
                  position: "absolute",
                  bottom: 60,
                  left: collapsed ? 16 : 12,
                  width: 190,
                  backgroundColor: "#161616",
                  border: "1px solid #262626",
                  borderRadius: 10,
                  padding: "10px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                  zIndex: 160,
                }}
              >
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: "block",
                    padding: "8px 10px",
                    borderRadius: 6,
                    color: "#FAFAFA",
                    fontSize: 13,
                    textDecoration: "none",
                    marginBottom: 4,
                  }}
                >
                  ⚙️ Settings
                </Link>

                <button
                  onClick={handleLogout}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 6,
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#EF4444",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  🚪 Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Main Viewport */}
      <main
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          minHeight: "100vh",
          transition: "margin-left 0.25s ease",
          width: `calc(100% - ${sidebarWidth}px)`,
        }}
        className="main-viewport"
      >
        {children}
      </main>

      <style>{`
        @media (max-width: 860px) {
          .mobile-header {
            display: flex !important;
          }
          .main-viewport {
            margin-left: 0 !important;
            width: 100% !important;
            padding-top: 60px !important;
          }
          .sidebar-aside {
            transform: translateX(-100%);
            transition: transform 0.25s ease !important;
            width: 240px !important;
          }
          .sidebar-aside.mobile-open {
            transform: translateX(0) !important;
          }
          .desktop-collapse-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
