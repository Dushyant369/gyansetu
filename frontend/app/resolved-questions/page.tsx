import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, BookOpen, ArrowLeft } from "lucide-react"
import { formatRelativeTime } from "@/lib/date"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"

export default async function ResolvedQuestionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch resolved questions (where best_answer_id IS NOT NULL)
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select(
      `
      id,
      title,
      content,
      best_answer_id,
      course_id,
      created_at,
      views,
      courses(id, name, code),
      profiles!author_id(display_name, email)
    `
    )
    .not("best_answer_id", "is", null)
    .order("created_at", { ascending: false })

  if (questionsError) {
    console.error("Error fetching resolved questions:", questionsError)
  }

  // Group questions by subject
  const grouped: Record<string, typeof questions> = {}

  questions?.forEach((q) => {
    const course = Array.isArray(q.courses) ? q.courses[0] : q.courses
    const key = (course as any)?.name || "Other"
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(q)
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* Back Button */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Page Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h1 className="text-3xl font-bold text-foreground">Resolved Questions</h1>
            </div>
            <p className="text-muted-foreground">
              View all questions that have been marked as resolved with a best answer.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Total: {questions?.length || 0} resolved question{(questions?.length || 0) !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Grouped Questions */}
          {questions && questions.length > 0 ? (
            <div className="space-y-8">
              {Object.keys(grouped).map((subject) => (
                <div key={subject} className="space-y-4">
                  <div className="flex items-center gap-2">
                    {subject === "Other" ? (
                      <BookOpen className="w-5 h-5 text-primary" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-primary" />
                    )}
                    <h2 className="text-2xl font-semibold text-foreground">{subject}</h2>
                    <Badge variant="secondary" className="ml-2">
                      {grouped[subject]?.length || 0}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {grouped[subject]?.map((question) => (
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
                                <Badge className="bg-green-600/20 text-green-700 dark:text-green-400">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Resolved
                                </Badge>
                                {(() => {
                                  const course = Array.isArray(question.courses) ? question.courses[0] : question.courses
                                  return course && (
                                    <Badge variant="outline" className="bg-primary/10">
                                      {(course as any)?.code || (course as any)?.name}
                                    </Badge>
                                  )
                                })()}
                              </div>
                            </div>
                            {question.content && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {question.content}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                By: {(() => {
                                  const profile = Array.isArray(question.profiles) ? question.profiles[0] : question.profiles
                                  return (profile as any)?.display_name || (profile as any)?.email || "Anonymous"
                                })()}
                              </span>
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
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<CheckCircle2 className="w-12 h-12 text-muted-foreground" />}
              title="No resolved questions yet"
              description="There are no questions marked as resolved yet. Questions are marked as resolved when a teacher or admin selects a best answer."
            />
          )}
        </div>
      </main>
    </div>
  )
}

