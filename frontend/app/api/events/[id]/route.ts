import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/require-user"
import { requireAdmin } from "@/lib/auth/require-admin"
import { updateEventSchema } from "@/lib/events/validation"
import { EVENT_SELECT, extractStoragePath, mapEventRow } from "@/lib/events/map-event"
import { NextResponse } from "next/server"

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const { id } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase.from("events").select(EVENT_SELECT).eq("id", id).single()

  if (error || !data) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 })
  }

  return NextResponse.json({ event: mapEventRow(data as Record<string, unknown>) })
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdmin()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const { id } = await context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = updateEventSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const payload = parsed.data
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const updateRow: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (payload.title !== undefined) updateRow.title = payload.title
  if (payload.description !== undefined) updateRow.description = payload.description
  if (payload.category !== undefined) updateRow.category = payload.category
  if (payload.starts_at !== undefined) updateRow.starts_at = new Date(payload.starts_at).toISOString()
  if (payload.venue !== undefined) updateRow.venue = payload.venue
  if (payload.image_url !== undefined) updateRow.image_url = payload.image_url
  if (payload.organizer !== undefined) updateRow.organizer = payload.organizer
  if (payload.pinned !== undefined) updateRow.pinned = payload.pinned

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("events")
    .update(updateRow)
    .eq("id", id)
    .select(EVENT_SELECT)
    .single()

  if (error || !data) {
    console.error("PUT /api/events/[id]:", error)
    return NextResponse.json({ error: error?.message || "Failed to update event" }, { status: 500 })
  }

  return NextResponse.json({ event: mapEventRow(data as Record<string, unknown>) })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const { id } = await context.params
  const supabase = await createClient()

  const { data: existing } = await supabase.from("events").select("image_url").eq("id", id).single()

  const { error } = await supabase.from("events").delete().eq("id", id)

  if (error) {
    console.error("DELETE /api/events/[id]:", error)
    return NextResponse.json({ error: error.message || "Failed to delete event" }, { status: 500 })
  }

  const imagePath = extractStoragePath(existing?.image_url)
  if (imagePath) {
    await supabase.storage.from("event-images").remove([imagePath])
  }

  return NextResponse.json({ success: true })
}
