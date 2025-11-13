import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { AskQuestionModal } from "@/components/courses/ask-question-modal"
import { EmptyState } from "@/components/ui/empty-state"
import { BackButton } from "@/components/ui/back-button"
import { MessageSquare } from "lucide-react"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"

export default async function CourseQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: courseId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get course details
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single()

  if (!course) {
    redirect("/courses")
  }

  // Get user role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const userRole = profile?.role || "student"
  const isStudent = userRole === "student"
  const isAdmin = userRole === "admin" || userRole === "superadmin"

  // Check if user is enrolled
  const { data: enrollment } = await supabase
    .from("student_courses")
    .select("id")
    .eq("student_id", user.id)
    .eq("course_id", courseId)
    .single()

  // Get questions for this course
  const { data: questions } = await supabase
    .from("questions")
    .select(
      `
      *,
      profiles!author_id(display_name, email)
    `
    )
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })

  // Get answer counts for each question
  const questionsWithCounts = await Promise.all(
    (questions || []).map(async (question: any) => {
      const { count } = await supabase
        .from("answers")
        .select("*", { count: "exact", head: true })
        .eq("question_id", question.id)
      return { ...question, answerCount: count || 0 }
    })
  )

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="space-y-8">
          {/* Course Header */}
          <div className="space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">{course.name}</h2>
              <p className="text-muted-foreground">{course.description || "No description available"}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{course.code}</Badge>
                {course.semester && <Badge variant="outline">{course.semester}</Badge>}
              </div>
            </div>
          </div>

          {/* Ask Question Section */}
          {enrollment && isStudent ? (
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-foreground">Questions</h3>
              <AskQuestionModal courseId={courseId} />
            </div>
          ) : enrollment && !isStudent ? (
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-foreground">Questions</h3>
              <p className="text-sm text-muted-foreground">Admins cannot ask questions</p>
            </div>
          ) : (
            <Card className="p-6 bg-muted/50">
              <p className="text-muted-foreground text-center">
                You must enroll in this course to ask questions.{" "}
                <Link href="/courses" className="text-primary hover:underline">
                  Enroll now
                </Link>
              </p>
            </Card>
          )}

          {/* Questions List */}
          {questionsWithCounts && questionsWithCounts.length > 0 ? (
            <div className="space-y-4">
              {questionsWithCounts.map((question: any) => (
                <Link key={question.id} href={`/question/${question.id}`}>
                  <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.01] hover:shadow-md border-border/50">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                            {question.title}
                          </h4>
                          {question.image_url && (
                            <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card/80">
                              <Image
                                src={question.image_url}
                                alt="Question attachment"
                                width={1200}
                                height={800}
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          )}
                          {question.content && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{question.content}</p>
                          )}
                        </div>
                        {question.is_resolved && (
                          <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Resolved</Badge>
                        )}
                      </div>

                          <div className="flex justify-between items-center pt-3 border-t border-border">
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{question.views || 0} views</span>
                          <span>{question.upvotes - question.downvotes} votes</span>
                          <span>{question.answerCount || 0} answers</span>
                        </div>
                            <div
                              className="text-xs text-muted-foreground"
                              title={formatAbsoluteTime(question.created_at)}
                            >
                          {question.is_anonymous
                            ? "Anonymous"
                            : question.profiles?.display_name || question.profiles?.email}{" "}
                              • {formatRelativeTime(question.created_at)}
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
              title={enrollment ? "No questions yet" : "No questions available"}
              description={
                enrollment
                  ? "Be the first to ask a question in this course!"
                  : "You must enroll in this course to see questions."
              }
              action={
                enrollment && isStudent ? (
                  <AskQuestionModal courseId={courseId} />
                ) : (
                  <Link href="/courses">
                    <Button>Browse Courses</Button>
                  </Link>
                )
              }
            />
          )}
        </div>
      </main>
    </div>
  )
}

