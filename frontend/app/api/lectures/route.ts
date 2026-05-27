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
    .select("id, title, description, subject, video_link, file_urls, course_id, created_by, created_at, updated_at, profiles!created_by(display_name, email)")
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

  const courseId = typeof body.course_id === "string" && body.course_id.trim() ? body.course_id.trim() : null

  // Course assignment check: professors/admins can only add lectures to courses assigned to them
  // (superadmins can add to any course)
  if (courseId && auth.role !== "superadmin") {
    const supabase = await createClient()
    const { data: course } = await supabase
      .from("courses")
      .select("assigned_to")
      .eq("id", courseId)
      .single()

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // For professor/admin: must be assigned to that course
    if (course.assigned_to !== auth.user!.id) {
      return NextResponse.json(
        { error: "You can only create lectures for courses assigned to you" },
        { status: 403 }
      )
    }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("lectures")
    .insert({
      title,
      description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
      subject: typeof body.subject === "string" && body.subject.trim() ? body.subject.trim() : null,
      video_link: typeof body.video_link === "string" && body.video_link.trim() ? body.video_link.trim() : null,
      file_urls: Array.isArray(body.file_urls) ? body.file_urls : [],
      course_id: courseId,
      created_by: auth.user!.id,
      updated_at: new Date().toISOString(),
    })
    .select("id, title, description, subject, video_link, file_urls, course_id, created_by, created_at, updated_at")
    .single()

  if (error) {
    console.error("POST /api/lectures:", error)
    return NextResponse.json({ error: error.message || "Failed to create lecture" }, { status: 500 })
  }

  return NextResponse.json({ lecture: data }, { status: 201 })
}
