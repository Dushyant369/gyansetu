import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { ReportedQuestions } from "@/components/admin/reported-questions"

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Content Moderation</h2>
            <p className="text-muted-foreground">Review and moderate reported questions</p>
          </div>

          <ReportedQuestions />
        </div>
      </main>
    </div>
  )
}

