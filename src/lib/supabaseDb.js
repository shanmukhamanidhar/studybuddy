import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Normalizes a profile record from Supabase Postgres to match
 * the exact property structure expected by StudyBuddy components.
 */
export function normalizeProfile(raw) {
  if (!raw) return null;
  const uid = raw.id || raw.uid;
  const displayName = raw.display_name || raw.displayName || "";
  const photoURL = raw.photo_url || raw.photoURL || null;
  const providerId = raw.provider_id || raw.providerId || "email";
  const onboardingCompleted = Boolean(raw.onboarding_completed ?? raw.onboardingCompleted);
  const onboardingData = raw.onboarding_data || raw.onboardingData || {};
  const academicProfile = raw.academic_profile || raw.academicProfile || {};
  const aboutYou = raw.about_you || raw.aboutYou || {};
  const goals = raw.goals || { targetSGPA: "9.0", studyHours: "3" };
  const gamification = raw.gamification || {};
  const subjects = Array.isArray(raw.subjects) ? raw.subjects : [];
  const createdAt = raw.created_at || raw.createdAt || new Date().toISOString();
  const updatedAt = raw.updated_at || raw.updatedAt || new Date().toISOString();
  const lastLoginAt = raw.last_login_at || raw.lastLoginAt || new Date().toISOString();

  return {
    ...raw,
    uid,
    id: uid,
    email: raw.email || "",
    displayName,
    display_name: displayName,
    photoURL,
    photo_url: photoURL,
    providerId,
    provider_id: providerId,
    onboardingCompleted,
    onboarding_completed: onboardingCompleted,
    onboardingData,
    onboarding_data: onboardingData,
    academicProfile,
    academic_profile: academicProfile,
    aboutYou,
    about_you: aboutYou,
    goals,
    gamification,
    subjects,
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt,
    lastLoginAt,
    last_login_at: lastLoginAt,
  };
}

/**
 * Converts user updates into snake_case database columns for the `profiles` table.
 */
export function denormalizeProfileUpdate(updates = {}) {
  const payload = {};

  for (const [key, value] of Object.entries(updates)) {
    if (key === "displayName" || key === "display_name") {
      payload.display_name = value;
    } else if (key === "photoURL" || key === "photo_url") {
      payload.photo_url = value;
    } else if (key === "onboardingCompleted" || key === "onboarding_completed") {
      payload.onboarding_completed = value;
    } else if (key === "onboardingData" || key === "onboarding_data") {
      payload.onboarding_data = value;
    } else if (key === "academicProfile" || key === "academic_profile") {
      payload.academic_profile = value;
    } else if (key === "aboutYou" || key === "about_you") {
      payload.about_you = value;
    } else if (key === "lastLoginAt" || key === "last_login_at") {
      payload.last_login_at = value;
    } else if (key.startsWith("aboutYou.")) {
      // nested updates like "aboutYou.preferredName"
      const subKey = key.split(".")[1];
      payload.about_you = payload.about_you || {};
      payload.about_you[subKey] = value;
    } else if (key.startsWith("goals.")) {
      const subKey = key.split(".")[1];
      payload.goals = payload.goals || {};
      payload.goals[subKey] = value;
    } else if (key !== "id" && key !== "uid" && key !== "updatedAt") {
      payload[key] = value;
    }
  }

  payload.updated_at = new Date().toISOString();
  return payload;
}

/**
 * Normalizes item records for subcollection tables
 * (assignments, exams, notes, resources, etc.)
 */
export function normalizeRecord(raw) {
  if (!raw) return null;
  const createdAt = raw.created_at || raw.createdAt;
  const updatedAt = raw.updated_at || raw.updatedAt;
  const subjectId = raw.subject_id ?? raw.subjectId ?? null;
  const subjectName = raw.subject_name ?? raw.subjectName ?? "";
  const dueDate = raw.due_date ?? raw.dueDate ?? null;
  const dueTime = raw.due_time ?? raw.dueTime ?? null;
  const targetScore = raw.target_score ?? raw.targetScore ?? null;
  const targetDate = raw.target_date ?? raw.targetDate ?? null;

  return {
    ...raw,
    createdAt,
    created_at: createdAt,
    updatedAt,
    updated_at: updatedAt,
    subjectId,
    subject_id: subjectId,
    subjectName,
    subject_name: subjectName,
    dueDate,
    due_date: dueDate,
    dueTime,
    due_time: dueTime,
    targetScore,
    target_score: targetScore,
    targetDate,
    target_date: targetDate,
  };
}

// ------------------------------------------------------------------------------
// PROFILES API
// ------------------------------------------------------------------------------
export async function getProfile(uid) {
  if (!isSupabaseConfigured || !supabase || !uid) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (error) {
      console.warn("[StudyBuddy Supabase] getProfile error:", error.message);
      return null;
    }
    return normalizeProfile(data);
  } catch (err) {
    console.warn("[StudyBuddy Supabase] getProfile exception:", err);
    return null;
  }
}

export async function upsertProfile(uid, profileData = {}) {
  if (!isSupabaseConfigured || !supabase || !uid) return null;
  try {
    const payload = denormalizeProfileUpdate(profileData);
    payload.id = uid;

    // Handle nested merges if existing profile exists
    if (payload.goals || payload.about_you) {
      const existing = await getProfile(uid);
      if (existing) {
        if (payload.goals) {
          payload.goals = { ...existing.goals, ...payload.goals };
        }
        if (payload.about_you) {
          payload.about_you = { ...existing.aboutYou, ...payload.about_you };
        }
      }
    }

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (error) throw error;
    return normalizeProfile(data);
  } catch (err) {
    console.error("[StudyBuddy Supabase] upsertProfile error:", err);
    throw err;
  }
}

export function subscribeProfile(uid, callback) {
  if (!isSupabaseConfigured || !supabase || !uid) {
    callback(null);
    return () => {};
  }

  let active = true;

  // Initial fetch
  getProfile(uid).then((p) => {
    if (active) callback(p);
  });

  const channel = supabase
    .channel(`profile:${uid}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${uid}`,
      },
      (payload) => {
        if (!active) return;
        if (payload.eventType === "DELETE") {
          callback(null);
        } else {
          callback(normalizeProfile(payload.new));
        }
      }
    )
    .subscribe();

  return () => {
    active = false;
    supabase.removeChannel(channel);
  };
}

// ------------------------------------------------------------------------------
// GENERIC USER-OWNED TABLE SUBSCRIPTION HELPER
// ------------------------------------------------------------------------------
function createCollectionManager(tableName, defaultOrderBy = { column: "created_at", ascending: false }) {
  return {
    async getAll(uid, filters = {}) {
      if (!isSupabaseConfigured || !supabase || !uid) return [];
      try {
        let q = supabase.from(tableName).select("*").eq("user_id", uid);
        if (filters.subjectId) {
          q = q.eq("subject_id", filters.subjectId);
        }
        if (defaultOrderBy) {
          q = q.order(defaultOrderBy.column, { ascending: defaultOrderBy.ascending });
        }
        const { data, error } = await q;
        if (error) {
          console.warn(`[StudyBuddy Supabase] ${tableName} getAll error:`, error.message);
          return [];
        }
        return (data || []).map(normalizeRecord);
      } catch (err) {
        console.warn(`[StudyBuddy Supabase] ${tableName} getAll exception:`, err);
        return [];
      }
    },

    subscribe(uid, callback, filters = {}) {
      if (!isSupabaseConfigured || !supabase || !uid) {
        callback([]);
        return () => {};
      }

      let active = true;

      const refresh = () => {
        this.getAll(uid, filters).then((items) => {
          if (active) callback(items);
        });
      };

      // Initial query
      refresh();

      const channel = supabase
        .channel(`${tableName}:${uid}${filters.subjectId ? `:${filters.subjectId}` : ""}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: tableName,
            filter: `user_id=eq.${uid}`,
          },
          () => {
            if (active) refresh();
          }
        )
        .subscribe();

      return () => {
        active = false;
        supabase.removeChannel(channel);
      };
    },

    async add(uid, item) {
      if (!isSupabaseConfigured || !supabase || !uid) return null;
      const {
        id,
        createdAt,
        created_at,
        updatedAt,
        updated_at,
        subjectId,
        subjectName,
        dueDate,
        dueTime,
        targetScore,
        targetDate,
        ...rest
      } = item;

      const payload = {
        ...rest,
        user_id: uid,
        created_at: new Date().toISOString(),
        ...(subjectId !== undefined ? { subject_id: subjectId } : {}),
        ...(subjectName !== undefined ? { subject_name: subjectName } : {}),
        ...(dueDate !== undefined ? { due_date: dueDate } : {}),
        ...(dueTime !== undefined ? { due_time: dueTime } : {}),
        ...(targetScore !== undefined ? { target_score: targetScore } : {}),
        ...(targetDate !== undefined ? { target_date: targetDate } : {}),
      };

      const { data, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error(`[StudyBuddy Supabase] ${tableName} add error:`, error);
        throw error;
      }
      return normalizeRecord(data);
    },

    async update(id, updates) {
      if (!isSupabaseConfigured || !supabase || !id) return null;
      const {
        subjectId,
        subjectName,
        dueDate,
        dueTime,
        targetScore,
        targetDate,
        updatedAt,
        updated_at,
        createdAt,
        created_at,
        id: _,
        ...rest
      } = updates;

      const payload = {
        ...rest,
        updated_at: new Date().toISOString(),
        ...(subjectId !== undefined ? { subject_id: subjectId } : {}),
        ...(subjectName !== undefined ? { subject_name: subjectName } : {}),
        ...(dueDate !== undefined ? { due_date: dueDate } : {}),
        ...(dueTime !== undefined ? { due_time: dueTime } : {}),
        ...(targetScore !== undefined ? { target_score: targetScore } : {}),
        ...(targetDate !== undefined ? { target_date: targetDate } : {}),
      };

      const { data, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(`[StudyBuddy Supabase] ${tableName} update error:`, error);
        throw error;
      }
      return normalizeRecord(data);
    },

    async delete(id) {
      if (!isSupabaseConfigured || !supabase || !id) return;
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) {
        console.error(`[StudyBuddy Supabase] ${tableName} delete error:`, error);
        throw error;
      }
    },
  };
}

// ------------------------------------------------------------------------------
// SUBCOLLECTION MANAGERS
// ------------------------------------------------------------------------------
export const assignmentsDb = createCollectionManager("assignments", { column: "created_at", ascending: false });
export const examsDb = createCollectionManager("exams", { column: "date", ascending: true });
export const studySessionsDb = createCollectionManager("study_sessions", { column: "created_at", ascending: false });
export const practiceHistoryDb = createCollectionManager("practice_history", { column: "created_at", ascending: false });
export const notesDb = createCollectionManager("notes", { column: "created_at", ascending: false });
export const resourcesDb = createCollectionManager("resources", { column: "created_at", ascending: false });
export const roadmapsDb = createCollectionManager("roadmaps", { column: "created_at", ascending: false });
