import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { AnswerForm } from "@/components/question/answer-form"
import { AnswerList } from "@/components/question/answer-list"
import { EmptyState } from "@/components/ui/empty-state"
import { BackButton } from "@/components/ui/back-button"
import { MessageSquareReply } from "lucide-react"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: questionId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get question with author and course info
  const { data: question } = await supabase
    .from("questions")
    .select(
      `
      *,
      profiles!author_id(display_name, email),
      courses(id, name, code)
    `
    )
    .eq("id", questionId)
    .single()

  if (!question) {
    redirect("/courses")
  }

  // Increment view count
  await supabase
    .from("questions")
    .update({ views: (question.views || 0) + 1 })
    .eq("id", questionId)

  // Get current user profile for role
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const currentUserRole = currentProfile?.role || "student"

  // Get answers with author info including role
  const { data: answers } = await supabase
    .from("answers")
    .select(
      `
      *,
      profiles!author_id(display_name, email, karma_points, role),
      replies:replies(
        id,
        content,
        created_at,
        author_id,
        profiles!author_id(display_name, email, role)
      )
    `
    )
    .eq("question_id", questionId)
    .order("is_accepted", { ascending: false })
    .order("created_at", { ascending: true })

  const isQuestionAuthor = question.author_id === user.id
  const isCurrentUserAdmin = currentUserRole === "admin" || currentUserRole === "superadmin"

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="space-y-8">
          {/* Back Link */}
          {question.courses && (
            <Link
              href={`/courses/${question.courses.id}/questions`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to {question.courses.name}
            </Link>
          )}

          {/* Question Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <h1 className="text-2xl font-bold text-foreground">{question.title}</h1>
                {question.is_resolved && (
                  <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Resolved</Badge>
                )}
              </div>

              {question.content && (
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">{question.content}</p>
                </div>
              )}
              {question.image_url && (
                <div className="overflow-hidden rounded-lg border border-border bg-card/80">
                  <Image
                    src={question.image_url}
                    alt="Question attachment"
                    width={1200}
                    height={800}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {question.tags &&
                  question.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border text-sm text-muted-foreground">
                <div className="flex gap-4">
                  <span>{question.views || 0} views</span>
                  <span>{question.upvotes - question.downvotes} votes</span>
                  <span>{answers?.length || 0} answers</span>
                </div>
                <div title={formatAbsoluteTime(question.created_at)}>
                  {question.is_anonymous
                    ? "Anonymous"
                    : question.profiles?.display_name || question.profiles?.email}{" "}
                  • {formatRelativeTime(question.created_at)}
                </div>
              </div>
            </div>
          </Card>

          {/* Answers Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">
                {answers?.length || 0} Answer{(answers?.length || 0) !== 1 ? "s" : ""}
              </h2>
            </div>

            {/* Answer Form - Only show if user is not the question author */}
            {!isQuestionAuthor && <AnswerForm questionId={questionId} />}
            {isQuestionAuthor && (
              <Card className="p-6 bg-muted/50 border-border">
                <p className="text-muted-foreground text-center">
                  You cannot answer your own question. Wait for others to help!
                </p>
              </Card>
            )}

            {/* Answers List */}
            {answers && answers.length > 0 ? (
              <AnswerList
                answers={answers}
                isQuestionAuthor={isQuestionAuthor || isCurrentUserAdmin}
                currentUserId={user.id}
                currentUserRole={currentUserRole}
                questionId={questionId}
              />
            ) : (
              <EmptyState
                icon={<MessageSquareReply className="w-12 h-12 text-muted-foreground" />}
                title="No answers yet"
                description="Be the first to help by providing an answer!"
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

