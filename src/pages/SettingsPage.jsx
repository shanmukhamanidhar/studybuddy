import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { db } from "../firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function SettingsPage() {
  const { currentUser, userProfile } = useAuth();

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
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, {
        "aboutYou.preferredName": preferredName,
        "goals.targetSGPA": targetSGPA,
        "goals.studyHours": studyHours,
        updatedAt: serverTimestamp(),
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
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 32, fontWeight: 700, margin: "0 0 6px" }}>
          Platform & Academic Settings
        </h1>
        <p style={{ color: "#A3A3A3", fontSize: 15, margin: "0 0 36px" }}>
          Manage your personal academic goals, display name, and preferences.
        </p>

        {saved && (
          <div style={{ backgroundColor: "rgba(16,185,129,0.15)", border: "1px solid #10B981", color: "#10B981", padding: "12px 18px", borderRadius: 12, marginBottom: 24, fontSize: 14 }}>
            Settings successfully updated.
          </div>
        )}

        <form onSubmit={handleSave} style={{ backgroundColor: "#111111", border: "1px solid #222", borderRadius: 20, padding: 32, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>Preferred Name</label>
            <input
              type="text"
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, backgroundColor: "#171717", border: "1px solid #282828", color: "#FAFAFA", fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>Target SGPA</label>
            <input
              type="text"
              value={targetSGPA}
              onChange={(e) => setTargetSGPA(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, backgroundColor: "#171717", border: "1px solid #282828", color: "#FAFAFA", fontSize: 14 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: "#888", display: "block", marginBottom: 6 }}>Daily Target Study Hours</label>
            <input
              type="text"
              value={studyHours}
              onChange={(e) => setStudyHours(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, backgroundColor: "#171717", border: "1px solid #282828", color: "#FAFAFA", fontSize: 14 }}
            />
          </div>

          <div style={{ paddingTop: 12 }}>
            <button
              type="submit"
              style={{ padding: "14px 28px", borderRadius: 12, backgroundColor: "#D4A017", color: "#0A0A0A", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer" }}
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>
    </SidebarLayout>
  );
}
