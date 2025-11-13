"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function updateUserRole(userId: string, newRole: "student" | "admin" | "superadmin") {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check current user's role
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const currentUserRole = currentProfile?.role || "student"

  // Only superadmin or admin can update roles
  if (currentUserRole !== "superadmin" && currentUserRole !== "admin") {
    throw new Error("You don't have permission to perform this action.")
  }

  // Get target user's current role
  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", userId)
    .single()

  if (!targetProfile) {
    throw new Error("User not found")
  }

  const targetUserRole = targetProfile.role || "student"

  // Prevent changing own role
  if (user.id === userId) {
    throw new Error("You cannot change your own role")
  }

  // SuperAdmin restrictions: Cannot be modified by anyone
  if (targetUserRole === "superadmin") {
    throw new Error("SuperAdmin cannot be modified.")
  }

  // Admin restrictions: Only SuperAdmin can modify admins
  if (targetUserRole === "admin" && currentUserRole !== "superadmin") {
    throw new Error("You don't have permission to modify other admins.")
  }

  // Regular admins can only promote/demote students
  if (currentUserRole === "admin" && targetUserRole !== "student") {
    throw new Error("Admins can only modify student roles.")
  }

  // Prevent setting superadmin role (only database can do this)
  if (newRole === "superadmin" && targetProfile.email !== "icygenius08@gmail.com") {
    throw new Error("SuperAdmin role can only be assigned to the designated email.")
  }

  // Validate role value
  if (newRole !== "student" && newRole !== "admin" && newRole !== "superadmin") {
    throw new Error("Invalid role. Role must be 'student', 'admin', or 'superadmin'")
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)

  if (error) {
    throw new Error(error.message || "Failed to update user role")
  }

  revalidatePath("/admin")
  revalidatePath("/admin/users")
}

