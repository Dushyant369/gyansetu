"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function enrollInCourse(courseId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if already enrolled
  const { data: existing } = await supabase
    .from("student_courses")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .single()

  if (existing) {
    throw new Error("You are already enrolled in this course")
  }

  const { error } = await supabase.from("student_courses").insert({
    student_id: user.id,
    course_id: courseId,
  })

  if (error) {
    throw new Error(error.message || "Failed to enroll in course")
  }

  revalidatePath("/dashboard/courses")
  revalidatePath("/dashboard/questions")
}

export async function unenrollFromCourse(courseId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { error } = await supabase
    .from("student_courses")
    .delete()
    .eq("student_id", user.id)
    .eq("course_id", courseId)

  if (error) {
    throw new Error(error.message || "Failed to unenroll from course")
  }

  revalidatePath("/dashboard/courses")
  revalidatePath("/dashboard/questions")
}

