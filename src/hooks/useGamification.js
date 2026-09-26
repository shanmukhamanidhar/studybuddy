import { useState, useEffect, useCallback, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  DEFAULT_GAMIFICATION,
  calculateLevel,
  computeStreak,
  computeLoginStreak,
  checkAchievements,
  checkTitles,
  awardXpAndCheckAchievements,
  ACHIEVEMENTS,
  TITLES,
} from "../utils/gamification";

export function useGamification(uid) {
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [xpToast, setXpToast] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const recentAchievementsRef = useRef([]);
  const xpToastTimerRef = useRef(null);

  useEffect(() => {
    if (!uid) {
      setGamification(null);
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "users", uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setGamification({ ...DEFAULT_GAMIFICATION, ...data.gamification });
        } else {
          setGamification(DEFAULT_GAMIFICATION);
        }
        setLoading(false);
      },
      () => {
        setGamification(DEFAULT_GAMIFICATION);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [uid]);

  const computedLevel = gamification
    ? calculateLevel(gamification.xp)
    : { level: 1, progress: 0, needed: 500, progressPct: 0 };

  const streak = gamification
    ? computeStreak(gamification.lastStudyDate)
    : { currentStreak: 0, isConsecutive: false };

  const unlockedAchievementsList = gamification?.achievements || [];
  const allAchievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedAchievementsList.includes(a.id),
    unlockedAt: null,
  }));

  const unlockedTitleIds = gamification?.titles || [];
  const allTitles = TITLES.map((t) => ({
    ...t,
    unlocked: unlockedTitleIds.includes(t.id),
  }));

  const earnedAchievementXp = ACHIEVEMENTS
    .filter((a) => unlockedAchievementsList.includes(a.id))
    .reduce((sum, a) => sum + a.xp, 0);

  const award = useCallback(
    async (actionType, context = {}) => {
      if (!uid) return null;
      const result = await awardXpAndCheckAchievements(uid, actionType, context);
      if (result.xpGained > 0) {
        setXpToast({ xp: result.xpGained, action: actionType });
        if (xpToastTimerRef.current) clearTimeout(xpToastTimerRef.current);
        xpToastTimerRef.current = setTimeout(() => setXpToast(null), 2500);
      }
      if (result.levelUp) {
        setLevelUpInfo({ oldLevel: result.oldLevel, newLevel: result.newLevel });
        setTimeout(() => setLevelUpInfo(null), 3500);
      }
      if (result.newAchievements?.length > 0) {
        recentAchievementsRef.current = result.newAchievements;
        setRecentAchievements(result.newAchievements);
        setTimeout(() => setRecentAchievements([]), 4000);
      }
      return result;
    },
    [uid]
  );

  const dismissLevelUp = useCallback(() => setLevelUpInfo(null), []);

  return {
    gamification: gamification || DEFAULT_GAMIFICATION,
    loading,
    level: computedLevel.level,
    levelData: computedLevel,
    streak: streak.currentStreak || gamification?.currentStreak || 0,
    totalFocusMinutes: gamification?.totalFocusMinutes || 0,
    totalSessions: gamification?.totalSessions || 0,
    totalQuizzes: gamification?.totalQuizzes || 0,
    arenaWins: gamification?.arenaWins || 0,
    arenaLosses: gamification?.arenaLosses || 0,
    activeTitle: gamification?.activeTitle,
    achievements: allAchievements,
    titles: allTitles,
    earnedAchievementXp,
    award,
    levelUpInfo,
    dismissLevelUp,
    xpToast,
    recentAchievements,
  };
}
