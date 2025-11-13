import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import QuestionVoting from "@/components/question-voting"
import AnswerSection from "@/components/answer-section"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"

export default async function QuestionPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch question
  const { data: question } = await supabase
    .from("questions")
    .select(`
      *,
      profiles!author_id(id, display_name, karma_points)
    `)
    .eq("id", params.id)
    .single()

  if (!question) {
    redirect("/dashboard/questions")
  }

  // Fetch answers
  const { data: answers } = await supabase
    .from("answers")
    .select(`
      *,
      profiles!author_id(id, display_name, karma_points)
    `)
    .eq("question_id", params.id)
    .order("is_accepted", { ascending: false })
    .order("upvotes", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/dashboard/questions" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">G</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">GyanSetu</h1>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Question */}
          <Card className="p-8">
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-3xl font-bold text-foreground">{question.title}</h1>
                  {question.is_resolved && (
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Resolved</Badge>
                  )}
                </div>

                <div className="flex gap-2 mb-6">
                  {question.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="prose prose-invert max-w-none text-foreground">{question.content}</div>

              <div className="flex justify-between items-center pt-6 border-t border-border">
                <div
                  className="text-sm text-muted-foreground"
                  title={formatAbsoluteTime(question.created_at)}
                >
                  <strong>{question.profiles?.display_name}</strong> • {question.views} views •{" "}
                  {formatRelativeTime(question.created_at)}
                </div>
                <QuestionVoting questionId={question.id} userId={user.id} />
              </div>
            </div>
          </Card>

          {/* Answers */}
          {answers && answers.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">
                {answers.length} Answer{answers.length !== 1 ? "s" : ""}
              </h2>
              {answers.map((answer: any) => (
                <Card key={answer.id} className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-foreground whitespace-pre-wrap">{answer.content}</p>
                      </div>
                      {answer.is_accepted && (
                        <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Accepted</Badge>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <div
                        className="text-sm text-muted-foreground"
                        title={formatAbsoluteTime(answer.created_at)}
                      >
                        <strong>{answer.profiles?.display_name}</strong> • {formatRelativeTime(answer.created_at)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Answer Form */}
          <AnswerSection questionId={question.id} userId={user.id} />
        </div>
      </main>
    </div>
  )
}
