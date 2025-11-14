"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function updateQuestion(questionId: string, title: string, content: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (!title.trim() || !content.trim()) {
    throw new Error("Title and content are required")
  }

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const userRole = profile?.role || "student"
  const isAdmin = userRole === "admin" || userRole === "superadmin"

  // Get question to check author
  const { data: question } = await supabase
    .from("questions")
    .select("author_id")
    .eq("id", questionId)
    .single()

  if (!question) {
    throw new Error("Question not found")
  }

  // Check if user can edit (own question or admin/superadmin)
  if (!isAdmin && question.author_id !== user.id) {
    throw new Error("You can only edit your own questions")
  }

  const { error } = await supabase
    .from("questions")
    .update({
      title: title.trim(),
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionId)

  if (error) {
    throw new Error(error.message || "Failed to update question")
  }

  revalidatePath(`/question/${questionId}`)
  revalidatePath("/dashboard/questions")
  return { success: true }
}

export async function deleteQuestion(questionId: string) {
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

  // Get question to check author
  const { data: question } = await supabase
    .from("questions")
    .select("author_id, image_url")
    .eq("id", questionId)
    .single()

  if (!question) {
    throw new Error("Question not found")
  }

  // Check if user can delete (own question or admin/superadmin)
  // SuperAdmin can delete any question, Admin can delete student questions only
  if (!isAdmin && question.author_id !== user.id) {
    throw new Error("You can only delete your own questions")
  }

  // If admin, check if they can delete this question
  if (isAdmin && userRole !== "superadmin" && question.author_id !== user.id) {
    // Admin can only delete student questions
    const { data: questionAuthor } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", question.author_id)
      .single()

    const authorRole = questionAuthor?.role || "student"
    if (authorRole === "admin" || authorRole === "superadmin") {
      throw new Error("Admins cannot delete other admin/superadmin questions")
    }
  }

  // Delete image from storage if exists
  if (question.image_url) {
    const imagePath = question.image_url.split("/storage/v1/object/public/qa-images/")[1]
    if (imagePath) {
      await supabase.storage.from("qa-images").remove([imagePath])
    }
  }

  const { error } = await supabase.from("questions").delete().eq("id", questionId)

  if (error) {
    throw new Error(error.message || "Failed to delete question")
  }

  revalidatePath("/dashboard/questions")
  revalidatePath("/question/[id]", "page")
  return { success: true }
}

export async function updateAnswer(answerId: string, questionId: string, content: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (!content.trim()) {
    throw new Error("Answer content is required")
  }

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const userRole = profile?.role || "student"
  const isAdmin = userRole === "admin" || userRole === "superadmin"

  // Get answer to check author
  const { data: answer } = await supabase
    .from("answers")
    .select("author_id")
    .eq("id", answerId)
    .single()

  if (!answer) {
    throw new Error("Answer not found")
  }

  // Check if user can edit (own answer or admin/superadmin)
  // SuperAdmin can edit any answer, Admin can edit student answers only
  if (!isAdmin && answer.author_id !== user.id) {
    throw new Error("You can only edit your own answers")
  }

  // If admin, check if they can edit this answer
  if (isAdmin && userRole !== "superadmin" && answer.author_id !== user.id) {
    // Admin can only edit student answers
    const { data: answerAuthor } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", answer.author_id)
      .single()

    const authorRole = answerAuthor?.role || "student"
    if (authorRole === "admin" || authorRole === "superadmin") {
      throw new Error("Admins cannot edit other admin/superadmin answers")
    }
  }

  const { error } = await supabase
    .from("answers")
    .update({
      content: content.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", answerId)

  if (error) {
    throw new Error(error.message || "Failed to update answer")
  }

  revalidatePath(`/question/${questionId}`)
  return { success: true }
}

export async function deleteAnswer(answerId: string, questionId: string) {
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

  // Get answer to check author
  const { data: answer } = await supabase
    .from("answers")
    .select("author_id, image_url")
    .eq("id", answerId)
    .single()

  if (!answer) {
    throw new Error("Answer not found")
  }

  // Check if user can delete (own answer or admin/superadmin)
  // SuperAdmin can delete any answer, Admin can delete student answers only
  if (!isAdmin && answer.author_id !== user.id) {
    throw new Error("You can only delete your own answers")
  }

  // If admin, check if they can delete this answer
  if (isAdmin && userRole !== "superadmin" && answer.author_id !== user.id) {
    // Admin can only delete student answers
    const { data: answerAuthor } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", answer.author_id)
      .single()

    const authorRole = answerAuthor?.role || "student"
    if (authorRole === "admin" || authorRole === "superadmin") {
      throw new Error("Admins cannot delete other admin/superadmin answers")
    }
  }

  // Delete image from storage if exists
  if (answer.image_url) {
    const imagePath = answer.image_url.split("/storage/v1/object/public/qa-images/")[1]
    if (imagePath) {
      await supabase.storage.from("qa-images").remove([imagePath])
    }
  }

  const { error } = await supabase.from("answers").delete().eq("id", answerId)

  if (error) {
    throw new Error(error.message || "Failed to delete answer")
  }

  revalidatePath(`/question/${questionId}`)
  return { success: true }
}

