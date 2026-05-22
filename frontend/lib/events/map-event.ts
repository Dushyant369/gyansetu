import type { EventWithCreator } from "./types"

export function mapEventRow(row: Record<string, unknown>): EventWithCreator {
  const profiles = row.profiles as { display_name?: string | null; email?: string | null } | null
  const profile = Array.isArray(profiles) ? profiles[0] : profiles

  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    category: row.category as EventWithCreator["category"],
    starts_at: row.starts_at as string,
    venue: row.venue as string,
    image_url: (row.image_url as string | null) ?? null,
    organizer: row.organizer as string,
    pinned: Boolean(row.pinned),
    created_by: (row.created_by as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    created_by_name: profile?.display_name ?? null,
    created_by_email: profile?.email ?? null,
  }
}

export const EVENT_SELECT = `
  id,
  title,
  description,
  category,
  starts_at,
  venue,
  image_url,
  organizer,
  pinned,
  created_by,
  created_at,
  updated_at,
  profiles:created_by (display_name, email)
`

export function extractStoragePath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  const marker = "/storage/v1/object/public/event-images/"
  const idx = imageUrl.indexOf(marker)
  if (idx === -1) return null
  return imageUrl.slice(idx + marker.length)
}
