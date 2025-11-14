"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createCourse(formData: FormData) {
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
    throw new Error("Only admins can create courses")
  }

  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const description = formData.get("description") as string
  const semester = formData.get("semester") as string | null
  const assignedTo = formData.get("assigned_to") as string | null

  if (!name || !code) {
    throw new Error("Name and code are required")
  }

  const { error } = await supabase.from("courses").insert({
    name,
    code,
    description: description || null,
    semester: semester || null,
    instructor_id: null,
    assigned_to: assignedTo || null,
  })

  if (error) {
    throw new Error(error.message || "Failed to create course")
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard/courses")
}

export async function updateCourse(courseId: string, formData: FormData) {
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
    throw new Error("Only admins can update courses")
  }

  const name = formData.get("name") as string
  const code = formData.get("code") as string
  const description = formData.get("description") as string
  const semester = formData.get("semester") as string | null
  const assignedTo = formData.get("assigned_to") as string | null

  if (!name || !code) {
    throw new Error("Name and code are required")
  }

  const { error } = await supabase
    .from("courses")
    .update({
      name,
      code,
      description: description || null,
      semester: semester || null,
      assigned_to: assignedTo || null,
    })
    .eq("id", courseId)

  if (error) {
    throw new Error(error.message || "Failed to update course")
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard/courses")
  revalidatePath(`/dashboard/courses/${courseId}`)
}

export async function deleteCourse(courseId: string) {
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
    throw new Error("Only admins can delete courses")
  }

  const { error } = await supabase.from("courses").delete().eq("id", courseId)

  if (error) {
    throw new Error(error.message || "Failed to delete course")
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard/courses")
}

