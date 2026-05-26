export const SUPERADMIN_EMAIL = "icygenius08@gmail.com"

const studentPattern = /^[0-9]{9}@gkv\.ac\.in$/i
const teacherPattern = /^[a-zA-Z.]+@gkv\.ac\.in$/i

export function normalizeAuthEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function isAllowedAuthEmail(value: string): boolean {
  const normalized = normalizeAuthEmail(value)
  if (normalized === SUPERADMIN_EMAIL) {
    return true
  }
  return studentPattern.test(normalized) || teacherPattern.test(normalized)
}

export const INVALID_COLLEGE_EMAIL_MESSAGE =
  "Only GKV-registered email addresses are allowed. Please use your official college email."
