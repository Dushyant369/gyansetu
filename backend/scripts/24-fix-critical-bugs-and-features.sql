-- ============================================
-- Script 24: Critical bug fixes + lectures/polls + course notifications
-- Run after 00-run-all-migrations.sql (or on existing Supabase project)
-- ============================================

-- ---------------------------------------------------------------------------
-- PART 1: Voting RLS — allow reading all votes; restrict writes to own row
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "allow authenticated question votes" ON question_votes;
DROP POLICY IF EXISTS "question_votes_select" ON question_votes;
DROP POLICY IF EXISTS "question_votes_insert" ON question_votes;
DROP POLICY IF EXISTS "question_votes_update" ON question_votes;
DROP POLICY IF EXISTS "question_votes_delete" ON question_votes;

CREATE POLICY "question_votes_select"
ON question_votes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "question_votes_insert"
ON question_votes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "question_votes_update"
ON question_votes FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "question_votes_delete"
ON question_votes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "allow authenticated answer votes" ON answer_votes;
DROP POLICY IF EXISTS "answer_votes_select" ON answer_votes;
DROP POLICY IF EXISTS "answer_votes_insert" ON answer_votes;
DROP POLICY IF EXISTS "answer_votes_update" ON answer_votes;
DROP POLICY IF EXISTS "answer_votes_delete" ON answer_votes;

CREATE POLICY "answer_votes_select"
ON answer_votes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "answer_votes_insert"
ON answer_votes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "answer_votes_update"
ON answer_votes FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "answer_votes_delete"
ON answer_votes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Score helpers (bypass RLS for aggregates)
CREATE OR REPLACE FUNCTION get_question_vote_score(question_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(vote), 0)::INTEGER FROM question_votes WHERE question_id = question_uuid;
$$;

CREATE OR REPLACE FUNCTION get_answer_vote_score(answer_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(vote), 0)::INTEGER FROM answer_votes WHERE answer_id = answer_uuid;
$$;

GRANT EXECUTE ON FUNCTION get_question_vote_score(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_answer_vote_score(UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- PART 2: Unify resolved state (is_resolved + resolved + resolved_at/by)
-- ---------------------------------------------------------------------------
ALTER TABLE questions ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS accepted_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL;

-- Sync legacy rows
UPDATE questions
SET
  resolved = COALESCE(resolved, false) OR COALESCE(is_resolved, false),
  is_resolved = COALESCE(is_resolved, false) OR COALESCE(resolved, false)
WHERE COALESCE(resolved, false) <> COALESCE(is_resolved, false)
   OR resolved IS NULL
   OR is_resolved IS NULL;

UPDATE questions
SET accepted_answer_id = (
  SELECT a.id FROM answers a
  WHERE a.question_id = questions.id AND a.is_accepted = true
  ORDER BY a.created_at ASC
  LIMIT 1
)
WHERE accepted_answer_id IS NULL
  AND EXISTS (SELECT 1 FROM answers a WHERE a.question_id = questions.id AND a.is_accepted = true);

CREATE OR REPLACE FUNCTION sync_question_resolved_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.resolved := COALESCE(NEW.resolved, false) OR COALESCE(NEW.is_resolved, false);
  NEW.is_resolved := NEW.resolved;
  IF NEW.resolved AND (OLD IS NULL OR NOT COALESCE(OLD.resolved, false) AND NOT COALESCE(OLD.is_resolved, false)) THEN
    IF NEW.resolved_at IS NULL THEN
      NEW.resolved_at := NOW();
    END IF;
  ELSIF NOT NEW.resolved THEN
    NEW.resolved_at := NULL;
    NEW.resolved_by := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_question_resolved ON questions;
CREATE TRIGGER trg_sync_question_resolved
  BEFORE INSERT OR UPDATE OF resolved, is_resolved ON questions
  FOR EACH ROW
  EXECUTE FUNCTION sync_question_resolved_columns();

-- ---------------------------------------------------------------------------
-- PART 3: RLS — admins on assigned courses; question authors accept answers
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own questions" ON questions;
CREATE POLICY "Users can update their own questions" ON questions
FOR UPDATE TO authenticated
USING (
  auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  OR (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
    AND EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = questions.course_id AND c.assigned_to = auth.uid()
    )
  )
  OR (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND EXISTS (SELECT 1 FROM profiles WHERE id = author_id AND role = 'student')
  )
);

DROP POLICY IF EXISTS "Users can update their own answers" ON answers;
CREATE POLICY "Users can update their own answers" ON answers
FOR UPDATE TO authenticated
USING (
  auth.uid() = author_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  OR (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'professor'))
    AND EXISTS (
      SELECT 1 FROM questions q
      JOIN courses c ON c.id = q.course_id
      WHERE q.id = answers.question_id AND c.assigned_to = auth.uid()
    )
  )
  OR (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND EXISTS (SELECT 1 FROM profiles WHERE id = author_id AND role = 'student')
  )
  OR EXISTS (
    SELECT 1 FROM questions q
    WHERE q.id = answers.question_id AND q.author_id = auth.uid()
  )
);

-- Accept answer: keep is_accepted in sync with questions.accepted_answer_id
-- Uses pg_trigger_depth() guard to prevent recursive trigger calls
CREATE OR REPLACE FUNCTION sync_accepted_answer_on_question()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guard against recursive trigger calls
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.is_accepted IS DISTINCT FROM OLD.is_accepted THEN
    IF NEW.is_accepted THEN
      -- Unaccept other answers for this question (pg_trigger_depth guard prevents re-entry)
      UPDATE answers SET is_accepted = false
      WHERE question_id = NEW.question_id AND id <> NEW.id AND is_accepted = true;

      -- Mark question as resolved with accepted answer
      UPDATE questions
      SET accepted_answer_id = NEW.id,
          resolved = true,
          is_resolved = true,
          resolved_at = COALESCE(resolved_at, NOW())
      WHERE id = NEW.question_id;
    ELSE
      -- Clear accepted answer reference from question
      UPDATE questions
      SET accepted_answer_id = NULL
      WHERE id = NEW.question_id AND accepted_answer_id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_accepted_answer ON answers;
CREATE TRIGGER trg_sync_accepted_answer
  AFTER UPDATE OF is_accepted ON answers
  FOR EACH ROW
  EXECUTE FUNCTION sync_accepted_answer_on_question();

-- ---------------------------------------------------------------------------
-- PART 4: Professor role (optional; maps content permissions like admin)
-- ---------------------------------------------------------------------------
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'admin', 'superadmin', 'professor'));

-- ---------------------------------------------------------------------------
-- PART 5: Storage — allow userId/questions|answers|replies subfolders
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'qa-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'qa-videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ---------------------------------------------------------------------------
-- PART 6: Notify assigned course admin when student posts a question
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_course_admin_new_question()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
  course_name TEXT;
  student_name TEXT;
BEGIN
  IF NEW.course_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT c.assigned_to, c.name INTO admin_id, course_name
  FROM courses c
  WHERE c.id = NEW.course_id;

  IF admin_id IS NULL OR admin_id = NEW.author_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(p.display_name, p.email, 'A student') INTO student_name
  FROM profiles p
  WHERE p.id = NEW.author_id;

  INSERT INTO notifications (user_id, message, type, related_question_id)
  VALUES (
    admin_id,
    student_name || ' posted in ' || COALESCE(course_name, 'your course') || ': "' || LEFT(NEW.title, 80) || '"',
    'new_question',
    NEW.id
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_question_created_notify_admin ON questions;
CREATE TRIGGER on_question_created_notify_admin
  AFTER INSERT ON questions
  FOR EACH ROW
  EXECUTE FUNCTION notify_course_admin_new_question();

-- ---------------------------------------------------------------------------
-- PART 7: Lectures
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  video_link TEXT,
  file_urls TEXT[] DEFAULT '{}',
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lectures_course_id ON lectures(course_id);
CREATE INDEX IF NOT EXISTS idx_lectures_created_by ON lectures(created_by);

ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lectures_select" ON lectures;
CREATE POLICY "lectures_select" ON lectures FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "lectures_write" ON lectures;
CREATE POLICY "lectures_write" ON lectures FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
  AND created_by = auth.uid()
);

-- ---------------------------------------------------------------------------
-- PART 8: Polls
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_polls_course_id ON polls(course_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "polls_select" ON polls;
CREATE POLICY "polls_select" ON polls FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "polls_write" ON polls;
CREATE POLICY "polls_write" ON polls FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
);

DROP POLICY IF EXISTS "poll_options_select" ON poll_options;
CREATE POLICY "poll_options_select" ON poll_options FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "poll_options_write" ON poll_options;
CREATE POLICY "poll_options_write" ON poll_options FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
);

DROP POLICY IF EXISTS "poll_votes_select" ON poll_votes;
CREATE POLICY "poll_votes_select" ON poll_votes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "poll_votes_insert" ON poll_votes;
CREATE POLICY "poll_votes_insert" ON poll_votes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "poll_votes_delete" ON poll_votes;
CREATE POLICY "poll_votes_delete" ON poll_votes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Realtime for notifications (idempotent)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN others THEN NULL;
END $$;
