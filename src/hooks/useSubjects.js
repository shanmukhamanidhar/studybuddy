import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

// Palette of accent colors for subjects if not already assigned
const DEFAULT_COLORS = [
  "#D4A017", // Amber / Gold
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#F97316", // Orange
  "#06B6D4", // Cyan
];

/**
 * Custom hook to manage realtime subject data from the `users/{uid}` document.
 * Matches the exact onboarding data model where `subjects` is an array inside `users/{uid}`.
 * @param {string|null} uid - Current authenticated user ID
 */
export function useSubjects(uid) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const userRef = doc(db, "users", uid);

    const unsubscribe = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const rawSubjects = Array.isArray(data.subjects) ? data.subjects : [];

          // Enrich raw subjects with default UI attributes if missing
          const normalized = rawSubjects.map((s, idx) => ({
            id: s.id || `sub_${idx}_${Date.now()}`,
            name: s.name || "Untitled Subject",
            courseCode: s.courseCode || s.code || "",
            difficulty: s.difficulty || "Medium",
            color: s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
            progress: typeof s.progress === "number" ? s.progress : 0,
            totalStudyMinutes: typeof s.totalStudyMinutes === "number" ? s.totalStudyMinutes : 0,
            lastStudiedAt: s.lastStudiedAt || null,
            credits: s.credits || 3,
            type: s.type || "Theory",
          }));

          setSubjects(normalized);
        } else {
          setSubjects([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error loading user subjects:", err);
        setError("Failed to load subjects.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  // Add a new subject to the user's `subjects` array
  const createSubject = async ({ name, courseCode = "", difficulty = "Medium", color = "#D4A017" }) => {
    if (!uid) throw new Error("User not authenticated.");
    const userRef = doc(db, "users", uid);

    const newSubject = {
      id: `sub_${Date.now()}`,
      name: name.trim(),
      courseCode: courseCode.trim(),
      difficulty,
      color,
      progress: 0,
      totalStudyMinutes: 0,
      lastStudiedAt: null,
      credits: 3,
      type: "Theory",
      createdAt: new Date().toISOString(),
    };

    const updatedSubjects = [newSubject, ...subjects];
    return await setDoc(userRef, { subjects: updatedSubjects, updatedAt: serverTimestamp() }, { merge: true });
  };

  // Update a subject inside the user's `subjects` array
  const updateSubject = async (subjectId, updates) => {
    if (!uid) throw new Error("User not authenticated.");
    const userRef = doc(db, "users", uid);

    const updatedSubjects = subjects.map((s) => (s.id === subjectId ? { ...s, ...updates } : s));
    return await updateDoc(userRef, {
      subjects: updatedSubjects,
      updatedAt: serverTimestamp(),
    });
  };

  // Delete a subject from the user's `subjects` array
  const deleteSubject = async (subjectId) => {
    if (!uid) throw new Error("User not authenticated.");
    const userRef = doc(db, "users", uid);

    const updatedSubjects = subjects.filter((s) => s.id !== subjectId);
    return await updateDoc(userRef, {
      subjects: updatedSubjects,
      updatedAt: serverTimestamp(),
    });
  };

  return {
    subjects,
    loading,
    error,
    createSubject,
    updateSubject,
    deleteSubject,
  };
}
