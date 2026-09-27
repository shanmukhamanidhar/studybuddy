import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { upsertProfile } from "../lib/supabaseDb";
import { Sun, Moon, Check } from "lucide-react";

export default function SettingsPage() {
  const { currentUser, userProfile } = useAuth();
  const { theme, setTheme, isDark, isLight } = useTheme();

  const [preferredName, setPreferredName] = useState(
    userProfile?.aboutYou?.preferredName || currentUser?.displayName || ""
  );
  const [targetSGPA, setTargetSGPA] = useState(userProfile?.goals?.targetSGPA || "9.0");
  const [studyHours, setStudyHours] = useState(userProfile?.goals?.studyHours || "3");
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      await upsertProfile(currentUser.uid, {
        "aboutYou.preferredName": preferredName,
        "goals.targetSGPA": targetSGPA,
        "goals.studyHours": studyHours,
        displayName: preferredName,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
    }
  };

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "48px 32px 80px" }}>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, margin: "0 0 6px", color: "var(--color-text)" }}>
          Platform & Academic Settings
        </h1>
        <p style={{ color: "var(--color-muted)", fontSize: 15, margin: "0 0 36px" }}>
          Manage your personal academic goals, interface theme, and preferences.
        </p>

        {saved && (
          <div style={{ backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid #10B981", color: "#10B981", padding: "12px 18px", borderRadius: 12, marginBottom: 24, fontSize: 14 }}>
            Settings successfully updated.
          </div>
        )}

        {/* Theme Appearance Section */}
        <div
          style={{
            backgroundColor: "var(--color-surface, #111111)",
            border: "1px solid var(--color-border, #222)",
            borderRadius: 20,
            padding: 32,
            marginBottom: 24,
            boxShadow: "0 4px 20px var(--color-shadow)",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: "var(--color-text)", fontFamily: "'Space Grotesk', sans-serif" }}>
            Theme & Appearance
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-muted)", margin: "0 0 20px" }}>
            Choose your preferred interface theme. Your preference is automatically saved.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {/* Dark Theme Option */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 20px",
                borderRadius: 14,
                border: isDark ? "2px solid #D4A017" : "1px solid var(--color-border)",
                backgroundColor: isDark ? "rgba(212, 160, 23, 0.08)" : "var(--color-card)",
                color: "var(--color-text)",
                cursor: "pointer",
                textAlign: "left",
                position: "relative",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "#0A0A0A",
                  border: "1px solid #2B2B2B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Moon size={22} color="#D4A017" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text)" }}>Dark Theme</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>High contrast, easy on eyes</div>
              </div>
              {isDark && (
                <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#D4A017", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={14} color="#0A0A0A" strokeWidth={3} />
                </div>
              )}
            </button>

            {/* Light Theme Option */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 20px",
                borderRadius: 14,
                border: isLight ? "2px solid #D4A017" : "1px solid var(--color-border)",
                backgroundColor: isLight ? "rgba(212, 160, 23, 0.08)" : "var(--color-card)",
                color: "var(--color-text)",
                cursor: "pointer",
                textAlign: "left",
                position: "relative",
                transition: "all 0.2s ease",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Sun size={22} color="#D4A017" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text)" }}>Light Theme</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 2 }}>Clean, daylight clarity</div>
              </div>
              {isLight && (
                <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#D4A017", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={14} color="#0A0A0A" strokeWidth={3} />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Academic Preferences Form */}
        <form onSubmit={handleSave} style={{ backgroundColor: "var(--color-surface, #111111)", border: "1px solid var(--color-border, #222)", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", gap: 20, boxShadow: "0 4px 20px var(--color-shadow)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0", color: "var(--color-text)", fontFamily: "'Space Grotesk', sans-serif" }}>
            Academic Profile & Goals
          </h2>

          <div>
            <label style={{ fontSize: 13, color: "var(--color-muted)", display: "block", marginBottom: 6 }}>Preferred Name</label>
            <input
              type="text"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, backgroundColor: "var(--color-input)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: "var(--color-muted)", display: "block", marginBottom: 6 }}>Target SGPA</label>
            <input
              type="text"
              value={targetSGPA}
              onChange={(e) => setTargetSGPA(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, backgroundColor: "var(--color-input)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: "var(--color-muted)", display: "block", marginBottom: 6 }}>Daily Target Study Hours</label>
            <input
              type="text"
              value={studyHours}
              onChange={(e) => setStudyHours(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, backgroundColor: "var(--color-input)", border: "1px solid var(--color-border)", color: "var(--color-text)", fontSize: 14 }}
            />
          </div>

          <div style={{ paddingTop: 12 }}>
            <button
              type="submit"
              style={{ padding: "14px 28px", borderRadius: 12, backgroundColor: "#D4A017", color: "#0A0A0A", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", transition: "transform 0.15s ease" }}
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}
