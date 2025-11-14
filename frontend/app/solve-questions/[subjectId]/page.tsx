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

export default async function SubjectQuestionsPage({
  params,
}: {
  params: Promise<{ subjectId: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { subjectId } = await params

  // Fetch subject/course details
  const { data: subject, error: subjectError } = await supabase
    .from("courses")
    .select("id, name, code")
    .eq("id", subjectId)
    .single()

  if (subjectError || !subject) {
    redirect("/solve-questions?error=subject_not_found")
  }

  // Fetch questions for this subject
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
      profiles!author_id(display_name, email, role)
    `
    )
    .eq("course_id", subjectId)
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
          <Link href="/solve-questions">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Solve Questions
            </Button>
          </Link>

          {/* Page Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">
                {subject.name} - Questions
              </h1>
            </div>
            {subject.code && (
              <p className="text-muted-foreground">Course Code: {subject.code}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {questions?.length || 0} question{(questions?.length || 0) !== 1 ? "s" : ""} in this subject
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
                          <Badge variant="outline" className="bg-primary/10">
                            {subject.code || subject.name}
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
                          By: {(() => {
                            const profile = Array.isArray(question.profiles) ? question.profiles[0] : question.profiles
                            return (profile as any)?.display_name || (profile as any)?.email || "Anonymous"
                          })()}
                        </span>
                        {(() => {
                          const profile = Array.isArray(question.profiles) ? question.profiles[0] : question.profiles
                          return (profile as any)?.role && (profile as any).role !== "student" && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {(profile as any).role}
                              </Badge>
                            </>
                          )
                        })()}
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
              description={`There are no questions posted for ${subject.name} yet. Be the first to ask!`}
            />
          )}
        </div>
      </main>
    </div>
  )
}

