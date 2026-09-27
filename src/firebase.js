import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Required Firebase environment variables for StudyBuddy
export const REQUIRED_FIREBASE_ENV_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

// Helper to safely read env variables (supports VITE_ prefix as standard, with fallback)
const getEnvVar = (key) => {
  const fallbackKey = key.replace(/^VITE_/, "");
  const value = import.meta.env[key] ?? import.meta.env[fallbackKey];
  return typeof value === "string" ? value.trim() : "";
};

const apiKey = getEnvVar("VITE_FIREBASE_API_KEY");
const authDomain = getEnvVar("VITE_FIREBASE_AUTH_DOMAIN");
const projectId = getEnvVar("VITE_FIREBASE_PROJECT_ID");
const storageBucket = getEnvVar("VITE_FIREBASE_STORAGE_BUCKET");
const messagingSenderId = getEnvVar("VITE_FIREBASE_MESSAGING_SENDER_ID");
const appId = getEnvVar("VITE_FIREBASE_APP_ID");
const measurementId = getEnvVar("VITE_FIREBASE_MEASUREMENT_ID");

// Check for any missing required variables
export const missingFirebaseEnvVars = REQUIRED_FIREBASE_ENV_VARS.filter(
  (key) => !getEnvVar(key)
);

export const isFirebaseConfigured = missingFirebaseEnvVars.length === 0;

let app = null;
let auth = null;
let googleProvider = null;
let db = null;
let firebaseInitError = null;

if (!isFirebaseConfigured) {
  const errorMsg = `[StudyBuddy Firebase] Missing required environment variables: ${missingFirebaseEnvVars.join(", ")}. If running on Vercel, please add these in Project Settings -> Environment Variables.`;
  console.error(errorMsg);
  firebaseInitError = new Error(errorMsg);
} else {
  try {
    const firebaseConfig = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      ...(measurementId ? { measurementId } : {}),
    };

    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    db = getFirestore(app);
  } catch (err) {
    console.error("[StudyBuddy Firebase] Initialization error:", err);
    firebaseInitError = err;
  }
}

export { app, auth, googleProvider, db, firebaseInitError };
export default app;
