"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function markNotificationsAsSeen() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { error } = await supabase
    .from("notifications")
    .update({ seen: true })
    .eq("user_id", user.id)
    .eq("seen", false)

  if (error) {
    throw new Error(error.message || "Failed to mark notifications as seen")
  }

  revalidatePath("/notifications")
  revalidatePath("/dashboard")
}

export async function deleteNotification(notificationId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId)
    .eq("user_id", user.id)

  if (error) {
    throw new Error(error.message || "Failed to delete notification")
  }

  revalidatePath("/notifications")
}

