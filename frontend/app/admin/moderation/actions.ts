"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

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

  if (profile?.role !== "admin" && profile?.role !== "superadmin") {
    throw new Error("Only admins can delete questions")
  }

  const { error } = await supabase.from("questions").delete().eq("id", questionId)

  if (error) {
    throw new Error(error.message || "Failed to delete question")
  }

  revalidatePath("/admin/moderation")
}

export async function deleteAnswer(answerId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    throw new Error("Only admins can delete answers")
  }

  const { error } = await supabase.from("answers").delete().eq("id", answerId)

  if (error) {
    throw new Error(error.message || "Failed to delete answer")
  }

  revalidatePath("/admin/moderation")
}

