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
import { QuestionVoting } from "@/components/question/question-voting"
import { ReportButton } from "@/components/question/report-button"
import { QuestionActions } from "@/components/question/question-actions"
import { MarkResolvedButton } from "@/components/question/mark-resolved-button"

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

  // Get question with author and course info, including vote score
  const { data: question } = await supabase
    .from("questions")
    .select(
      `
      *,
      profiles!author_id(display_name, email, role),
      courses(id, name, code)
    `
    )
    .eq("id", questionId)
    .single()

  // Ensure resolved field exists (fallback to is_resolved for backward compatibility)
  if (question && question.resolved === undefined && question.is_resolved !== undefined) {
    question.resolved = question.is_resolved
  }

  const bestAnswerId = question?.best_answer_id || null

  // Calculate question vote score
  const { data: questionVotes } = await supabase
    .from("question_votes")
    .select("vote")
    .eq("question_id", questionId)

  const questionScore = questionVotes?.reduce((sum, v) => sum + v.vote, 0) || 0

  // Get user's vote on this question
  const { data: userQuestionVote } = await supabase
    .from("question_votes")
    .select("vote")
    .eq("question_id", questionId)
    .eq("user_id", user.id)
    .single()

  const userVote = userQuestionVote?.vote || null

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
        image_url,
        profiles!author_id(display_name, email, role)
      )
    `
    )
    .eq("question_id", questionId)
    .order("is_accepted", { ascending: false })
    .order("created_at", { ascending: true })

  // Get vote scores for all answers
  const answerIds = answers?.map((a) => a.id) || []
  const { data: answerVotes } = answerIds.length > 0
    ? await supabase.from("answer_votes").select("answer_id, vote").in("answer_id", answerIds)
    : { data: [] }

  // Get user's votes on all answers
  const { data: userAnswerVotes } = answerIds.length > 0
    ? await supabase
        .from("answer_votes")
        .select("answer_id, vote")
        .in("answer_id", answerIds)
        .eq("user_id", user.id)
    : { data: [] }

  // Calculate scores and attach user votes to answers
  const answersWithVotes = answers?.map((answer) => {
    const votes = answerVotes?.filter((v) => v.answer_id === answer.id) || []
    const score = votes.reduce((sum, v) => sum + v.vote, 0)
    const userVote = userAnswerVotes?.find((v) => v.answer_id === answer.id)?.vote || null
    return { ...answer, voteScore: score, userVote }
  }) || []

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
                {(question.resolved || question.is_resolved) && (
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

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex items-center gap-6">
                  <QuestionVoting
                    questionId={questionId}
                    initialScore={questionScore}
                    userVote={userVote}
                    currentUserId={user.id}
                    disabled={isQuestionAuthor}
                  />
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{question.views || 0} views</span>
                    <span>{answers?.length || 0} answers</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-muted-foreground" title={formatAbsoluteTime(question.created_at)}>
                    {question.is_anonymous
                      ? "Anonymous"
                      : question.profiles?.display_name || question.profiles?.email}{" "}
                    • {formatRelativeTime(question.created_at)}
                  </div>
                  {!question.is_anonymous && (
                    <>
                      <QuestionActions
                        question={{
                          id: question.id,
                          title: question.title,
                          content: question.content,
                          author_id: question.author_id,
                          image_url: question.image_url,
                        }}
                        currentUserId={user.id}
                        currentUserRole={currentUserRole}
                      />
                      <ReportButton questionId={questionId} currentUserId={user.id} size="sm" />
                    </>
                  )}
                </div>
              </div>
              {/* Mark as Resolved Button for Admins/SuperAdmins */}
              <div className="pt-2">
                <MarkResolvedButton
                  questionId={questionId}
                  isResolved={question.resolved || false}
                  currentUserRole={currentUserRole}
                />
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
            {answersWithVotes && answersWithVotes.length > 0 ? (
              <AnswerList
                answers={answersWithVotes}
                isQuestionAuthor={isQuestionAuthor || isCurrentUserAdmin}
                currentUserId={user.id}
                currentUserRole={currentUserRole}
                questionId={questionId}
                bestAnswerId={bestAnswerId}
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

