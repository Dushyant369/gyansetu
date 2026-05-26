import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

const CONTENT_MANAGER_ROLES = ["admin", "superadmin", "professor"] as const

export type ContentManagerAuthResult =
  | { user: User; role: string; error: null }
  | { user: null; role: null; error: { message: string; status: number } }

export async function requireContentManager(): Promise<ContentManagerAuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { user: null, role: null, error: { message: "Unauthorized", status: 401 } }
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const role = profile?.role ?? "student"

  if (!CONTENT_MANAGER_ROLES.includes(role as (typeof CONTENT_MANAGER_ROLES)[number])) {
    return { user: null, role: null, error: { message: "Forbidden", status: 403 } }
  }

  return { user, role, error: null }
}

export function isContentManagerRole(role: string): boolean {
  return CONTENT_MANAGER_ROLES.includes(role as (typeof CONTENT_MANAGER_ROLES)[number])
}
