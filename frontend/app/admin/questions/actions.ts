"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function deleteQuestion(questionId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin or superadmin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const userRole = profile?.role || "student"
  const isAdmin = userRole === "admin" || userRole === "superadmin"

  if (!isAdmin) {
    throw new Error("Only admins can delete questions")
  }

  // Verify the question belongs to a course assigned to this admin
  const { data: question } = await supabase
    .from("questions")
    .select("course_id")
    .eq("id", questionId)
    .single()

  if (!question) {
    throw new Error("Question not found")
  }

  // SuperAdmin can delete any question, regular admins can only delete from assigned courses
  if (userRole !== "superadmin" && question.course_id) {
    const { data: course } = await supabase
      .from("courses")
      .select("assigned_to")
      .eq("id", question.course_id)
      .single()

    if (!course || course.assigned_to !== user.id) {
      throw new Error("You can only delete questions from courses assigned to you")
    }
  }
  // If question has no course, any admin can delete it

  const { error } = await supabase.from("questions").delete().eq("id", questionId)

  if (error) {
    throw new Error(error.message || "Failed to delete question")
  }

  revalidatePath("/admin/assigned-courses")
  revalidatePath("/dashboard/questions")
}

export async function markQuestionResolved(questionId: string, resolved: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin or superadmin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const userRole = profile?.role || "student"
  const isAdmin = userRole === "admin" || userRole === "superadmin"

  if (!isAdmin) {
    throw new Error("Only admins can mark questions as resolved")
  }

  // Verify the question belongs to a course assigned to this admin (unless superadmin)
  const { data: question } = await supabase
    .from("questions")
    .select("course_id")
    .eq("id", questionId)
    .single()

  if (!question) {
    throw new Error("Question not found")
  }

  // SuperAdmin can manage any question, regular admins can only manage assigned courses
  if (userRole !== "superadmin" && question.course_id) {
    const { data: course } = await supabase
      .from("courses")
      .select("assigned_to")
      .eq("id", question.course_id)
      .single()

    if (!course || course.assigned_to !== user.id) {
      throw new Error("You can only manage questions from courses assigned to you")
    }
  }
  // If question has no course, any admin can manage it

  const { error } = await supabase
    .from("questions")
    .update({ is_resolved: resolved })
    .eq("id", questionId)

  if (error) {
    throw new Error(error.message || "Failed to update question")
  }

  revalidatePath("/admin/assigned-courses")
  revalidatePath("/dashboard/questions")
  revalidatePath(`/dashboard/questions/${questionId}`)
}

