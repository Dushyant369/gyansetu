import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { ModerationContent } from "@/components/admin/moderation-content"

export default async function ModerationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to check role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const userRole = profile?.role || "student"

  // Redirect non-admin and non-superadmin users to dashboard
  if (userRole !== "admin" && userRole !== "superadmin") {
    redirect("/dashboard?error=unauthorized&message=You don't have permission to access this page. Admin access required.")
  }

  // Get stats
  const [usersResult, coursesResult, questionsResult, answersResult, topUsersResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact" }),
    supabase.from("courses").select("id", { count: "exact" }),
    supabase.from("questions").select("id", { count: "exact" }),
    supabase.from("answers").select("id", { count: "exact" }),
    supabase
      .from("profiles")
      .select("id, display_name, email, karma_points")
      .order("karma_points", { ascending: false })
      .limit(5),
  ])

  const stats = {
    totalUsers: usersResult.count || 0,
    totalCourses: coursesResult.count || 0,
    totalQuestions: questionsResult.count || 0,
    totalAnswers: answersResult.count || 0,
    topUsers: topUsersResult.data || [],
  }

  // Get all courses for filter
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, code")
    .order("name", { ascending: true })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Content Moderation</h2>
            <p className="text-muted-foreground">Manage questions, answers, and platform content</p>
          </div>

          <ModerationContent stats={stats} courses={courses || []} />
        </div>
      </main>
    </div>
  )
}

