import type { SupabaseClient } from "@supabase/supabase-js"

/** Aggregate answer vote scores; uses RPC when available, else sums vote rows. */
export async function getAnswerVoteScores(
  supabase: SupabaseClient,
  answerIds: string[]
): Promise<Record<string, number>> {
  const scores: Record<string, number> = {}
  if (answerIds.length === 0) return scores

  const rpcResults = await Promise.all(
    answerIds.map(async (id) => {
      const { data, error } = await supabase.rpc("get_answer_vote_score", { answer_uuid: id })
      if (error) return { id, score: null as number | null }
      return { id, score: typeof data === "number" ? data : 0 }
    })
  )

  const missingRpc = rpcResults.some((r) => r.score === null)
  if (!missingRpc) {
    rpcResults.forEach((r) => {
      scores[r.id] = r.score ?? 0
    })
    return scores
  }

  const { data: votes } = await supabase
    .from("answer_votes")
    .select("answer_id, vote")
    .in("answer_id", answerIds)

  answerIds.forEach((id) => {
    scores[id] = 0
  })
  votes?.forEach((v) => {
    const aid = v.answer_id as string
    scores[aid] = (scores[aid] ?? 0) + (v.vote as number)
  })

  return scores
}

export async function getQuestionVoteScore(
  supabase: SupabaseClient,
  questionId: string
): Promise<number> {
  const { data, error } = await supabase.rpc("get_question_vote_score", {
    question_uuid: questionId,
  })
  if (!error && typeof data === "number") return data

  const { data: votes } = await supabase
    .from("question_votes")
    .select("vote")
    .eq("question_id", questionId)

  return votes?.reduce((sum, v) => sum + v.vote, 0) ?? 0
}
