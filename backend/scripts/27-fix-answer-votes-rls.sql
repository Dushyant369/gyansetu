-- ============================================
-- Script 27: Fix answer_votes RLS (idempotent)
-- Run if answer upvote/downvote fails or scores stay at 0
-- ============================================

CREATE TABLE IF NOT EXISTS answer_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(answer_id, user_id)
);

ALTER TABLE answer_votes ENABLE ROW LEVEL SECURITY;

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

CREATE OR REPLACE FUNCTION get_answer_vote_score(answer_uuid UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(vote), 0)::INTEGER FROM answer_votes WHERE answer_id = answer_uuid;
$$;

GRANT EXECUTE ON FUNCTION get_answer_vote_score(UUID) TO authenticated;
