import { createClient } from "@supabase/supabase-js";

export const REQUIRED_SUPABASE_ENV_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
];

const getEnvVar = (key) => {
  const fallbackKey = key.replace(/^VITE_/, "");
  const value = import.meta.env[key] ?? import.meta.env[fallbackKey];
  return typeof value === "string" ? value.trim() : "";
};

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY");

export const missingSupabaseEnvVars = REQUIRED_SUPABASE_ENV_VARS.filter(
  (key) => !getEnvVar(key)
);

export const isSupabaseConfigured = missingSupabaseEnvVars.length === 0;

let supabase = null;
let supabaseInitError = null;

if (!isSupabaseConfigured) {
  const errorMsg = `[StudyBuddy Supabase] Missing required environment variables: ${missingSupabaseEnvVars.join(
    ", "
  )}. Please add these to your environment (.env or Vercel Project Settings).`;
  console.warn(errorMsg);
  supabaseInitError = new Error(errorMsg);
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error("[StudyBuddy Supabase] Initialization error:", err);
    supabaseInitError = err;
  }
}

export { supabase, supabaseInitError };
export default supabase;
