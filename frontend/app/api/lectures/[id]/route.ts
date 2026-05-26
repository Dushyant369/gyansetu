import { createClient } from "@/lib/supabase/server"
import { requireContentManager } from "@/lib/auth/require-content-manager"
import { NextResponse } from "next/server"

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireContentManager()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const { id } = await context.params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("lectures")
    .update({
      title: typeof body.title === "string" ? body.title.trim() : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      subject: typeof body.subject === "string" ? body.subject : undefined,
      video_link: typeof body.video_link === "string" ? body.video_link : undefined,
      file_urls: Array.isArray(body.file_urls) ? body.file_urls : undefined,
      course_id: typeof body.course_id === "string" ? body.course_id : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lecture: data })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireContentManager()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const { id } = await context.params
  const supabase = await createClient()
  const { error } = await supabase.from("lectures").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
