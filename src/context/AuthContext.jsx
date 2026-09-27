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
import { auth, googleProvider, db, isFirebaseConfigured, missingFirebaseEnvVars, firebaseInitError } from "../firebase";
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
  if (!user || !db) return;
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
    if (!auth) {
      throw new Error(
        `Firebase Auth is not initialized. Missing environment variables: ${missingFirebaseEnvVars.join(", ")}`
      );
    }
    const res = await signInWithEmailAndPassword(auth, email, password);
    await syncUserDataToFirestore(res.user);
    return res;
  };

  // Email/Password Register
  const registerWithEmail = async (email, password, displayName) => {
    if (!auth) {
      throw new Error(
        `Firebase Auth is not initialized. Missing environment variables: ${missingFirebaseEnvVars.join(", ")}`
      );
    }
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(res.user, { displayName });
    }
    await syncUserDataToFirestore(res.user, { displayName });
    return res;
  };

  // Google OAuth Login
  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      throw new Error(
        `Firebase Auth is not initialized. Missing environment variables: ${missingFirebaseEnvVars.join(", ")}`
      );
    }
    const res = await signInWithPopup(auth, googleProvider);
    await syncUserDataToFirestore(res.user);
    return res;
  };

  // Logout
  const logout = async () => {
    if (!auth) return;
    return await signOut(auth);
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      setProfileLoaded(true);
      return;
    }

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
      if (typeof unsubscribeAuth === "function") unsubscribeAuth();
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
    isFirebaseConfigured,
    missingFirebaseEnvVars,
    firebaseInitError,
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
        <div className="max-w-xl w-full bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3 text-amber-400 mb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-2xl font-bold">
              ⚠️
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Firebase Configuration Required</h1>
              <p className="text-xs text-amber-400/90 font-medium">Missing environment variables detected</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-5 leading-relaxed">
            StudyBuddy could not connect to Firebase because required environment variables are missing in this environment.
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
            <p className="text-xs uppercase tracking-wider font-semibold text-amber-400 mb-2">
              Missing Variable(s):
            </p>
            <ul className="text-xs font-mono text-rose-300 space-y-1.5">
              {missingFirebaseEnvVars.map((v) => (
                <li key={v} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-indigo-300">How to fix on Vercel:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Open your project dashboard on <span className="text-slate-200">vercel.com</span>.</li>
              <li>Navigate to <strong className="text-slate-200">Settings</strong> &rarr; <strong className="text-slate-200">Environment Variables</strong>.</li>
              <li>Add the variable names above using the credentials from your Firebase Project Console.</li>
              <li>Trigger a <strong className="text-slate-200">Redeploy</strong> (or push a new commit) for Vercel to rebuild with these variables.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
