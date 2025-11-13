"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createAnswer(questionId: string, content: string, imageUrl?: string | null) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is the question author
  const { data: question } = await supabase
    .from("questions")
    .select("author_id, title")
    .eq("id", questionId)
    .single()

  if (!question) {
    throw new Error("Question not found")
  }

  if (question.author_id === user.id) {
    throw new Error("You cannot answer your own question")
  }

  const { data, error } = await supabase
    .from("answers")
    .insert({
      question_id: questionId,
      author_id: user.id,
      content,
      upvoted_by: [],
      image_url: imageUrl || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message || "Failed to create answer")
  }

  // Create notification for question author
  if (question.author_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: question.author_id,
      message: `Your question "${question.title.substring(0, 50)}" received a new answer`,
      type: "answer",
      related_question_id: questionId,
      related_answer_id: data.id,
    })
  }

  revalidatePath(`/question/${questionId}`)
  return data
}

export async function createReply(answerId: string, questionId: string, content: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (!content.trim()) {
    throw new Error("Reply content is required")
  }

  const { data, error } = await supabase
    .from("replies")
    .insert({
      answer_id: answerId,
      author_id: user.id,
      content: content.trim(),
    })
    .select(
      `
      *,
      profiles!author_id(display_name, email, role)
    `
    )
    .single()

  if (error || !data) {
    throw new Error(error?.message || "Failed to post reply")
  }

  revalidatePath(`/question/${questionId}`)

  return {
    id: data.id,
    content: data.content,
    author_id: data.author_id,
    created_at: data.created_at,
    profiles: data.profiles,
  }
}

export async function toggleAnswerUpvote(answerId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user role
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const currentUserRole = currentProfile?.role || "student"
  const isCurrentUserStudent = currentUserRole === "student"

  // Get current answer with author role
  const { data: answer, error: fetchError } = await supabase
    .from("answers")
    .select("upvoted_by, author_id, profiles!author_id(role)")
    .eq("id", answerId)
    .single()

  if (fetchError || !answer) {
    throw new Error("Answer not found")
  }

  // Check if answer author is admin/superadmin
  const answerAuthorRole = (answer.profiles as any)?.role || "student"
  const isAnswerAuthorAdmin = answerAuthorRole === "admin" || answerAuthorRole === "superadmin"

  // Students cannot upvote admin/superadmin answers
  if (isCurrentUserStudent && isAnswerAuthorAdmin) {
    throw new Error("Students cannot upvote admin answers")
  }

  const upvotedBy = (answer.upvoted_by || []) as string[]
  const isUpvoted = upvotedBy.includes(user.id)

  let newUpvotedBy: string[]
  let karmaChange = 0

  if (isUpvoted) {
    // Remove upvote
    newUpvotedBy = upvotedBy.filter((id) => id !== user.id)
    karmaChange = -10
  } else {
    // Add upvote
    newUpvotedBy = [...upvotedBy, user.id]
    karmaChange = 10
  }

  // Update answer
  const { error: updateError } = await supabase
    .from("answers")
    .update({
      upvoted_by: newUpvotedBy,
      upvotes: newUpvotedBy.length,
    })
    .eq("id", answerId)

  if (updateError) {
    throw new Error(updateError.message || "Failed to update upvote")
  }

  // Update karma if upvoting (not removing)
  if (!isUpvoted && answer.author_id !== user.id) {
    // Get current karma
    const { data: profile } = await supabase
      .from("profiles")
      .select("karma_points")
      .eq("id", answer.author_id)
      .single()

    const newKarma = (profile?.karma_points || 0) + karmaChange

    // Update karma
    await supabase
      .from("profiles")
      .update({ karma_points: newKarma })
      .eq("id", answer.author_id)

    // Log karma change
    await supabase.from("karma_log").insert({
      user_id: answer.author_id,
      change: karmaChange,
      reason: "Answer upvoted",
      related_answer_id: answerId,
    })

    // Create notification for answer author
    const { data: answerData } = await supabase
      .from("answers")
      .select("question_id")
      .eq("id", answerId)
      .single()

    if (answerData) {
      await supabase.from("notifications").insert({
        user_id: answer.author_id,
        message: `Your answer received an upvote`,
        type: "upvote",
        related_question_id: answerData.question_id,
        related_answer_id: answerId,
      })
    }
  } else if (isUpvoted && answer.author_id !== user.id) {
    // Remove karma when upvote is removed
    const { data: profile } = await supabase
      .from("profiles")
      .select("karma_points")
      .eq("id", answer.author_id)
      .single()

    const newKarma = Math.max(0, (profile?.karma_points || 0) + karmaChange)

    await supabase
      .from("profiles")
      .update({ karma_points: newKarma })
      .eq("id", answer.author_id)

    await supabase.from("karma_log").insert({
      user_id: answer.author_id,
      change: karmaChange,
      reason: "Answer upvote removed",
      related_answer_id: answerId,
    })
  }

  revalidatePath(`/question/${answerId}`)
  return { isUpvoted: !isUpvoted, upvoteCount: newUpvotedBy.length }
}

export async function acceptAnswer(answerId: string, questionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const userRole = profile?.role || "student"
  const isAdmin = userRole === "admin" || userRole === "superadmin"

  // Verify user is the question author OR is admin/superadmin
  const { data: question } = await supabase
    .from("questions")
    .select("author_id")
    .eq("id", questionId)
    .single()

  if (!question) {
    throw new Error("Question not found")
  }

  if (!isAdmin && question.author_id !== user.id) {
    throw new Error("Only the question author or admins can accept answers")
  }

  // Unaccept any previously accepted answer for this question
  await supabase
    .from("answers")
    .update({ is_accepted: false })
    .eq("question_id", questionId)
    .eq("is_accepted", true)

  // Get answer to check if already accepted
  const { data: answer } = await supabase
    .from("answers")
    .select("is_accepted, author_id")
    .eq("id", answerId)
    .single()

  if (!answer) {
    throw new Error("Answer not found")
  }

  const wasAccepted = answer.is_accepted
  const newAcceptedStatus = !wasAccepted

  // Update answer
  const { error } = await supabase
    .from("answers")
    .update({ is_accepted: newAcceptedStatus })
    .eq("id", answerId)

  if (error) {
    throw new Error(error.message || "Failed to accept answer")
  }

  // Update karma if accepting (not unaccepting)
  if (newAcceptedStatus && answer.author_id !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("karma_points")
      .eq("id", answer.author_id)
      .single()

    const newKarma = (profile?.karma_points || 0) + 20

    await supabase
      .from("profiles")
      .update({ karma_points: newKarma })
      .eq("id", answer.author_id)

    await supabase.from("karma_log").insert({
      user_id: answer.author_id,
      change: 20,
      reason: "Answer accepted",
      related_answer_id: answerId,
      related_question_id: questionId,
    })

    // Notification will be created by database trigger
  } else if (!newAcceptedStatus && answer.author_id !== user.id) {
    // Remove karma when unaccepting
    const { data: profile } = await supabase
      .from("profiles")
      .select("karma_points")
      .eq("id", answer.author_id)
      .single()

    const newKarma = Math.max(0, (profile?.karma_points || 0) - 20)

    await supabase
      .from("profiles")
      .update({ karma_points: newKarma })
      .eq("id", answer.author_id)

    await supabase.from("karma_log").insert({
      user_id: answer.author_id,
      change: -20,
      reason: "Answer unaccepted",
      related_answer_id: answerId,
      related_question_id: questionId,
    })
  }

  revalidatePath(`/question/${questionId}`)
  return { isAccepted: newAcceptedStatus }
}

