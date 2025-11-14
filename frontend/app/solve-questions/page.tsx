import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, MessageSquare, ArrowLeft } from "lucide-react"
import { SubjectsSearchPagination } from "@/components/solve-questions/subjects-search-pagination"
import { GeneralQuestionsSearchPagination } from "@/components/solve-questions/general-questions-search-pagination"

export default async function SolveQuestionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch all courses (subjects)
  const { data: subjects, error: subjectsError } = await supabase
    .from("courses")
    .select("id, name, code")
    .order("name")

  // Fetch general questions (no course assigned) - fetch all for client-side pagination
  const { data: generalQuestionsRaw, error: questionsError } = await supabase
    .from("questions")
    .select(
      `
      id,
      title,
      content,
      created_at,
      views,
      author_id,
      profiles!author_id(display_name, email)
    `
    )
    .is("course_id", null)
    .order("created_at", { ascending: false })

  // Transform data to handle Supabase type inference (profiles can be array or object)
  const generalQuestions = generalQuestionsRaw?.map((q: any) => ({
    ...q,
    profiles: Array.isArray(q.profiles) ? q.profiles[0] : q.profiles,
  })) || []

  if (subjectsError) {
    console.error("Error fetching subjects:", subjectsError)
  }
  if (questionsError) {
    console.error("Error fetching general questions:", questionsError)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Back Button */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Solve Questions</h1>
            <p className="text-muted-foreground">
              Browse and answer questions organized by subject, or help with general questions.
            </p>
          </div>

          {/* Subject-wise Questions Section */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Subject-wise Questions</h2>
              {subjects && subjects.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {subjects.length}
                </Badge>
              )}
            </div>
            {subjects && subjects.length > 0 ? (
              <SubjectsSearchPagination subjects={subjects} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>There are no courses/subjects set up yet.</p>
              </div>
            )}
          </section>

          {/* General Questions Section */}
          <section className="mt-12">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">General Questions</h2>
              {generalQuestions && generalQuestions.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {generalQuestions.length}
                </Badge>
              )}
            </div>
            {generalQuestions && generalQuestions.length > 0 ? (
              <GeneralQuestionsSearchPagination questions={generalQuestions} currentUserId={user.id} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>There are no general questions posted yet. Be the first to ask!</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

