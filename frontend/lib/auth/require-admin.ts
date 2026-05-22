import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

export type AdminAuthResult =
  | { user: User; role: string; error: null }
  | { user: null; role: null; error: { message: string; status: number } }

export async function requireAdmin(): Promise<AdminAuthResult> {
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

  if (role !== "admin" && role !== "superadmin") {
    return { user: null, role: null, error: { message: "Forbidden", status: 403 } }
  }

  return { user, role, error: null }
}
