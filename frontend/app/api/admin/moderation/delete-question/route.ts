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

    // Delete all related data (cascades should handle most, but we'll be explicit)
    // Get all answer IDs first
    const { data: answers } = await supabase.from("answers").select("id").eq("question_id", question_id)
    const answerIds = answers?.map((a) => a.id) || []

    // Delete answer votes if there are answers
    if (answerIds.length > 0) {
      await supabase.from("answer_votes").delete().in("answer_id", answerIds)
    }

    // Delete question votes
    await supabase.from("question_votes").delete().eq("question_id", question_id)

    // Delete answers (this will cascade to replies)
    await supabase.from("answers").delete().eq("question_id", question_id)

    // Delete reports
    await supabase.from("moderation_reports").delete().eq("question_id", question_id)

    // Delete notifications
    await supabase.from("notifications").delete().eq("related_question_id", question_id)

    // Finally delete the question
    const { error } = await supabase.from("questions").delete().eq("id", question_id)

    if (error) {
      console.error("Error deleting question:", error)
      return NextResponse.json({ error: "Failed to delete question" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST /api/admin/moderation/delete-question:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

