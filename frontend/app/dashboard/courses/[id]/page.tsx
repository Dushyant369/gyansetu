import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"

export default async function CoursePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch course
  const { data: course } = await supabase.from("courses").select("*").eq("id", params.id).single()

  if (!course) {
    redirect("/dashboard/courses")
  }

  // Fetch questions for this course
  const { data: questions } = await supabase
    .from("questions")
    .select("*, profiles!author_id(display_name)")
    .eq("course_id", params.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">G</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">GyanSetu</h1>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Course Info */}
          <Card className="p-8 bg-card/50">
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{course.name}</h1>
                <p className="text-muted-foreground mt-2">{course.code}</p>
              </div>

              <p className="text-foreground">{course.description}</p>

              {course.semester && (
                <p className="text-sm text-muted-foreground">
                  Semester: <strong>{course.semester}</strong>
                </p>
              )}
            </div>
          </Card>

          {/* Questions */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Questions ({questions?.length || 0})</h2>

            {questions && questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question: any) => (
                  <Link key={question.id} href={`/dashboard/questions/${question.id}`}>
                    <Card className="p-6 hover:bg-card/80 transition-colors cursor-pointer">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                            {question.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{question.content}</p>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-border text-sm text-muted-foreground">
                          <span>{question.profiles?.display_name}</span>
                          <span title={formatAbsoluteTime(question.created_at)}>
                            {formatRelativeTime(question.created_at)}
                          </span>
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
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No questions for this course yet</p>
                <Link href="/dashboard/questions/new">
                  <Button>Ask First Question</Button>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
