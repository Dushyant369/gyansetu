-- Update answers table to support upvotes tracking and karma system
-- Change upvotes from INTEGER to UUID[] to track which users upvoted

-- Add upvoted_by array column
ALTER TABLE answers 
ADD COLUMN IF NOT EXISTS upvoted_by UUID[] DEFAULT '{}';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_answers_upvoted_by ON answers USING GIN(upvoted_by);

-- Create karma_log table to track karma history
CREATE TABLE IF NOT EXISTS karma_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  change INTEGER NOT NULL, -- positive for increase, negative for decrease
  reason TEXT NOT NULL, -- e.g., "Answer upvoted", "Answer accepted"
  related_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL,
  related_question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for karma_log
CREATE INDEX IF NOT EXISTS idx_karma_log_user_id ON karma_log(user_id);
CREATE INDEX IF NOT EXISTS idx_karma_log_created_at ON karma_log(created_at);

-- Enable Row Level Security
ALTER TABLE karma_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for karma_log
-- Users can view their own karma log
CREATE POLICY "Users can view their own karma log" ON karma_log
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all karma logs
CREATE POLICY "Admins can view all karma logs" ON karma_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

