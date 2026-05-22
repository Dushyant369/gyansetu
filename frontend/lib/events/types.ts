export const EVENT_CATEGORIES = [
  "technical",
  "workshop",
  "seminar",
  "hackathon",
  "cultural",
  "socio_cultural",
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]

export interface Event {
  id: string
  title: string
  description: string
  category: EventCategory
  starts_at: string
  venue: string
  image_url: string | null
  organizer: string
  pinned: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface EventWithCreator extends Event {
  created_by_name: string | null
  created_by_email: string | null
}

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  technical: "Technical",
  workshop: "Workshop",
  seminar: "Seminar",
  hackathon: "Hackathon",
  cultural: "Cultural",
  socio_cultural: "Socio-cultural",
}
