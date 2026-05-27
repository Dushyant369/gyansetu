-- ============================================
-- Script 30: Permanent fix for resolved questions
-- Run in Supabase SQL editor if mark-resolved does not persist or list is empty
-- ============================================

-- Ensure all resolved columns exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS best_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS accepted_answer_id UUID REFERENCES answers(id) ON DELETE SET NULL;

-- Sync legacy rows
UPDATE questions SET
  resolved = COALESCE(resolved, false) OR COALESCE(is_resolved, false),
  is_resolved = COALESCE(is_resolved, false) OR COALESCE(resolved, false)
WHERE COALESCE(resolved, false) <> COALESCE(is_resolved, false)
   OR resolved IS NULL
   OR is_resolved IS NULL;

CREATE INDEX IF NOT EXISTS idx_questions_is_resolved ON questions(is_resolved) WHERE is_resolved = true;
CREATE INDEX IF NOT EXISTS idx_questions_resolved ON questions(resolved) WHERE resolved = true;

-- RPC: mark resolved (bypasses author-only RLS)
CREATE OR REPLACE FUNCTION mark_question_resolved(p_question_id UUID, p_resolved BOOLEAN DEFAULT TRUE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  IF v_role NOT IN ('admin', 'superadmin', 'professor') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins and professors can mark questions as resolved');
  END IF;

  UPDATE questions SET
    resolved = p_resolved,
    is_resolved = p_resolved,
    resolved_at = CASE WHEN p_resolved THEN COALESCE(resolved_at, NOW()) ELSE NULL END,
    resolved_by = CASE WHEN p_resolved THEN auth.uid() ELSE NULL END
  WHERE id = p_question_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Question not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'resolved', p_resolved);
END;
$$;

GRANT EXECUTE ON FUNCTION mark_question_resolved(UUID, BOOLEAN) TO authenticated;

-- RPC: fetch resolved questions (bypasses any read quirks)
CREATE OR REPLACE FUNCTION get_resolved_questions()
RETURNS SETOF questions
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT *
  FROM questions
  WHERE is_resolved = true
     OR resolved = true
     OR best_answer_id IS NOT NULL
     OR accepted_answer_id IS NOT NULL
  ORDER BY COALESCE(resolved_at, created_at) DESC;
$$;

GRANT EXECUTE ON FUNCTION get_resolved_questions() TO authenticated;

-- Allow admins/professors to update questions (mark resolved, best answer, etc.)
DROP POLICY IF EXISTS "admin_superadmin_update_questions" ON questions;
CREATE POLICY "admin_superadmin_update_questions" ON questions
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin', 'professor')
  )
);

-- Keep resolved columns in sync on write
CREATE OR REPLACE FUNCTION sync_question_resolved_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.resolved := COALESCE(NEW.resolved, false) OR COALESCE(NEW.is_resolved, false);
  NEW.is_resolved := NEW.resolved;
  IF NEW.resolved AND (OLD IS NULL OR (NOT COALESCE(OLD.resolved, false) AND NOT COALESCE(OLD.is_resolved, false))) THEN
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
