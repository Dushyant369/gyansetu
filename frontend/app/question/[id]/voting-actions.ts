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
    .single()

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
export async function voteAnswer(answerId: string, voteValue: 1 | -1) {
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
  const isCurrentUserStudent = currentUserRole === "student"
  const isCurrentUserAdmin = currentUserRole === "admin" || currentUserRole === "superadmin"

  // Get answer with author info
  const { data: answer } = await supabase
    .from("answers")
    .select("author_id, question_id, profiles!author_id(role)")
    .eq("id", answerId)
    .single()

  if (!answer) {
    throw new Error("Answer not found")
  }

  const answerAuthorRole = (answer.profiles as any)?.role || "student"
  const isAnswerAuthorAdmin = answerAuthorRole === "admin" || answerAuthorRole === "superadmin"
  const isAnswerAuthor = answer.author_id === user.id

  // Validation: Cannot vote on own answer
  if (isAnswerAuthor) {
    throw new Error("You cannot vote on your own answer")
  }

  // Role-based validation: Students cannot vote on admin/superadmin answers
  if (isCurrentUserStudent && isAnswerAuthorAdmin) {
    throw new Error("Students cannot vote on admin/superadmin answers")
  }

  // Admins/SuperAdmins cannot vote on other admin/superadmin answers
  if (isCurrentUserAdmin && isAnswerAuthorAdmin) {
    throw new Error("Admins cannot vote on other admin/superadmin answers")
  }

  // Check existing vote
  const { data: existingVote } = await supabase
    .from("answer_votes")
    .select("vote")
    .eq("answer_id", answerId)
    .eq("user_id", user.id)
    .single()

  // If user already voted the same, remove vote
  if (existingVote && existingVote.vote === voteValue) {
    const { error } = await supabase
      .from("answer_votes")
      .delete()
      .eq("answer_id", answerId)
      .eq("user_id", user.id)

    if (error) {
      throw new Error(error.message || "Failed to remove vote")
    }

    // Update karma: remove previous vote effect
    const karmaChange = voteValue === 1 ? -2 : 2
    await updateAnswerAuthorKarma(answer.author_id, karmaChange, answerId)

    revalidatePath(`/question/${answer.question_id}`)
    return { vote: null, removed: true }
  }

  // Upsert vote
  const { error: upsertError } = await supabase
    .from("answer_votes")
    .upsert(
      {
        answer_id: answerId,
        user_id: user.id,
        vote: voteValue,
      },
      {
        onConflict: "answer_id,user_id",
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
  await updateAnswerAuthorKarma(answer.author_id, karmaPoints, answerId)

  revalidatePath(`/question/${answer.question_id}`)
  return { vote: voteValue, removed: false }
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
    .single()

  return data?.vote || null
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

  // Get question_id for karma log
  const { data: answer } = await supabase
    .from("answers")
    .select("question_id")
    .eq("id", answerId)
    .single()

  // Log karma change
  await supabase.from("karma_log").insert({
    user_id: authorId,
    change: change,
    reason: change > 0 ? "Answer upvoted" : "Answer downvoted",
    related_answer_id: answerId,
    related_question_id: answer?.question_id || null,
  })
}

