-- ============================================
-- Voting System Migration
-- Adds upvote/downvote functionality for questions and answers
-- ============================================

-- Create question_votes table
CREATE TABLE IF NOT EXISTS question_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)), -- -1 = downvote, 1 = upvote
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_id, user_id)
);

-- Create answer_votes table
CREATE TABLE IF NOT EXISTS answer_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  answer_id UUID NOT NULL REFERENCES answers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)), -- -1 = downvote, 1 = upvote
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(answer_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_question_votes_question_id ON question_votes(question_id);
CREATE INDEX IF NOT EXISTS idx_question_votes_user_id ON question_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_answer_votes_answer_id ON answer_votes(answer_id);
CREATE INDEX IF NOT EXISTS idx_answer_votes_user_id ON answer_votes(user_id);

-- Enable RLS
ALTER TABLE question_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for question_votes
DROP POLICY IF EXISTS "allow authenticated question votes" ON question_votes;
CREATE POLICY "allow authenticated question votes"
ON question_votes FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for answer_votes
DROP POLICY IF EXISTS "allow authenticated answer votes" ON answer_votes;
CREATE POLICY "allow authenticated answer votes"
ON answer_votes FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create function to calculate question vote score
CREATE OR REPLACE FUNCTION get_question_vote_score(question_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(vote) FROM question_votes WHERE question_id = question_uuid),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate answer vote score
CREATE OR REPLACE FUNCTION get_answer_vote_score(answer_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(vote) FROM answer_votes WHERE answer_id = answer_uuid),
    0
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Migration complete
-- ============================================

