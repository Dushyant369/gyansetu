-- ============================================
-- Script 29: Resolved questions RPC, reports RLS, poll creator vote block
-- Run on Supabase if mark-resolved or reports fail
-- ============================================

-- Resolved columns (idempotent)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

UPDATE questions SET
  resolved = COALESCE(resolved, false) OR COALESCE(is_resolved, false),
  is_resolved = COALESCE(is_resolved, false) OR COALESCE(resolved, false)
WHERE COALESCE(resolved, false) <> COALESCE(is_resolved, false)
   OR resolved IS NULL
   OR is_resolved IS NULL;

-- RPC: admins/professors can mark resolved regardless of author-only RLS
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

-- Admin/superadmin/professor can update questions (mark resolved, best answer, etc.)
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

-- Reports: superadmin + admin can view; users can report
ALTER TABLE moderation_reports ADD COLUMN IF NOT EXISTS reply_id UUID REFERENCES replies(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Admins can view all reports" ON moderation_reports;
DROP POLICY IF EXISTS "moderation_reports_select" ON moderation_reports;
CREATE POLICY "moderation_reports_select" ON moderation_reports
FOR SELECT TO authenticated
USING (
  reporter_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);

DROP POLICY IF EXISTS "Users can create reports" ON moderation_reports;
DROP POLICY IF EXISTS "moderation_reports_insert" ON moderation_reports;
CREATE POLICY "moderation_reports_insert" ON moderation_reports
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = reporter_id
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Only admins can update reports" ON moderation_reports;
DROP POLICY IF EXISTS "moderation_reports_update" ON moderation_reports;
CREATE POLICY "moderation_reports_update" ON moderation_reports
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
  )
);
