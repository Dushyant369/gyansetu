"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createAnswer(questionId: string, content: string, imageUrl?: string | null) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("Auth error:", authError)
    throw new Error("You must be signed in to post an answer")
  }

  // Validate input
  if (!content || !content.trim()) {
    throw new Error("Answer content is required")
  }

  if (!questionId) {
    throw new Error("Question ID is required")
  }

  // Check if user profile exists (required by RLS)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("Profile error:", profileError)
    throw new Error("User profile not found. Please complete your profile setup.")
  }

  // Check if user is the question author
  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("author_id, title")
    .eq("id", questionId)
    .single()

  if (questionError || !question) {
    console.error("Question error:", questionError)
    throw new Error("Question not found")
  }

  if (question.author_id === user.id) {
    throw new Error("You cannot answer your own question")
  }

  // Insert answer
  const { data, error } = await supabase
    .from("answers")
    .insert({
      question_id: questionId,
      author_id: user.id,
      content: content.trim(),
      upvoted_by: [],
      image_url: imageUrl || null,
    })
    .select()
    .single()

  if (error) {
    console.error("Answer insert error:", error)
    // Provide more specific error messages
    if (error.code === "42501") {
      throw new Error("Permission denied. Please check your account permissions.")
    } else if (error.code === "23503") {
      throw new Error("Invalid question or user reference.")
    } else if (error.code === "23505") {
      throw new Error("This answer already exists.")
    }
    throw new Error(error.message || "Failed to create answer. Please try again.")
  }

  if (!data) {
    throw new Error("Answer was not created. Please try again.")
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

export async function createReply(answerId: string, questionId: string, content: string, imageUrl?: string | null) {
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
      image_url: imageUrl || null,
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

  // Get answer author to notify them
  const { data: answer } = await supabase
    .from("answers")
    .select("author_id, question_id")
    .eq("id", answerId)
    .single()

  // Create notification for answer author (if not replying to own answer)
  if (answer && answer.author_id !== user.id) {
    const { data: question } = await supabase
      .from("questions")
      .select("title")
      .eq("id", answer.question_id)
      .single()

    await supabase.from("notifications").insert({
      user_id: answer.author_id,
      message: `Your answer received a new reply${question ? ` on "${question.title.substring(0, 30)}"` : ""}`,
      type: "reply",
      related_question_id: questionId,
      related_answer_id: answerId,
      metadata: { reply_id: data.id },
    })
  }

  revalidatePath(`/question/${questionId}`)

  return {
    id: data.id,
    content: data.content,
    author_id: data.author_id,
    created_at: data.created_at,
    image_url: data.image_url,
    profiles: data.profiles,
  }
}

export async function updateReply(replyId: string, questionId: string, content: string) {
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

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const userRole = profile?.role || "student"
  const isAdmin = userRole === "admin" || userRole === "superadmin"

  // Get reply to check author
  const { data: reply } = await supabase
    .from("replies")
    .select("author_id")
    .eq("id", replyId)
    .single()

  if (!reply) {
    throw new Error("Reply not found")
  }

  // Check if user can edit (own reply or admin/superadmin)
  if (!isAdmin && reply.author_id !== user.id) {
    throw new Error("You can only edit your own replies")
  }

  const { data, error } = await supabase
    .from("replies")
    .update({
      content: content.trim(),
    })
    .eq("id", replyId)
    .select(
      `
      *,
      profiles!author_id(display_name, email, role)
    `
    )
    .single()

  if (error || !data) {
    throw new Error(error?.message || "Failed to update reply")
  }

  revalidatePath(`/question/${questionId}`)

  return {
    id: data.id,
    content: data.content,
    author_id: data.author_id,
    created_at: data.created_at,
    image_url: data.image_url,
    profiles: data.profiles,
  }
}

export async function deleteReply(replyId: string, questionId: string) {
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

  // Get reply to check author
  const { data: reply } = await supabase
    .from("replies")
    .select("author_id, image_url")
    .eq("id", replyId)
    .single()

  if (!reply) {
    throw new Error("Reply not found")
  }

  // Check if user can delete (own reply or admin/superadmin)
  if (!isAdmin && reply.author_id !== user.id) {
    throw new Error("You can only delete your own replies")
  }

  // Delete image from storage if exists
  if (reply.image_url) {
    const imagePath = reply.image_url.split("/storage/v1/object/public/qa-images/")[1]
    if (imagePath) {
      await supabase.storage.from("qa-images").remove([imagePath])
    }
  }

  const { error } = await supabase.from("replies").delete().eq("id", replyId)

  if (error) {
    throw new Error(error.message || "Failed to delete reply")
  }

  revalidatePath(`/question/${questionId}`)

  return { success: true }
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

export async function markBestAnswer(answerId: string, questionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user role
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const userRole = userProfile?.role || "student"
  const isAdmin = userRole === "admin" || userRole === "superadmin"

  // Only admins, teachers, and superadmins can mark best answers
  if (!isAdmin && userRole !== "teacher") {
    throw new Error("Only admins, teachers, and superadmins can mark best answers")
  }

  // Get question to check current best answer
  const { data: question } = await supabase
    .from("questions")
    .select("best_answer_id")
    .eq("id", questionId)
    .single()

  if (!question) {
    throw new Error("Question not found")
  }

  // Get answer to check author
  const { data: answer } = await supabase
    .from("answers")
    .select("author_id")
    .eq("id", answerId)
    .single()

  if (!answer) {
    throw new Error("Answer not found")
  }

  // Check if answer author is a student (admins/superadmins cannot mark their own answers as best)
  const { data: answerAuthor } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", answer.author_id)
    .single()

  const answerAuthorRole = answerAuthor?.role || "student"
  if (answerAuthorRole !== "student") {
    throw new Error("Only student answers can be marked as best answer")
  }

  // Check if this answer is already the best answer
  const isAlreadyBest = question.best_answer_id === answerId

  // If unmarking, set to null
  if (isAlreadyBest) {
    // Remove karma when unmarking
    const { data: answerAuthorProfile } = await supabase
      .from("profiles")
      .select("karma_points")
      .eq("id", answer.author_id)
      .single()

    const newKarma = Math.max(0, (answerAuthorProfile?.karma_points || 0) - 10)

    await supabase
      .from("profiles")
      .update({ karma_points: newKarma })
      .eq("id", answer.author_id)

    await supabase.from("karma_log").insert({
      user_id: answer.author_id,
      change: -10,
      reason: "Best answer unmarked",
      related_answer_id: answerId,
      related_question_id: questionId,
    })

    const { error } = await supabase
      .from("questions")
      .update({ best_answer_id: null })
      .eq("id", questionId)

    if (error) {
      throw new Error(error.message || "Failed to unmark best answer")
    }

    revalidatePath(`/question/${questionId}`)
    return { isBestAnswer: false }
  }

  // If there's already a best answer, remove karma from previous best answer author
  if (question.best_answer_id) {
    const { data: previousBestAnswer } = await supabase
      .from("answers")
      .select("author_id")
      .eq("id", question.best_answer_id)
      .single()

    if (previousBestAnswer) {
      const { data: previousAuthorProfile } = await supabase
        .from("profiles")
        .select("karma_points")
        .eq("id", previousBestAnswer.author_id)
        .single()

      const newKarma = Math.max(0, (previousAuthorProfile?.karma_points || 0) - 10)

      await supabase
        .from("profiles")
        .update({ karma_points: newKarma })
        .eq("id", previousBestAnswer.author_id)

      await supabase.from("karma_log").insert({
        user_id: previousBestAnswer.author_id,
        change: -10,
        reason: "Best answer changed",
        related_answer_id: question.best_answer_id,
        related_question_id: questionId,
      })
    }
  }

  // Mark new best answer
  const { error } = await supabase
    .from("questions")
    .update({ best_answer_id: answerId })
    .eq("id", questionId)

  if (error) {
    throw new Error(error.message || "Failed to mark best answer")
  }

  // Award karma points (+10) to answer author
  const { data: answerAuthorProfile } = await supabase
    .from("profiles")
    .select("karma_points")
    .eq("id", answer.author_id)
    .single()

  const newKarma = (answerAuthorProfile?.karma_points || 0) + 10

  await supabase
    .from("profiles")
    .update({ karma_points: newKarma })
    .eq("id", answer.author_id)

  await supabase.from("karma_log").insert({
    user_id: answer.author_id,
    change: 10,
    reason: "Answer marked as best answer",
    related_answer_id: answerId,
    related_question_id: questionId,
  })

  // Create notification for answer author
  await supabase.from("notifications").insert({
    user_id: answer.author_id,
    message: `Your answer was marked as the best answer!`,
    type: "accepted",
    related_question_id: questionId,
    related_answer_id: answerId,
  })

  revalidatePath(`/question/${questionId}`)
  return { isBestAnswer: true }
}

export async function markAsResolved(questionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const userRole = profile?.role || "student"

  // Only admins and superadmins can mark as resolved
  if (userRole !== "admin" && userRole !== "superadmin") {
    throw new Error("Only admins and superadmins can mark questions as resolved")
  }

  // Get current resolved status
  const { data: question } = await supabase.from("questions").select("resolved").eq("id", questionId).single()

  if (!question) {
    throw new Error("Question not found")
  }

  const newResolvedStatus = !question.resolved

  // Get question details for notification
  const { data: questionDetails } = await supabase
    .from("questions")
    .select("author_id, title")
    .eq("id", questionId)
    .single()

  const { error } = await supabase.from("questions").update({ resolved: newResolvedStatus }).eq("id", questionId)

  if (error) {
    throw new Error(error.message || "Failed to update resolved status")
  }

  // Create notification for question author when marked as resolved
  if (newResolvedStatus && questionDetails && questionDetails.author_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: questionDetails.author_id,
      message: `Your question "${questionDetails.title.substring(0, 50)}" was marked as resolved!`,
      type: "resolved",
      related_question_id: questionId,
    })
  }

  revalidatePath(`/question/${questionId}`)
  return { resolved: newResolvedStatus }
}

