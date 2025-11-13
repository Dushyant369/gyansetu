-- Add is_anonymous field to questions table
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_questions_is_anonymous ON questions(is_anonymous);

