import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import { MessageSquare } from "lucide-react"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"

export default async function QuestionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to check if admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const userRole = profile?.role || "student"
  const isAdmin = userRole === "admin" || userRole === "superadmin"
  const isStudent = userRole === "student"

  // Fetch questions - admins see all, students see only from enrolled courses
  let questions

  if (isAdmin) {
    // Admins see all questions
    const { data } = await supabase
      .from("questions")
      .select("*, profiles!author_id(display_name, karma_points)")
      .order("created_at", { ascending: false })
      .limit(50)
    questions = data
  } else {
    // Students see only questions from enrolled courses or questions with no course
    const { data: enrollments } = await supabase
      .from("student_courses")
      .select("course_id")
      .eq("student_id", user.id)

    const enrolledCourseIds = (enrollments || []).map((e) => e.course_id)

    if (enrolledCourseIds.length > 0) {
      // Show questions from enrolled courses OR questions with no course
      const { data } = await supabase
        .from("questions")
        .select("*, profiles!author_id(display_name, karma_points)")
        .or(`course_id.in.(${enrolledCourseIds.join(",")}),course_id.is.null`)
        .order("created_at", { ascending: false })
        .limit(50)
      questions = data
    } else {
      // Student with no enrollments - only show questions with no course
      const { data } = await supabase
        .from("questions")
        .select("*, profiles!author_id(display_name, karma_points)")
        .is("course_id", null)
        .order("created_at", { ascending: false })
        .limit(50)
      questions = data
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">G</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">GyanSetu</h1>
            </Link>
            {isStudent && (
              <Link href="/dashboard/questions/new">
                <Button>Ask Question</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Questions</h2>
            <p className="text-muted-foreground">Browse and answer questions from the community</p>
          </div>

          {/* Questions List */}
          {questions && questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((question: any) => (
                <Link key={question.id} href={`/dashboard/questions/${question.id}`}>
                  <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-md border-border/50">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                            {question.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{question.content}</p>
                        </div>
                        {question.is_resolved && (
                          <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Resolved</Badge>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-border">
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{question.views} views</span>
                          <span>{question.upvotes - question.downvotes} votes</span>
                        </div>
                        <div
                          className="text-xs text-muted-foreground"
                          title={formatAbsoluteTime(question.created_at)}
                        >
                          {question.profiles?.display_name} • {formatRelativeTime(question.created_at)}
                        </div>
                      </div>

                      {question.tags && question.tags.length > 0 && (
                        <div className="flex gap-2 flex-wrap pt-2">
                          {question.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MessageSquare className="w-12 h-12 text-muted-foreground" />}
              title="No questions yet"
              description="Be the first to ask a question and start a discussion!"
              action={
                <Link href="/dashboard/questions/new">
                  <Button>Ask Question</Button>
                </Link>
              }
            />
          )}
        </div>
      </main>
    </div>
  )
}
