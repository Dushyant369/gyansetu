/** Client-safe role helpers — do not import server Supabase here */

export const CONTENT_MANAGER_ROLES = ["admin", "superadmin", "professor"] as const

export type ContentManagerRole = (typeof CONTENT_MANAGER_ROLES)[number]

export function isContentManagerRole(role: string): boolean {
  return CONTENT_MANAGER_ROLES.includes(role as ContentManagerRole)
}
