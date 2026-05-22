import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/require-user"
import { requireAdmin } from "@/lib/auth/require-admin"
import { createEventSchema } from "@/lib/events/validation"
import { EVENT_SELECT, mapEventRow } from "@/lib/events/map-event"
import { NextResponse } from "next/server"

export async function GET() {
  const auth = await requireUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .gte("starts_at", now)
    .order("pinned", { ascending: false })
    .order("starts_at", { ascending: true })

  if (error) {
    console.error("GET /api/events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }

  const events = (data ?? []).map((row) => mapEventRow(row as Record<string, unknown>))
  return NextResponse.json({ events })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = createEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const payload = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("events")
    .insert({
      title: payload.title,
      description: payload.description,
      category: payload.category,
      starts_at: new Date(payload.starts_at).toISOString(),
      venue: payload.venue,
      image_url: payload.image_url ?? null,
      organizer: payload.organizer,
      pinned: payload.pinned ?? false,
      created_by: auth.user!.id,
      updated_at: new Date().toISOString(),
    })
    .select(EVENT_SELECT)
    .single()

  if (error) {
    console.error("POST /api/events:", error)
    return NextResponse.json({ error: error.message || "Failed to create event" }, { status: 500 })
  }

  return NextResponse.json({ event: mapEventRow(data as Record<string, unknown>) }, { status: 201 })
}
