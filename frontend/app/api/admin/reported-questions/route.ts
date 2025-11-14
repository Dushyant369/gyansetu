import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
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

    // Fetch all questions that have at least one report
    const { data: reports, error: reportsError } = await supabase
      .from("moderation_reports")
      .select(
        `
        id,
        reason,
        created_at,
        reporter_id,
        question_id,
        profiles!reporter_id(display_name, email)
      `
      )
      .not("question_id", "is", null)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (reportsError) {
      console.error("Error fetching reports:", reportsError)
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 })
    }

    // Get unique question IDs
    const questionIds = [...new Set(reports?.map((r) => r.question_id).filter(Boolean) || [])]

    if (questionIds.length === 0) {
      return NextResponse.json({ questions: [] })
    }

    // Fetch questions with course and author info
    const { data: questions, error: questionsError } = await supabase
      .from("questions")
      .select(
        `
        id,
        title,
        content,
        course_id,
        author_id,
        created_at,
        is_resolved,
        courses(id, name, code),
        profiles!author_id(display_name, email)
      `
      )
      .in("id", questionIds)

    if (questionsError) {
      console.error("Error fetching questions:", questionsError)
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
    }

    // Group reports by question_id and attach to questions
    const questionsWithReports = (questions || []).map((question: any) => {
      const questionReports = (reports || [])
        .filter((r) => r.question_id === question.id)
        .map((report: any) => ({
          report_id: report.id,
          reason: report.reason,
          reported_by: {
            name: (report.profiles as any)?.display_name || null,
            email: (report.profiles as any)?.email || null,
          },
          reported_at: report.created_at,
        }))
        .sort((a, b) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime())

      // Get latest report date for sorting
      const latestReportDate = questionReports.length > 0 ? questionReports[0].reported_at : question.created_at

      // Handle courses (can be array or object due to Supabase type inference)
      const courseData = Array.isArray(question.courses) ? question.courses[0] : question.courses
      const profileData = Array.isArray(question.profiles) ? question.profiles[0] : question.profiles

      return {
        id: question.id,
        title: question.title,
        description: question.content,
        course_id: question.course_id,
        course: courseData
          ? {
              name: courseData.name || null,
              code: courseData.code || null,
            }
          : null,
        author: {
          name: profileData?.display_name || null,
          email: profileData?.email || null,
        },
        created_at: question.created_at,
        is_resolved: question.is_resolved || false,
        reports: questionReports,
        latest_report_at: latestReportDate,
      }
    })

    // Sort by latest report date
    questionsWithReports.sort((a, b) => {
      const dateA = new Date(a.latest_report_at).getTime()
      const dateB = new Date(b.latest_report_at).getTime()
      return dateB - dateA
    })

    return NextResponse.json({ questions: questionsWithReports })
  } catch (error) {
    console.error("Error in GET /api/admin/reported-questions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

