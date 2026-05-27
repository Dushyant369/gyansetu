import type { SupabaseClient } from "@supabase/supabase-js"

export type ResolvedQuestionRow = {
  id: string
  title: string
  content: string | null
  best_answer_id?: string | null
  accepted_answer_id?: string | null
  resolved?: boolean | null
  is_resolved?: boolean | null
  resolved_at?: string | null
  course_id?: string | null
  created_at: string
  views?: number | null
  courses?: unknown
  profiles?: unknown
}

/** True when any resolved signal is set in the DB row. */
export function isQuestionResolved(question: {
  resolved?: boolean | null
  is_resolved?: boolean | null
  best_answer_id?: string | null
  accepted_answer_id?: string | null
}): boolean {
  return Boolean(
    question.resolved === true ||
      question.is_resolved === true ||
      question.best_answer_id ||
      question.accepted_answer_id
  )
}

const RESOLVED_LIST_SELECT = `
  id,
  title,
  content,
  best_answer_id,
  resolved,
  is_resolved,
  course_id,
  created_at,
  views,
  courses(id, name, code),
  profiles!author_id(display_name, email)
`

function mergeResolvedRows(rows: ResolvedQuestionRow[] | null, map: Map<string, ResolvedQuestionRow>) {
  for (const row of rows ?? []) {
    if (isQuestionResolved(row)) {
      map.set(row.id, row)
    }
  }
}

function sortResolvedRows(rows: ResolvedQuestionRow[]): ResolvedQuestionRow[] {
  return [...rows].sort((a, b) => {
    const aTime = a.resolved_at ?? a.created_at
    const bTime = b.resolved_at ?? b.created_at
    return new Date(bTime).getTime() - new Date(aTime).getTime()
  })
}

/** Fetch resolved questions using multiple safe queries (no fragile .or() on missing columns). */
export async function fetchResolvedQuestions(supabase: SupabaseClient) {
  const merged = new Map<string, ResolvedQuestionRow>()
  const errors: string[] = []

  // Prefer SECURITY DEFINER RPC when migration 30 is applied
  const { data: rpcRows, error: rpcError } = await supabase.rpc("get_resolved_questions")
  if (!rpcError && Array.isArray(rpcRows) && rpcRows.length > 0) {
    const ids = (rpcRows as { id: string }[]).map((r) => r.id)
    const { data: fullRows, error: fullError } = await supabase
      .from("questions")
      .select(RESOLVED_LIST_SELECT)
      .in("id", ids)

    if (!fullError && fullRows?.length) {
      mergeResolvedRows(fullRows as ResolvedQuestionRow[], merged)
      return { data: sortResolvedRows(Array.from(merged.values())), error: null }
    }
  } else if (rpcError && rpcError.code !== "42883" && !rpcError.message?.includes("get_resolved_questions")) {
    errors.push(rpcError.message)
  }

  const tryQuery = async (
    label: string,
    run: () => Promise<{ data: ResolvedQuestionRow[] | null; error: { message: string } | null }>
  ) => {
    const { data, error } = await run()
    if (error) {
      errors.push(`${label}: ${error.message}`)
      return
    }
    mergeResolvedRows(data, merged)
  }

  // Core column from initial schema — always try first
  await tryQuery("is_resolved", async () => {
    const result = await supabase
      .from("questions")
      .select(RESOLVED_LIST_SELECT)
      .eq("is_resolved", true)
      .order("created_at", { ascending: false })
    return { data: result.data as ResolvedQuestionRow[] | null, error: result.error }
  })

  // Added in later migrations
  await tryQuery("resolved", async () => {
    const result = await supabase
      .from("questions")
      .select(RESOLVED_LIST_SELECT)
      .eq("resolved", true)
      .order("created_at", { ascending: false })
    return { data: result.data as ResolvedQuestionRow[] | null, error: result.error }
  })

  await tryQuery("best_answer_id", async () => {
    const result = await supabase
      .from("questions")
      .select(RESOLVED_LIST_SELECT)
      .not("best_answer_id", "is", null)
      .order("created_at", { ascending: false })
    return { data: result.data as ResolvedQuestionRow[] | null, error: result.error }
  })

  await tryQuery("accepted_answer_id", async () => {
    const result = await supabase
      .from("questions")
      .select(RESOLVED_LIST_SELECT)
      .not("accepted_answer_id", "is", null)
      .order("created_at", { ascending: false })
    return { data: result.data as ResolvedQuestionRow[] | null, error: result.error }
  })

  const data = sortResolvedRows(Array.from(merged.values()))
  if (data.length > 0) {
    return { data, error: null }
  }

  return {
    data: [],
    error: errors.length ? { message: errors.join("; ") } : null,
  }
}

export type MarkResolvedResult =
  | { success: true; resolved: boolean }
  | { success: false; error: string }

async function readResolvedFlags(
  supabase: SupabaseClient,
  questionId: string
): Promise<{ isResolved: boolean } | null> {
  const { data, error } = await supabase
    .from("questions")
    .select("resolved, is_resolved, best_answer_id")
    .eq("id", questionId)
    .maybeSingle()

  if (error || !data) return null
  return { isResolved: isQuestionResolved(data) }
}

/** Mark question resolved/unresolved; verifies persistence in DB. */
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
      const check = await readResolvedFlags(supabase, questionId)
      const persisted = resolved ? Boolean(check?.isResolved) : !check?.isResolved
      if (persisted) {
        return { success: true, resolved: Boolean(result.resolved ?? resolved) }
      }
      console.error("mark_question_resolved RPC succeeded but DB state mismatch", { questionId, check })
    } else if (result.error) {
      return { success: false, error: result.error }
    }
  }

  if (rpcError && rpcError.code !== "42883" && !rpcError.message?.includes("mark_question_resolved")) {
    console.error("mark_question_resolved RPC:", rpcError)
  }

  const now = new Date().toISOString()
  const tiers: Record<string, unknown>[] = resolved
    ? [
        { resolved: true, is_resolved: true, resolved_at: now, resolved_by: userId },
        { resolved: true, is_resolved: true },
        { is_resolved: true },
        { resolved: true },
      ]
    : [
        { resolved: false, is_resolved: false, resolved_at: null, resolved_by: null },
        { resolved: false, is_resolved: false },
        { is_resolved: false },
        { resolved: false },
      ]

  let lastError = "Failed to update resolved status"

  for (const payload of tiers) {
    const { data: updated, error } = await supabase
      .from("questions")
      .update(payload)
      .eq("id", questionId)
      .select("id, resolved, is_resolved")

    if (error) {
      lastError = error.message
      continue
    }

    if (!updated?.length) {
      lastError =
        "You do not have permission to update this question. Run backend/scripts/30-fix-resolved-questions.sql in Supabase."
      continue
    }

    const check = await readResolvedFlags(supabase, questionId)
    const persisted = resolved ? Boolean(check?.isResolved) : !check?.isResolved
    if (persisted) {
      return { success: true, resolved }
    }
  }

  return { success: false, error: lastError }
}

/** Filter for unresolved-only lists (browse / recent). */
export function isQuestionUnresolved(question: {
  resolved?: boolean | null
  is_resolved?: boolean | null
  best_answer_id?: string | null
  accepted_answer_id?: string | null
}): boolean {
  return !isQuestionResolved(question)
}
