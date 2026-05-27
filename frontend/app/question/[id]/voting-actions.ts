"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

/**
 * Vote on a question
 * @param questionId - The question ID
 * @param voteValue - 1 for upvote, -1 for downvote
 */
export async function voteQuestion(questionId: string, voteValue: 1 | -1) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get current user profile
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const currentUserRole = currentProfile?.role || "student"

  // Get question with author info
  const { data: question } = await supabase
    .from("questions")
    .select("author_id, profiles!author_id(role)")
    .eq("id", questionId)
    .single()

  if (!question) {
    throw new Error("Question not found")
  }

  const questionAuthorRole = (question.profiles as any)?.role || "student"
  const isQuestionAuthor = question.author_id === user.id

  // Validation: Cannot vote on own question
  if (isQuestionAuthor) {
    throw new Error("You cannot vote on your own question")
  }

  // Check existing vote
  const { data: existingVote } = await supabase
    .from("question_votes")
    .select("vote")
    .eq("question_id", questionId)
    .eq("user_id", user.id)
    .maybeSingle()

  // If user already voted the same, remove vote
  if (existingVote && existingVote.vote === voteValue) {
    const { error } = await supabase
      .from("question_votes")
      .delete()
      .eq("question_id", questionId)
      .eq("user_id", user.id)

    if (error) {
      throw new Error(error.message || "Failed to remove vote")
    }

    // Update karma: remove previous vote effect
    const karmaChange = voteValue === 1 ? -2 : 2
    await updateQuestionAuthorKarma(question.author_id, karmaChange, questionId)

    revalidatePath(`/question/${questionId}`)
    return { vote: null, removed: true }
  }

  // Upsert vote
  const { error: upsertError } = await supabase
    .from("question_votes")
    .upsert(
      {
        question_id: questionId,
        user_id: user.id,
        vote: voteValue,
      },
      {
        onConflict: "question_id,user_id",
      }
    )

  if (upsertError) {
    throw new Error(upsertError.message || "Failed to vote")
  }

  // Update karma
  let karmaChange = voteValue
  if (existingVote) {
    // User changed their vote, adjust karma accordingly
    karmaChange = voteValue - existingVote.vote
  }
  const karmaPoints = karmaChange === 2 ? 2 : karmaChange === -2 ? -2 : voteValue === 1 ? 2 : -2
  await updateQuestionAuthorKarma(question.author_id, karmaPoints, questionId)

  revalidatePath(`/question/${questionId}`)
  return { vote: voteValue, removed: false }
}

/**
 * Vote on an answer
 * @param answerId - The answer ID
 * @param voteValue - 1 for upvote, -1 for downvote
 */
async function fetchAnswerVoteScore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  answerId: string
): Promise<number> {
  const { data: rpcScore, error: rpcError } = await supabase.rpc("get_answer_vote_score", {
    answer_uuid: answerId,
  })
  if (!rpcError && typeof rpcScore === "number") return rpcScore

  const { data: votes } = await supabase
    .from("answer_votes")
    .select("vote")
    .eq("answer_id", answerId)

  return votes?.reduce((sum, row) => sum + row.vote, 0) ?? 0
}

export async function voteAnswer(answerId: string, voteValue: 1 | -1) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be signed in to vote")
  }

  const { data: answer, error: answerError } = await supabase
    .from("answers")
    .select("author_id, question_id")
    .eq("id", answerId)
    .single()

  if (answerError || !answer) {
    console.error("voteAnswer answer lookup:", answerError)
    throw new Error("Answer not found")
  }

  if (answer.author_id === user.id) {
    throw new Error("You cannot vote on your own answer")
  }

  const { data: existingVote, error: existingError } = await supabase
    .from("answer_votes")
    .select("vote")
    .eq("answer_id", answerId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingError) {
    console.error("voteAnswer existing vote:", existingError)
    if (existingError.code === "42P01" || existingError.message?.includes("answer_votes")) {
      throw new Error(
        "Voting is not set up yet. Run backend/scripts/13-add-voting-system.sql or 24-fix-critical-bugs-and-features.sql in Supabase."
      )
    }
  }

  if (existingVote?.vote === voteValue) {
    const { error: deleteError } = await supabase
      .from("answer_votes")
      .delete()
      .eq("answer_id", answerId)
      .eq("user_id", user.id)

    if (deleteError) {
      throw new Error(deleteError.message || "Failed to remove vote")
    }

    void updateAnswerAuthorKarma(answer.author_id, voteValue === 1 ? -2 : 2, answerId)
    const score = await fetchAnswerVoteScore(supabase, answerId)
    revalidatePath(`/question/${answer.question_id}`)
    return { vote: null, removed: true, score }
  }

  const { error: upsertError } = await supabase.from("answer_votes").upsert(
    {
      answer_id: answerId,
      user_id: user.id,
      vote: voteValue,
    },
    { onConflict: "answer_id,user_id" }
  )

  if (upsertError) {
    console.error("voteAnswer upsert:", upsertError)
    if (upsertError.code === "42501") {
      throw new Error("You do not have permission to vote on this answer")
    }
    throw new Error(upsertError.message || "Failed to vote")
  }

  let karmaChange = voteValue
  if (existingVote) {
    karmaChange = voteValue - existingVote.vote
  }
  const karmaPoints = karmaChange === 2 ? 2 : karmaChange === -2 ? -2 : voteValue === 1 ? 2 : -2
  void updateAnswerAuthorKarma(answer.author_id, karmaPoints, answerId)

  const score = await fetchAnswerVoteScore(supabase, answerId)
  revalidatePath(`/question/${answer.question_id}`)
  return { vote: voteValue, removed: false, score }
}

/**
 * Get user's vote on a question
 */
export async function getUserQuestionVote(questionId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("question_votes")
    .select("vote")
    .eq("question_id", questionId)
    .eq("user_id", userId)
    .single()

  return data?.vote || null
}

/**
 * Get user's vote on an answer
 */
export async function getUserAnswerVote(answerId: string, userId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("answer_votes")
    .select("vote")
    .eq("answer_id", answerId)
    .eq("user_id", userId)
    .maybeSingle()

  return data?.vote ?? null
}

/**
 * Helper: Update question author karma
 */
async function updateQuestionAuthorKarma(authorId: string, change: number, questionId: string) {
  const supabase = await createClient()

  // Get current karma
  const { data: profile } = await supabase
    .from("profiles")
    .select("karma_points")
    .eq("id", authorId)
    .single()

  const newKarma = Math.max(0, (profile?.karma_points || 0) + change)

  // Update karma
  await supabase.from("profiles").update({ karma_points: newKarma }).eq("id", authorId)

  // Log karma change
  await supabase.from("karma_log").insert({
    user_id: authorId,
    change: change,
    reason: change > 0 ? "Question upvoted" : "Question downvoted",
    related_question_id: questionId,
  })
}

/**
 * Helper: Update answer author karma
 */
async function updateAnswerAuthorKarma(authorId: string, change: number, answerId: string) {
  try {
    const supabase = await createClient()

    const { data: profile } = await supabase
      .from("profiles")
      .select("karma_points")
      .eq("id", authorId)
      .single()

    const newKarma = Math.max(0, (profile?.karma_points || 0) + change)
    await supabase.from("profiles").update({ karma_points: newKarma }).eq("id", authorId)

    const { data: answer } = await supabase
      .from("answers")
      .select("question_id")
      .eq("id", answerId)
      .single()

    await supabase.from("karma_log").insert({
      user_id: authorId,
      change: change,
      reason: change > 0 ? "Answer upvoted" : "Answer downvoted",
      related_answer_id: answerId,
      related_question_id: answer?.question_id || null,
    })
  } catch {
    // Karma must not block voting
  }
}

