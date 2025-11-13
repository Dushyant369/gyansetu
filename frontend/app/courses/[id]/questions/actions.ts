"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createQuestion(
  courseId: string,
  title: string,
  content: string,
  tags: string[],
  isAnonymous: boolean,
  imageUrl?: string | null
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check user role - Admins/SuperAdmins cannot ask questions
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const userRole = profile?.role || "student"
  if (userRole === "admin" || userRole === "superadmin") {
    throw new Error("Admins cannot ask questions")
  }

  // Verify user is enrolled in the course
  const { data: enrollment } = await supabase
    .from("student_courses")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .single()

  if (!enrollment) {
    throw new Error("You must be enrolled in this course to ask questions")
  }

  const { data, error } = await supabase
    .from("questions")
    .insert({
      title,
      content: content || null,
      tags,
      is_anonymous: isAnonymous,
      author_id: user.id,
      course_id: courseId,
      image_url: imageUrl || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message || "Failed to create question")
  }

  revalidatePath(`/courses/${courseId}/questions`)
  return data
}

