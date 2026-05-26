import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/require-user"
import { requireContentManager } from "@/lib/auth/require-content-manager"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const auth = await requireUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get("course_id")

  const supabase = await createClient()
  let query = supabase
    .from("lectures")
    .select("*, profiles!created_by(display_name, email)")
    .order("created_at", { ascending: false })

  if (courseId) {
    query = query.eq("course_id", courseId)
  }

  const { data, error } = await query

  if (error) {
    console.error("GET /api/lectures:", error)
    return NextResponse.json({ error: "Failed to fetch lectures" }, { status: 500 })
  }

  return NextResponse.json({ lectures: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireContentManager()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("lectures")
    .insert({
      title,
      description: typeof body.description === "string" ? body.description : null,
      subject: typeof body.subject === "string" ? body.subject : null,
      video_link: typeof body.video_link === "string" ? body.video_link : null,
      file_urls: Array.isArray(body.file_urls) ? body.file_urls : [],
      course_id: typeof body.course_id === "string" ? body.course_id : null,
      created_by: auth.user!.id,
      updated_at: new Date().toISOString(),
    })
    .select("*, profiles!created_by(display_name, email)")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ lecture: data }, { status: 201 })
}
