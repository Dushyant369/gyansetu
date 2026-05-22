import { createClient } from "@/lib/supabase/server"
import type { User } from "@supabase/supabase-js"

export type AuthResult =
  | { user: User; error: null }
  | { user: null; error: { message: string; status: number } }

export async function requireUser(): Promise<AuthResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, error: { message: "Unauthorized", status: 401 } }
  }

  return { user, error: null }
}
