import { SUPERADMIN_EMAIL, normalizeAuthEmail } from "./constants"

export function getLoginErrorMessage(errorMessage: string, email: string): string {
  const lower = errorMessage.toLowerCase()
  const normalized = normalizeAuthEmail(email)

  if (lower.includes("invalid login credentials") || lower.includes("invalid credentials")) {
    const parts = [
      "Sign-in failed. Common causes:",
      "• Wrong password",
      "• Account not created yet — use Sign up first",
      "• Email not confirmed — open the confirmation link from your inbox before logging in",
    ]
    if (normalized === SUPERADMIN_EMAIL) {
      parts.push(
        "• SuperAdmin: in Supabase Dashboard → Authentication → Users, add this user with Auto Confirm enabled, then run backend/scripts/11-set-superadmin-manually.sql"
      )
    }
    return parts.join("\n")
  }

  if (lower.includes("email not confirmed")) {
    return "Please confirm your email using the link we sent you, then try signing in again."
  }

  return errorMessage
}

export function getSignUpErrorMessage(errorMessage: string): string {
  const lower = errorMessage.toLowerCase()

  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "This email is already registered. Sign in instead, or use Forgot password on the login page if you do not remember your password."
  }

  return errorMessage
}
