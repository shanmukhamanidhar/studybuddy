import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured, missingSupabaseEnvVars } from "../lib/supabase";
import { getProfile, upsertProfile, subscribeProfile } from "../lib/supabaseDb";
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
 * Formats a Supabase user object into the structure expected by StudyBuddy components,
 * ensuring `.uid` exists alongside `.id`.
 */
function formatAuthUser(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const displayName = meta.full_name || meta.name || meta.displayName || user.email?.split("@")[0] || "";
  const photoURL = meta.avatar_url || meta.picture || meta.photoURL || null;

  return {
    ...user,
    uid: user.id,
    displayName,
    photoURL,
  };
}

/**
 * Stores/Syncs User Document into Supabase 'profiles' table.
 * Preserves the name `syncUserDataToFirestore` for backwards compatibility with existing callers.
 */
export async function syncUserDataToFirestore(user, additionalData = {}) {
  if (!user || !isSupabaseConfigured || !supabase) return;
  const uid = user.id || user.uid;
  try {
    const meta = user.user_metadata || {};
    const displayName = user.displayName || meta.full_name || meta.name || additionalData.displayName || "";
    const photoURL = user.photoURL || meta.avatar_url || meta.picture || null;

    const profileData = {
      email: user.email || "",
      displayName,
      photoURL,
      providerId: user.app_metadata?.provider || "email",
      lastLoginAt: new Date().toISOString(),
      ...additionalData,
    };

    return await upsertProfile(uid, profileData);
  } catch (err) {
    console.warn("[StudyBuddy Supabase] sync user profile notice:", err);
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Email/Password Login
  const loginWithEmail = async (email, password) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        `Supabase is not configured. Missing environment variables: ${missingSupabaseEnvVars.join(", ")}`
      );
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      const customError = new Error(error.message);
      if (
        error.message.toLowerCase().includes("invalid login credentials") ||
        error.message.toLowerCase().includes("invalid grant")
      ) {
        customError.code = "auth/invalid-credential";
      }
      throw customError;
    }

    const formattedUser = formatAuthUser(data.user);
    setCurrentUser(formattedUser);
    await syncUserDataToFirestore(formattedUser);
    return { user: formattedUser, session: data.session };
  };

  // Email/Password Register
  const registerWithEmail = async (email, password, displayName) => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        `Supabase is not configured. Missing environment variables: ${missingSupabaseEnvVars.join(", ")}`
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: displayName?.trim() || "",
          name: displayName?.trim() || "",
        },
      },
    });

    if (error) {
      const customError = new Error(error.message);
      if (
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists") ||
        error.message.toLowerCase().includes("user already registered")
      ) {
        customError.code = "auth/email-already-in-use";
      } else if (error.message.toLowerCase().includes("weak password")) {
        customError.code = "auth/weak-password";
      }
      throw customError;
    }

    const formattedUser = formatAuthUser(data.user);
    if (formattedUser) {
      setCurrentUser(formattedUser);
      await syncUserDataToFirestore(formattedUser, { displayName });
    }
    return { user: formattedUser, session: data.session };
  };

  // Google OAuth Login
  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        `Supabase is not configured. Missing environment variables: ${missingSupabaseEnvVars.join(", ")}`
      );
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    return data;
  };

  // Logout
  const logout = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCurrentUser(null);
    setUserProfile(null);
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setProfileLoaded(true);
      return;
    }

    let unsubProfile = null;

    const setupUser = (rawUser) => {
      if (rawUser) {
        const formatted = formatAuthUser(rawUser);
        setCurrentUser(formatted);
        syncUserDataToFirestore(formatted);

        if (unsubProfile) unsubProfile();
        unsubProfile = subscribeProfile(formatted.uid, (profile) => {
          if (profile) {
            setUserProfile(profile);
          } else {
            setUserProfile(null);
          }
          setProfileLoaded(true);
          setLoading(false);
        });
      } else {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }
        setCurrentUser(null);
        setUserProfile(null);
        setProfileLoaded(true);
        setLoading(false);
      }
    };

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setupUser(session?.user || null);
    }).catch((err) => {
      console.warn("[StudyBuddy Supabase] getSession notice:", err);
      setLoading(false);
      setProfileLoaded(true);
    });

    // 2. Realtime auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setupUser(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
      if (unsubProfile) unsubProfile();
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
    isSupabaseConfigured,
    missingSupabaseEnvVars,
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white">
        <div className="max-w-xl w-full bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="flex items-center gap-3 text-amber-400 mb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-2xl font-bold">
              ⚡
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Supabase Configuration Required</h1>
              <p className="text-xs text-amber-400/90 font-medium">Missing environment variables detected</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-5 leading-relaxed">
            StudyBuddy is ready to connect with Supabase, but the required environment variables have not been configured yet.
          </p>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
            <p className="text-xs uppercase tracking-wider font-semibold text-amber-400 mb-2">
              Missing Variable(s):
            </p>
            <ul className="text-xs font-mono text-rose-300 space-y-1.5">
              {missingSupabaseEnvVars.map((v) => (
                <li key={v} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{v}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 text-xs text-slate-300 space-y-2">
            <p className="font-semibold text-indigo-300">How to configure on Vercel:</p>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>Open your project dashboard on <span className="text-slate-200">vercel.com</span>.</li>
              <li>Navigate to <strong className="text-slate-200">Settings</strong> &rarr; <strong className="text-slate-200">Environment Variables</strong>.</li>
              <li>Add the variable names above with your Supabase Project URL and public anon key.</li>
              <li>Trigger a <strong className="text-slate-200">Redeploy</strong> to apply the changes.</li>
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
