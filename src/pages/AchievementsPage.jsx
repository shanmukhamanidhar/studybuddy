import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import SidebarLayout from "../components/layout/SidebarLayout";
import { useGamification } from "../hooks/useGamification";
import XpBar from "../components/gamification/XpBar";
import StreakWidget from "../components/gamification/StreakWidget";
import AchievementsPanel from "../components/gamification/AchievementsPanel";

export default function AchievementsPage() {
  const { currentUser } = useAuth();
  const {
    level,
    levelData,
    streak,
    totalFocusMinutes,
    totalSessions,
    totalQuizzes,
    arenaWins,
    arenaLosses,
    achievements,
    earnedAchievementXp,
    gamification,
  } = useGamification(currentUser?.uid);

  const [activeTab, setActiveTab] = useState("achievements");

  return (
    <SidebarLayout>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: 6,
              backgroundColor: "rgba(212, 160, 23, 0.12)",
              border: "1px solid rgba(212, 160, 23, 0.3)",
              color: "#D4A017",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            🏆 Achievements
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              margin: "0 0 6px",
            }}
          >
            Your Achievements
          </h1>
          <p style={{ color: "#888888", fontSize: 15, margin: 0 }}>
            Track your progress, unlock badges, and earn XP.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 32 }}>
          <XpBar
            level={level}
            progressPct={levelData.progressPct}
            progress={levelData.progress}
            needed={levelData.needed}
            xp={gamification.xp}
          />
          <StreakWidget streak={streak} />
          <div
            style={{
              backgroundColor: "#111111",
              border: "1px solid #222",
              borderRadius: 16,
              padding: "18px 22px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
              Lifetime Stats
            </div>
            {[
              { label: "Focus Time", value: totalFocusMinutes >= 60 ? `${Math.round(totalFocusMinutes / 60)}h ${totalFocusMinutes % 60}m` : `${totalFocusMinutes}m`, color: "#3B82F6" },
              { label: "Sessions", value: totalSessions, color: "#10B981" },
              { label: "Quizzes", value: totalQuizzes, color: "#D4A017" },
              { label: "Exams", value: gamification.totalExams || 0, color: "#8B5CF6" },
              { label: "Arena Record", value: `${arenaWins}W / ${arenaLosses}L`, color: "#F97316" },
            ].map((stat) => (
              <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1C1C1C" }}>
                <span style={{ fontSize: 12, color: "#888" }}>{stat.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: stat.color }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        <AchievementsPanel achievements={achievements} totalXp={earnedAchievementXp} />
      </div>
    </SidebarLayout>
  );
}
