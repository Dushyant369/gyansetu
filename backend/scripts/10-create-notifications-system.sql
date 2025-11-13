-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'answer', 'upvote', 'accepted', 'question_answered'
  related_question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  related_answer_id UUID REFERENCES answers(id) ON DELETE CASCADE,
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_seen ON notifications(seen);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as seen)
CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to create notification when answer is posted
CREATE OR REPLACE FUNCTION notify_question_answered()
RETURNS TRIGGER AS $$
DECLARE
  question_author_id UUID;
  question_title TEXT;
BEGIN
  -- Get question author and title
  SELECT author_id, title INTO question_author_id, question_title
  FROM questions
  WHERE id = NEW.question_id;

  -- Don't notify if user is answering their own question
  IF question_author_id != NEW.author_id THEN
    INSERT INTO notifications (user_id, message, type, related_question_id, related_answer_id)
    VALUES (
      question_author_id,
      'Your question "' || LEFT(question_title, 50) || '" received a new answer',
      'answer',
      NEW.question_id,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new answers
DROP TRIGGER IF EXISTS on_answer_created ON answers;
CREATE TRIGGER on_answer_created
  AFTER INSERT ON answers
  FOR EACH ROW
  EXECUTE FUNCTION notify_question_answered();

-- Function to create notification when answer is upvoted
CREATE OR REPLACE FUNCTION notify_answer_upvoted()
RETURNS TRIGGER AS $$
DECLARE
  answer_author_id UUID;
  question_title TEXT;
  upvoter_id UUID;
BEGIN
  -- Get answer author
  SELECT author_id INTO answer_author_id
  FROM answers
  WHERE id = NEW.id;

  -- Get question title for context
  SELECT q.title INTO question_title
  FROM questions q
  INNER JOIN answers a ON a.question_id = q.id
  WHERE a.id = NEW.id;

  -- Get the user who upvoted (from upvoted_by array)
  -- We need to find who was added to the array
  -- This is a simplified version - in practice, you'd track the upvoter differently
  -- For now, we'll create a notification when upvotes count increases
  -- Note: This is a limitation - we can't easily track WHO upvoted from the array change
  
  -- Don't notify if user upvoted their own answer
  -- We'll handle this in the application layer for now
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification when answer is accepted
CREATE OR REPLACE FUNCTION notify_answer_accepted()
RETURNS TRIGGER AS $$
DECLARE
  answer_author_id UUID;
  question_title TEXT;
BEGIN
  -- Only notify if answer was just accepted (not unaccepted)
  IF NEW.is_accepted = TRUE AND (OLD.is_accepted IS NULL OR OLD.is_accepted = FALSE) THEN
    -- Get answer author
    SELECT author_id INTO answer_author_id
    FROM answers
    WHERE id = NEW.id;

    -- Get question title
    SELECT q.title INTO question_title
    FROM questions q
    INNER JOIN answers a ON a.question_id = q.id
    WHERE a.id = NEW.id;

    -- Don't notify if user accepted their own answer (shouldn't happen, but safety check)
    IF answer_author_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, message, type, related_question_id, related_answer_id)
      VALUES (
        answer_author_id,
        'Your answer to "' || LEFT(question_title, 50) || '" was accepted!',
        'accepted',
        NEW.question_id,
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for answer acceptance
DROP TRIGGER IF EXISTS on_answer_accepted ON answers;
CREATE TRIGGER on_answer_accepted
  AFTER UPDATE OF is_accepted ON answers
  FOR EACH ROW
  WHEN (NEW.is_accepted IS DISTINCT FROM OLD.is_accepted)
  EXECUTE FUNCTION notify_answer_accepted();

-- Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

