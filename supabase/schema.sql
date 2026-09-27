-- ==============================================================================
-- StudyBuddy Supabase Database Schema
-- Complete PostgreSQL schema replacing Firebase Authentication & Firestore.
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (User profiles linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT DEFAULT '',
  photo_url TEXT,
  provider_id TEXT DEFAULT 'email',
  onboarding_completed BOOLEAN DEFAULT false,
  gamification JSONB DEFAULT '{
    "xp": 0,
    "level": 1,
    "currentStreak": 0,
    "longestStreak": 0,
    "lastStudyDate": null,
    "totalFocusMinutes": 0,
    "totalSessions": 0,
    "totalQuizzes": 0,
    "totalCorrect": 0,
    "totalExams": 0,
    "perfectQuizCount": 0,
    "hardQuizzes": 0,
    "totalAssignmentsDone": 0,
    "earlyAssignments": 0,
    "arenaWins": 0,
    "arenaLosses": 0,
    "achievements": [],
    "titles": [],
    "activeTitle": null,
    "uniqueLogins": 0,
    "lastLoginDate": null,
    "loginDates": []
  }'::jsonb,
  onboarding_data JSONB DEFAULT '{}'::jsonb,
  subjects JSONB DEFAULT '[]'::jsonb,
  academic_profile JSONB DEFAULT '{}'::jsonb,
  goals JSONB DEFAULT '{"targetSGPA":"9.0","studyHours":"3"}'::jsonb,
  about_you JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to automatically create a profile row upon Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, photo_url, provider_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'displayName', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', new.raw_user_meta_data->>'photoURL', NULL),
    COALESCE(new.raw_app_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 2. STUDY SESSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT,
  subject_name TEXT,
  topic TEXT,
  duration INTEGER DEFAULT 0,
  rating INTEGER DEFAULT 3,
  reflection TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own study sessions" ON public.study_sessions;
CREATE POLICY "Users can manage own study sessions"
  ON public.study_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. ASSIGNMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject_id TEXT,
  subject_name TEXT,
  due_date TEXT,
  due_time TEXT,
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'Pending',
  notes TEXT DEFAULT '',
  points INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own assignments" ON public.assignments;
CREATE POLICY "Users can manage own assignments"
  ON public.assignments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_assignments_user ON public.assignments(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 4. EXAMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject_id TEXT,
  subject_name TEXT,
  date TEXT,
  time TEXT DEFAULT '09:00',
  syllabus TEXT DEFAULT '',
  priority TEXT DEFAULT 'Medium',
  target_score TEXT DEFAULT '90',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own exams" ON public.exams;
CREATE POLICY "Users can manage own exams"
  ON public.exams FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_exams_user ON public.exams(user_id, date ASC);

-- ------------------------------------------------------------------------------
-- 5. PRACTICE HISTORY TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.practice_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'quiz',
  subject_id TEXT,
  subject_name TEXT,
  topic TEXT,
  difficulty TEXT DEFAULT 'Medium',
  score NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  questions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.practice_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own practice history" ON public.practice_history;
CREATE POLICY "Users can manage own practice history"
  ON public.practice_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_practice_history_user ON public.practice_history(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. NOTES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT,
  subject_name TEXT,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own notes" ON public.notes;
CREATE POLICY "Users can manage own notes"
  ON public.notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notes_user ON public.notes(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. RESOURCES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT,
  subject_name TEXT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'Link',
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own resources" ON public.resources;
CREATE POLICY "Users can manage own resources"
  ON public.resources FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_resources_user ON public.resources(user_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 8. ROADMAPS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id TEXT,
  subject_name TEXT,
  target_date TEXT,
  milestones JSONB DEFAULT '[]'::jsonb,
  weeks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own roadmaps" ON public.roadmaps;
CREATE POLICY "Users can manage own roadmaps"
  ON public.roadmaps FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user ON public.roadmaps(user_id, created_at DESC);

-- Helper function to check if a user is the host or an enrolled participant in a room
CREATE OR REPLACE FUNCTION public.is_room_member(room_host uuid, room_participants jsonb, user_id uuid)
RETURNS boolean AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  IF room_host = user_id THEN
    RETURN true;
  END IF;
  IF room_participants IS NOT NULL AND room_participants @> jsonb_build_array(jsonb_build_object('uid', user_id::text)) THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 9. MULTIPLAYER BATTLE ARENA ROOMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rooms (
  code TEXT PRIMARY KEY,
  host UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  config JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'lobby',
  participants JSONB DEFAULT '[]'::jsonb,
  questions JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  started_at TIMESTAMPTZ
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can view room metadata by code to join lobbies or spectate
DROP POLICY IF EXISTS "Authenticated users can view rooms" ON public.rooms;
CREATE POLICY "Authenticated users can view rooms"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (true);

-- Only the host can create a room
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.rooms;
CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host);

-- Only current room members (host/participants) or users joining an open lobby can update a room
DROP POLICY IF EXISTS "Participants can update room" ON public.rooms;
DROP POLICY IF EXISTS "Members or joining users can update room" ON public.rooms;
CREATE POLICY "Members or joining users can update room"
  ON public.rooms FOR UPDATE
  TO authenticated
  USING (
    public.is_room_member(host, participants, auth.uid())
    OR (status = 'lobby' AND jsonb_array_length(participants) < 10)
  )
  WITH CHECK (
    public.is_room_member(host, participants, auth.uid())
    OR (status = 'lobby')
  );

-- Only the host or a room member can delete the room
DROP POLICY IF EXISTS "Host can delete room" ON public.rooms;
DROP POLICY IF EXISTS "Host or last participant can delete room" ON public.rooms;
CREATE POLICY "Host or last participant can delete room"
  ON public.rooms FOR DELETE
  TO authenticated
  USING (
    auth.uid() = host
    OR public.is_room_member(host, participants, auth.uid())
  );

-- ------------------------------------------------------------------------------
-- 10. ROOM ANSWERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.room_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL REFERENCES public.rooms(code) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_room_user_answer UNIQUE(room_code, user_id)
);

ALTER TABLE public.room_answers ENABLE ROW LEVEL SECURITY;

-- Answers can only be viewed by the user who submitted them or by members of that specific room
DROP POLICY IF EXISTS "Authenticated users can view room answers" ON public.room_answers;
DROP POLICY IF EXISTS "Participants can view room answers" ON public.room_answers;
CREATE POLICY "Participants can view room answers"
  ON public.room_answers FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.code = room_answers.room_code
        AND public.is_room_member(r.host, r.participants, auth.uid())
    )
  );

-- Users can only insert answers for themselves, and only in rooms they belong to
DROP POLICY IF EXISTS "Users can insert own room answers" ON public.room_answers;
CREATE POLICY "Users can insert own room answers"
  ON public.room_answers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.code = room_answers.room_code
        AND public.is_room_member(r.host, r.participants, auth.uid())
    )
  );

-- Users can only update their own answers in rooms they belong to
DROP POLICY IF EXISTS "Users can update own room answers" ON public.room_answers;
CREATE POLICY "Users can update own room answers"
  ON public.room_answers FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.code = room_answers.room_code
        AND public.is_room_member(r.host, r.participants, auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.code = room_answers.room_code
        AND public.is_room_member(r.host, r.participants, auth.uid())
    )
  );

-- Users can delete their own answers, or the room host can delete room answers
DROP POLICY IF EXISTS "Users or host can delete room answers" ON public.room_answers;
CREATE POLICY "Users or host can delete room answers"
  ON public.room_answers FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.code = room_answers.room_code
        AND r.host = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- 11. ENABLE REALTIME SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.assignments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'exams'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.exams;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'study_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'practice_history'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.practice_history;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'resources'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.resources;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'roadmaps'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.roadmaps;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'room_answers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_answers;
  END IF;
END $$;
