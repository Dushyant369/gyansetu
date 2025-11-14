import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin or superadmin
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    const userRole = profile?.role || "student"
    if (userRole !== "admin" && userRole !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { question_id } = body

    if (!question_id) {
      return NextResponse.json({ error: "question_id is required" }, { status: 400 })
    }

    // Update question to resolved
    const { error } = await supabase.from("questions").update({ is_resolved: true }).eq("id", question_id)

    if (error) {
      console.error("Error resolving question:", error)
      return NextResponse.json({ error: "Failed to resolve question" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST /api/admin/moderation/resolve-question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

