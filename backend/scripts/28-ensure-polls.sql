-- ============================================
-- Script 28: Ensure polls tables + RLS (idempotent)
-- Run if Classroom Polls fail to load or create
-- ============================================

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
DROP POLICY IF EXISTS "polls_write" ON polls;
DROP POLICY IF EXISTS "polls_insert" ON polls;
DROP POLICY IF EXISTS "polls_update" ON polls;
DROP POLICY IF EXISTS "polls_delete" ON polls;

CREATE POLICY "polls_select"
ON polls FOR SELECT TO authenticated
USING (true);

CREATE POLICY "polls_insert"
ON polls FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
  AND created_by = auth.uid()
);

CREATE POLICY "polls_update"
ON polls FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
);

CREATE POLICY "polls_delete"
ON polls FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
);

DROP POLICY IF EXISTS "poll_options_select" ON poll_options;
DROP POLICY IF EXISTS "poll_options_write" ON poll_options;
DROP POLICY IF EXISTS "poll_options_insert" ON poll_options;
DROP POLICY IF EXISTS "poll_options_update" ON poll_options;
DROP POLICY IF EXISTS "poll_options_delete" ON poll_options;

CREATE POLICY "poll_options_select"
ON poll_options FOR SELECT TO authenticated
USING (true);

CREATE POLICY "poll_options_insert"
ON poll_options FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
);

CREATE POLICY "poll_options_update"
ON poll_options FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
);

CREATE POLICY "poll_options_delete"
ON poll_options FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor'))
);

DROP POLICY IF EXISTS "poll_votes_select" ON poll_votes;
DROP POLICY IF EXISTS "poll_votes_insert" ON poll_votes;
DROP POLICY IF EXISTS "poll_votes_delete" ON poll_votes;

CREATE POLICY "poll_votes_select"
ON poll_votes FOR SELECT TO authenticated
USING (true);

CREATE POLICY "poll_votes_insert"
ON poll_votes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "poll_votes_delete"
ON poll_votes FOR DELETE TO authenticated
USING (auth.uid() = user_id);
