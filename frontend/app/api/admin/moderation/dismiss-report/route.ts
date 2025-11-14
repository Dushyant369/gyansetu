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
    const { report_id } = body

    if (!report_id) {
      return NextResponse.json({ error: "report_id is required" }, { status: 400 })
    }

    // Delete the report
    const { error } = await supabase.from("moderation_reports").delete().eq("id", report_id)

    if (error) {
      console.error("Error dismissing report:", error)
      return NextResponse.json({ error: "Failed to dismiss report" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in POST /api/admin/moderation/dismiss-report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

