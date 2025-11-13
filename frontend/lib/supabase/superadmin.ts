"use server"

import { createClient } from "@/lib/supabase/server"

/**
 * Ensures the SuperAdmin role is assigned to the specified email
 * This should be called on login/auth check
 */
export async function ensureSuperAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.email !== "icygenius08@gmail.com") {
    return
  }

  // Check current role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  // If not already superadmin, update it
  if (profile && profile.role !== "superadmin") {
    await supabase
      .from("profiles")
      .update({ role: "superadmin" })
      .eq("id", user.id)
  }
}

