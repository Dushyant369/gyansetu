import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookOpen, MessageSquare } from "lucide-react"
import { formatRelativeTime } from "@/lib/date"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"

export default async function EnrolledCourseQuestionsPage({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { courseId } = await params

  // Verify user is enrolled in this course
  const { data: enrollment } = await supabase
    .from("student_courses")
    .select("course_id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .single()

  if (!enrollment) {
    redirect("/enrolled-questions?error=not_enrolled")
  }

  // Fetch course details
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, name, code, description")
    .eq("id", courseId)
    .single()

  if (courseError || !course) {
    redirect("/enrolled-questions?error=course_not_found")
  }

  // Fetch questions for this course
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select(
      `
      id,
      title,
      content,
      created_at,
      views,
      is_resolved,
      best_answer_id,
      author_id,
      image_url,
      profiles!author_id(display_name, email, role)
    `
    )
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })

  if (questionsError) {
    console.error("Error fetching questions:", questionsError)
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* Back Button */}
          <Link href="/enrolled-questions">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Enrolled Courses
            </Button>
          </Link>

          {/* Page Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                {course.name} - Questions
              </h1>
            </div>
            {course.code && (
              <p className="text-muted-foreground">Course Code: {course.code}</p>
            )}
            {course.description && (
              <p className="text-sm text-muted-foreground mt-2">{course.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {questions?.length || 0} question{(questions?.length || 0) !== 1 ? "s" : ""} in this course
            </p>
          </div>

          {/* Questions List */}
          {questions && questions.length > 0 ? (
            <div className="space-y-4">
              {questions.map((question) => (
                <Link
                  key={question.id}
                  href={`/question/${question.id}`}
                  className="block group"
                >
                  <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-md border-border">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                          {question.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {question.is_resolved && (
                            <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                              Resolved
                            </Badge>
                          )}
                          {question.best_answer_id && (
                            <Badge className="bg-green-600/20 text-green-700 dark:text-green-400">
                              Best Answer
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-primary/10">
                            {course.code || course.name}
                          </Badge>
                        </div>
                      </div>
                      {question.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {question.content}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          By: {(question.profiles as any)?.display_name || (question.profiles as any)?.email || "Anonymous"}
                        </span>
                        {(question.profiles as any)?.role && (question.profiles as any).role !== "student" && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {(question.profiles as any).role}
                            </Badge>
                          </>
                        )}
                        <span>•</span>
                        <span>{question.views || 0} views</span>
                        <span>•</span>
                        <span>{formatRelativeTime(question.created_at)}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MessageSquare className="w-12 h-12 text-muted-foreground" />}
              title="No questions yet"
              description={`There are no questions posted for ${course.name} yet. Be the first to ask!`}
              action={
                <Link href="/dashboard/questions/new">
                  <Button>Ask a Question</Button>
                </Link>
              }
            />
          )}
        </div>
      </main>
    </div>
  )
}

