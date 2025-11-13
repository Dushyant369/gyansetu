"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function updateProfile(data: { display_name?: string; bio?: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: data.display_name,
      bio: data.bio,
    })
    .eq("id", user.id)

  if (error) {
    throw new Error(error.message || "Failed to update profile")
  }

  revalidatePath("/dashboard/profile")
}

