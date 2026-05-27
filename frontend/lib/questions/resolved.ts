import type { SupabaseClient } from "@supabase/supabase-js"

export function isQuestionResolved(question: {
  resolved?: boolean | null
  is_resolved?: boolean | null
  best_answer_id?: string | null
}): boolean {
  return Boolean(question.resolved || question.is_resolved || question.best_answer_id)
}

const RESOLVED_SELECT = `
  id,
  title,
  content,
  best_answer_id,
  resolved,
  is_resolved,
  resolved_at,
  course_id,
  created_at,
  views,
  courses(id, name, code),
  profiles!author_id(display_name, email)
`

/** Fetch questions that are resolved (handles missing is_resolved column). */
export async function fetchResolvedQuestions(supabase: SupabaseClient) {
  const primary = await supabase
    .from("questions")
    .select(RESOLVED_SELECT)
    .or("resolved.eq.true,is_resolved.eq.true,best_answer_id.not.is.null")
    .order("resolved_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (!primary.error) {
    return { data: primary.data ?? [], error: null }
  }

  const msg = primary.error.message ?? ""
  if (!msg.includes("is_resolved") && !msg.includes("resolved_at")) {
    return { data: [], error: primary.error }
  }

  const fallback = await supabase
    .from("questions")
    .select(RESOLVED_SELECT)
    .or("resolved.eq.true,best_answer_id.not.is.null")
    .order("created_at", { ascending: false })

  return { data: fallback.data ?? [], error: fallback.error }
}

export type MarkResolvedResult =
  | { success: true; resolved: boolean }
  | { success: false; error: string }

/** Mark question resolved via RPC when available, else direct update. */
export async function markQuestionResolvedInDb(
  supabase: SupabaseClient,
  questionId: string,
  resolved: boolean,
  userId: string
): Promise<MarkResolvedResult> {
  const { data: rpcData, error: rpcError } = await supabase.rpc("mark_question_resolved", {
    p_question_id: questionId,
    p_resolved: resolved,
  })

  if (!rpcError && rpcData && typeof rpcData === "object") {
    const result = rpcData as { success?: boolean; error?: string; resolved?: boolean }
    if (result.success) {
      return { success: true, resolved: Boolean(result.resolved ?? resolved) }
    }
    if (result.error) {
      return { success: false, error: result.error }
    }
  }

  if (rpcError && rpcError.code !== "42883" && !rpcError.message?.includes("mark_question_resolved")) {
    console.error("mark_question_resolved RPC:", rpcError)
  }

  const now = new Date().toISOString()
  const updatePayload = resolved
    ? {
        resolved: true,
        is_resolved: true,
        resolved_at: now,
        resolved_by: userId,
      }
    : {
        resolved: false,
        is_resolved: false,
        resolved_at: null,
        resolved_by: null,
      }

  const { data: updated, error } = await supabase
    .from("questions")
    .update(updatePayload)
    .eq("id", questionId)
    .select("id, resolved, is_resolved")

  if (error) {
    return { success: false, error: error.message || "Failed to update resolved status" }
  }

  if (!updated?.length) {
    return {
      success: false,
      error:
        "You do not have permission to update this question. Run backend/scripts/29-fix-resolved-reports-polls.sql in Supabase.",
    }
  }

  return { success: true, resolved }
}
