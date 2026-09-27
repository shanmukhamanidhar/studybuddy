import { createClient } from "@supabase/supabase-js";

export const REQUIRED_SUPABASE_ENV_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
];

const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL ||
  ""
).trim();

const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.SUPABASE_ANON_KEY ||
  ""
).trim();

export const missingSupabaseEnvVars = [
  !supabaseUrl ? "VITE_SUPABASE_URL" : null,
  !supabaseAnonKey ? "VITE_SUPABASE_ANON_KEY" : null,
].filter(Boolean);

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
