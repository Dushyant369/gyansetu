/** Normalize Supabase joined profile (object or single-element array). */
export function getProfileRole(profiles: unknown): string {
  if (!profiles) return "student"
  if (Array.isArray(profiles)) {
    const first = profiles[0] as { role?: string } | undefined
    return first?.role ?? "student"
  }
  return (profiles as { role?: string }).role ?? "student"
}
