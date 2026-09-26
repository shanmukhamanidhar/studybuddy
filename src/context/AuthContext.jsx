import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase";
import { DEFAULT_GAMIFICATION } from "../utils/gamification";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Computes 2-letter initials from display name or email if Google photo is absent
 */
export function getUserInitials(user) {
  if (!user) return "SB";
  const name = (user.displayName && user.displayName.trim()) || user.email || "User";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  const cleanName = parts[0].replace(/[^a-zA-Z0-9]/g, "");
  if (cleanName.length >= 2) {
    return cleanName.substring(0, 2).toUpperCase();
  }
  return (cleanName[0] || "U").toUpperCase();
}

/**
 * Stores/Syncs User Document into Firestore 'users' collection
 */
export async function syncUserDataToFirestore(user, additionalData = {}) {
  if (!user) return;
  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    const userData = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || additionalData.displayName || "",
      photoURL: user.photoURL || null,
      providerId: user.providerData?.[0]?.providerId || "password",
      lastLoginAt: new Date().toISOString(),
      updatedAt: serverTimestamp(),
      ...additionalData,
    };

    if (!snap.exists()) {
      userData.createdAt = new Date().toISOString();
      userData.onboardingCompleted = false;
      userData.gamification = DEFAULT_GAMIFICATION;
    }

    await setDoc(userRef, userData, { merge: true });
  } catch (err) {
    console.warn("Firestore user sync notice:", err);
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Email/Password Login
  const loginWithEmail = async (email, password) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    await syncUserDataToFirestore(res.user);
    return res;
  };

  // Email/Password Register
  const registerWithEmail = async (email, password, displayName) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(res.user, { displayName });
    }
    await syncUserDataToFirestore(res.user, { displayName });
    return res;
  };

  // Google OAuth Login
  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    await syncUserDataToFirestore(res.user);
    return res;
  };

  // Logout
  const logout = async () => {
    return await signOut(auth);
  };

  useEffect(() => {
    let unsubDoc = null;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        syncUserDataToFirestore(user);
        const userRef = doc(db, "users", user.uid);
        unsubDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            setUserProfile(null);
          }
          setProfileLoaded(true);
          setLoading(false);
        }, (err) => {
          console.warn("Firestore onSnapshot error:", err);
          setProfileLoaded(true);
          setLoading(false);
        });
      } else {
        setUserProfile(null);
        setProfileLoaded(true);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    syncUserDataToFirestore,
    loading,
    profileLoaded,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
