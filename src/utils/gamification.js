import { doc, updateDoc, getDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

export const XP_PER_LEVEL = 500;
export const MAX_LEVEL = 50;

export const DIFFICULTY_MULTIPLIERS = { Easy: 1, Medium: 1.5, Hard: 2 };
export const PRIORITY_MULTIPLIERS = { Low: 1, Medium: 1.5, High: 2 };

export const ACHIEVEMENTS = [
  { id: "first_session", name: "First Steps", desc: "Complete your first study session", icon: "🎒", category: "study", xp: 10, condition: (g) => g.totalSessions >= 1 },
  { id: "sessions_10", name: "Getting Serious", desc: "Complete 10 study sessions", icon: "📚", category: "study", xp: 25, condition: (g) => g.totalSessions >= 10 },
  { id: "sessions_50", name: "Study Machine", desc: "Complete 50 study sessions", icon: "🏭", category: "study", xp: 100, condition: (g) => g.totalSessions >= 50 },
  { id: "sessions_100", name: "Century Scholar", desc: "Complete 100 study sessions", icon: "🎓", category: "study", xp: 250, condition: (g) => g.totalSessions >= 100 },
  { id: "focus_60", name: "Hour Hero", desc: "Study for 60+ minutes in one session", icon: "⏰", category: "study", xp: 15, condition: (g) => g._lastSessionMinutes >= 60 },
  { id: "focus_180", name: "Marathon Mind", desc: "Study for 180+ minutes in one session", icon: "🧠", category: "study", xp: 50, condition: (g) => g._lastSessionMinutes >= 180 },
  { id: "focus_1000", name: "Thousand Hours", desc: "Accumulate 1000 total focus minutes", icon: "⏳", category: "study", xp: 200, condition: (g) => g.totalFocusMinutes >= 1000 },
  { id: "quiz_first", name: "Quiz Rookie", desc: "Complete your first quiz", icon: "⚡", category: "quiz", xp: 10, condition: (g) => g.totalQuizzes >= 1 },
  { id: "quiz_25", name: "Quiz Enthusiast", desc: "Complete 25 quizzes", icon: "🎯", category: "quiz", xp: 50, condition: (g) => g.totalQuizzes >= 25 },
  { id: "quiz_50", name: "Quiz Master", desc: "Complete 50 quizzes", icon: "🏅", category: "quiz", xp: 150, condition: (g) => g.totalQuizzes >= 50 },
  { id: "perfect_score", name: "Flawless", desc: "Score 100% on any quiz", icon: "💎", category: "quiz", xp: 30, condition: (g) => g._isPerfect },
  { id: "perfect_5", name: "Perfectionist x5", desc: "Get five 100% quiz scores", icon: "👑", category: "quiz", xp: 100, condition: (g) => g.perfectQuizCount >= 5 },
  { id: "hard_quizzes_10", name: "Daredevil", desc: "Complete 10 Hard-difficulty quizzes", icon: "🔥", category: "quiz", xp: 75, condition: (g) => g.hardQuizzes >= 10 },
  { id: "exam_first", name: "Exam Ready", desc: "Complete your first mock exam", icon: "📝", category: "quiz", xp: 20, condition: (g) => g.totalExams >= 1 },
  { id: "exam_10", name: "Exam Warrior", desc: "Complete 10 mock exams", icon: "⚔️", category: "quiz", xp: 100, condition: (g) => g.totalExams >= 10 },
  { id: "streak_3", name: "On Fire", desc: "Maintain a 3-day study streak", icon: "🔥", category: "streak", xp: 20, condition: (g) => g.currentStreak >= 3 },
  { id: "streak_7", name: "Week Warrior", desc: "Maintain a 7-day study streak", icon: "🗓️", category: "streak", xp: 50, condition: (g) => g.currentStreak >= 7 },
  { id: "streak_14", name: "Fortnight Force", desc: "Maintain a 14-day study streak", icon: "💪", category: "streak", xp: 100, condition: (g) => g.currentStreak >= 14 },
  { id: "streak_30", name: "Monthly Master", desc: "Maintain a 30-day study streak", icon: "🏆", category: "streak", xp: 200, condition: (g) => g.currentStreak >= 30 },
  { id: "assignment_first", name: "Task Tackler", desc: "Complete your first assignment", icon: "✅", category: "tasks", xp: 10, condition: (g) => g.totalAssignmentsDone >= 1 },
  { id: "assignment_25", name: "Productive Pro", desc: "Complete 25 assignments", icon: "📋", category: "tasks", xp: 75, condition: (g) => g.totalAssignmentsDone >= 25 },
  { id: "early_bird", name: "Early Bird", desc: "Complete 5 assignments before deadline", icon: "🐦", category: "tasks", xp: 50, condition: (g) => g.earlyAssignments >= 5 },
  { id: "arena_first", name: "Battleground Entry", desc: "Complete your first arena battle", icon: "⚔️", category: "arena", xp: 15, condition: (g) => (g.arenaWins + g.arenaLosses) >= 1 },
  { id: "arena_win_5", name: "Rising Champion", desc: "Win 5 arena battles", icon: "🥊", category: "arena", xp: 50, condition: (g) => g.arenaWins >= 5 },
  { id: "arena_win_25", name: "Arena Legend", desc: "Win 25 arena battles", icon: "🌟", category: "arena", xp: 200, condition: (g) => g.arenaWins >= 25 },
  { id: "onboarding_done", name: "Welcome Aboard", desc: "Complete the onboarding process", icon: "🚀", category: "profile", xp: 10, condition: (g) => g._onboardingDone },
  { id: "goals_set", name: "Goal-Oriented", desc: "Set your study goals", icon: "🎯", category: "profile", xp: 10, condition: (g) => g._goalsSet },
  { id: "login_7", name: "Dedicated", desc: "Log in on 7 different days", icon: "📅", category: "profile", xp: 30, condition: (g) => g.uniqueLogins >= 7 },
  { id: "login_30", name: "Committed", desc: "Log in on 30 different days", icon: "💎", category: "profile", xp: 100, condition: (g) => g.uniqueLogins >= 30 },
];

export const TITLES = [
  { id: "scholar", name: "Scholar", unlockLevel: 5 },
  { id: "focus_master", name: "Focus Master", condition: (g) => g.totalFocusMinutes >= 500 },
  { id: "quiz_wizard", name: "Quiz Wizard", condition: (g) => g.totalQuizzes >= 50 },
  { id: "arena_champion", name: "Arena Champion", condition: (g) => g.arenaWins >= 25 },
  { id: "streak_lord", name: "Streak Lord", condition: (g) => g.longestStreak >= 30 },
  { id: "legend", name: "Legend", unlockLevel: 50 },
];

export const DEFAULT_GAMIFICATION = {
  xp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  lastStudyDate: null,
  totalFocusMinutes: 0,
  totalSessions: 0,
  totalQuizzes: 0,
  totalCorrect: 0,
  totalExams: 0,
  perfectQuizCount: 0,
  hardQuizzes: 0,
  totalAssignmentsDone: 0,
  earlyAssignments: 0,
  arenaWins: 0,
  arenaLosses: 0,
  achievements: [],
  titles: [],
  activeTitle: null,
  uniqueLogins: 0,
  lastLoginDate: null,
  loginDates: [],
};

export function calculateLevel(xp) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelXp = (level - 1) * XP_PER_LEVEL;
  const nextLevelXp = level * XP_PER_LEVEL;
  const progress = xp - currentLevelXp;
  const needed = nextLevelXp - currentLevelXp;
  return { level: Math.min(level, MAX_LEVEL), progress, needed, progressPct: Math.min((progress / needed) * 100, 100) };
}

export function xpForAction(actionType, data = {}) {
  const diff = DIFFICULTY_MULTIPLIERS[data.difficulty] || 1;
  switch (actionType) {
    case "session_complete": return Math.round(10 * diff);
    case "session_reflection": return 5;
    case "quiz_complete": return Math.round(data.score * 5 * diff);
    case "quiz_perfect": return 20;
    case "exam_complete": return Math.round(15 * diff);
    case "flashcard_generate": return 5;
    case "battle_complete": return 10;
    case "battle_win": return 15;
    case "assignment_complete": return Math.round(10 * (PRIORITY_MULTIPLIERS[data.priority] || 1));
    case "assignment_early": return 5;
    case "roadmap_milestone": return 20;
    case "daily_login": return 2;
    case "daily_goal_hit": return 15;
    default: return 0;
  }
}

export function computeStreak(lastStudyDate) {
  if (!lastStudyDate) return { currentStreak: 0, isConsecutive: false };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastStudyDate);
  last.setHours(0, 0, 0, 0);
  const diffMs = today - last;
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays === 0) return { currentStreak: 0, isConsecutive: false };
  if (diffDays === 1) return { currentStreak: 1, isConsecutive: true };
  return { currentStreak: 0, isConsecutive: false };
}

export function computeLoginStreak(lastLoginDate, loginDates = []) {
  if (!lastLoginDate) return { uniqueLogins: loginDates.length, loginDates };
  const today = new Date().toISOString().split("T")[0];
  const updated = [...new Set([...loginDates, today])];
  return { uniqueLogins: updated.length, loginDates: updated };
}

export function checkAchievements(gamification, context = {}) {
  const g = { ...gamification, ...context };
  const newAchievements = [];
  for (const ach of ACHIEVEMENTS) {
    if (g.achievements?.includes(ach.id)) continue;
    try {
      if (ach.condition(g)) {
        newAchievements.push(ach);
      }
    } catch { }
  }
  return newAchievements;
}

export function checkTitles(gamification) {
  const g = gamification;
  const newTitles = [];
  for (const title of TITLES) {
    if (g.titles?.includes(title.id)) continue;
    if (title.unlockLevel && g.level >= title.unlockLevel) {
      newTitles.push(title);
    } else if (title.condition && title.condition(g)) {
      newTitles.push(title);
    }
  }
  return newTitles;
}

export async function awardXpAndCheckAchievements(uid, actionType, context = {}) {
  if (!uid) return { xpGained: 0, newAchievements: [], newTitles: [], newLevel: 1, levelUp: false };
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return { xpGained: 0, newAchievements: [], newTitles: [], newLevel: 1, levelUp: false };
  const data = snap.data();
  const g = { ...DEFAULT_GAMIFICATION, ...data.gamification, ...context };
  const oldLevel = calculateLevel(g.xp).level;
  const xpGained = xpForAction(actionType, context);
  const newTotalXp = g.xp + xpGained;
  const newLevel = calculateLevel(newTotalXp).level;
  const levelUp = newLevel > oldLevel;
  const updatedG = { ...g, xp: newTotalXp, level: newLevel };
  const newAchievements = checkAchievements(updatedG, context);
  const newTitles = checkTitles(updatedG);
  const unlockedAchievements = [...(g.achievements || []), ...newAchievements.map((a) => a.id)];
  const unlockedTitles = [...new Set([...(g.titles || []), ...newTitles.map((t) => t.id)])];
  const updateData = {
    gamification: {
      ...g,
      xp: newTotalXp,
      level: newLevel,
      achievements: unlockedAchievements,
      titles: unlockedTitles,
      ...(context.gamificationUpdate || {}),
    },
  };
  try {
    await updateDoc(userRef, updateData);
  } catch (err) {
    console.error("Failed to update gamification:", err);
  }
  return { xpGained, newAchievements, newTitles, newLevel, levelUp, oldLevel };
}

export async function incrementGamificationField(uid, field, amount = 1) {
  if (!uid) return;
  const userRef = doc(db, "users", uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const g = { ...DEFAULT_GAMIFICATION, ...data.gamification };
    await updateDoc(userRef, {
      gamification: {
        ...g,
        [field]: (g[field] || 0) + amount,
      },
    });
  } catch (err) {
    console.error("Failed to increment gamification field:", err);
  }
}
