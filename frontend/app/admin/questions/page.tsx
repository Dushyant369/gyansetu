import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { QuestionsListClient } from "@/components/question/questions-list-client"
import { EmptyState } from "@/components/ui/empty-state"
import { MessageSquare } from "lucide-react"

export default async function AdminQuestionsPage() {
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

  // Redirect non-admin and non-superadmin users
  if (userRole !== "admin" && userRole !== "superadmin") {
    redirect("/dashboard")
  }

  // Fetch all questions grouped by course
  const { data: questions } = await supabase
    .from("questions")
    .select(
      `
      *,
      profiles!author_id(display_name, email, role),
      courses(id, name, code)
    `
    )
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader showAdminLink={true} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Manage Questions</h2>
            <p className="text-muted-foreground">
              View, manage, and answer questions from all courses. Questions are grouped by course.
            </p>
          </div>

          {/* Questions List */}
          {questions && questions.length > 0 ? (
            <QuestionsListClient
              questions={questions}
              currentUserId={user.id}
              currentUserRole={userRole}
              questionsPerPage={10}
            />
          ) : (
            <EmptyState
              icon={<MessageSquare className="w-12 h-12 text-muted-foreground" />}
              title="No questions yet"
              description="No questions have been posted yet."
            />
          )}
        </div>
      </main>
    </div>
  )
}

