"use client"

import { useState, useTransition, useEffect } from "react"
import Image from "next/image"
import { toggleAnswerUpvote, acceptAnswer, createReply } from "@/app/question/[id]/actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ChevronUp, CheckCircle2, MessageCircleReply } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"

interface Answer {
  id: string
  content: string
  author_id: string
  is_accepted: boolean
  upvotes: number
  upvoted_by: string[] | null
  created_at: string
  image_url?: string | null
  profiles: {
    display_name: string | null
    email: string
    karma_points: number
    role?: string
  }
  replies?: Reply[]
}

interface Reply {
  id: string
  content: string
  author_id: string
  created_at: string
  profiles?: {
    display_name: string | null
    email: string
    role?: string
  }
}

interface AnswerListProps {
  answers: Answer[]
  isQuestionAuthor: boolean
  currentUserId: string
  currentUserRole: string
  questionId: string
}

export function AnswerList({ answers: initialAnswers, isQuestionAuthor, currentUserId, currentUserRole, questionId }: AnswerListProps) {
  const [answers, setAnswers] = useState(initialAnswers)
  const [isPending, startTransition] = useTransition()
  const [isReplyPending, startReplyTransition] = useTransition()
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [replyVisibility, setReplyVisibility] = useState<Record<string, boolean>>({})
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const router = useRouter()

  // Sync with server state
  useEffect(() => {
    setAnswers(initialAnswers)
  }, [initialAnswers])

  const handleUpvote = async (answerId: string, currentUpvoted: boolean) => {
    startTransition(async () => {
      try {
        const result = await toggleAnswerUpvote(answerId)
        setAnswers((prev) =>
          prev.map((answer) =>
            answer.id === answerId
              ? {
                  ...answer,
                  upvoted_by: result.isUpvoted
                    ? [...(answer.upvoted_by || []), currentUserId]
                    : (answer.upvoted_by || []).filter((id) => id !== currentUserId),
                  upvotes: result.upvoteCount,
                }
              : answer
          )
        )
        toast({
          title: "Success",
          description: result.isUpvoted ? "Answer upvoted!" : "Upvote removed",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update upvote",
          variant: "destructive",
        })
      }
    })
  }

  const handleAccept = async (answerId: string, questionId: string, currentAccepted: boolean) => {
    startTransition(async () => {
      try {
        const result = await acceptAnswer(answerId, questionId)
        setAnswers((prev) =>
          prev.map((answer) => {
            if (answer.id === answerId) {
              return { ...answer, is_accepted: result.isAccepted }
            }
            // Unaccept other answers
            if (result.isAccepted && answer.is_accepted) {
              return { ...answer, is_accepted: false }
            }
            return answer
          })
        )
        toast({
          title: "Success",
          description: result.isAccepted ? "Answer accepted!" : "Answer unaccepted",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to accept answer",
          variant: "destructive",
        })
      }
    })
  }

  const toggleReply = (answerId: string) => {
    setReplyVisibility((prev) => ({
      ...prev,
      [answerId]: !prev[answerId],
    }))
    setReplyErrors((prev) => ({ ...prev, [answerId]: "" }))
  }

  const handleReplyChange = (answerId: string, value: string) => {
    setReplyInputs((prev) => ({
      ...prev,
      [answerId]: value,
    }))
    if (replyErrors[answerId]) {
      setReplyErrors((prev) => ({ ...prev, [answerId]: "" }))
    }
  }

  const handleReplySubmit = (answerId: string) => {
    const content = replyInputs[answerId]?.trim()

    if (!content) {
      const message = "Reply content is required."
      setReplyErrors((prev) => ({ ...prev, [answerId]: message }))
      toast({
        title: "Reply required",
        description: message,
        variant: "destructive",
      })
      return
    }

    startReplyTransition(async () => {
      try {
        const reply = await createReply(answerId, questionId, content)
        setAnswers((prev) =>
          prev.map((answer) =>
            answer.id === answerId
              ? {
                  ...answer,
                  replies: [...(answer.replies || []), reply],
                }
              : answer
          )
        )
        setReplyInputs((prev) => ({
          ...prev,
          [answerId]: "",
        }))
        setReplyErrors((prev) => ({ ...prev, [answerId]: "" }))
        setReplyVisibility((prev) => ({
          ...prev,
          [answerId]: false,
        }))
        toast({
          title: "Reply posted",
          description: "Your reply has been added.",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to post reply",
          variant: "destructive",
        })
      }
    })
  }

  const handleReplyKeyDown = (answerId: string, event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      if (isReplyPending) return
      event.preventDefault()
      handleReplySubmit(answerId)
    }
  }


  return (
    <div className="space-y-4">
      {answers.map((answer) => {
        const isUpvoted = (answer.upvoted_by || []).includes(currentUserId)
        const isAnswerAuthor = answer.author_id === currentUserId
        const answerAuthorRole = answer.profiles?.role || "student"
        const isAnswerAuthorAdmin = answerAuthorRole === "admin" || answerAuthorRole === "superadmin"
        const isCurrentUserStudent = currentUserRole === "student"
        const isCurrentUserAdmin = currentUserRole === "admin" || currentUserRole === "superadmin"
        
        // Students cannot upvote admin/superadmin answers
        const canUpvote = !isAnswerAuthor && !(isCurrentUserStudent && isAnswerAuthorAdmin)
        
        // Admins/SuperAdmins can accept any answer, question authors can accept any answer
        const canAccept = isCurrentUserAdmin || (isQuestionAuthor && !isAnswerAuthor)

        return (
          <Card
            key={answer.id}
            className={`p-6 transition-all duration-200 ${
              answer.is_accepted
                ? "border-green-500 border-2 bg-green-500/5 shadow-lg"
                : "hover:bg-card/50 hover:shadow-md"
            }`}
          >
            <div className="space-y-4">
              {answer.is_accepted && (
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 mb-2">
                  ✓ Accepted Answer
                </Badge>
              )}

              {answer.image_url && (
                <div className="overflow-hidden rounded-lg border border-border bg-card/80">
                  <Image
                    src={answer.image_url}
                    alt="Answer attachment"
                    width={1200}
                    height={800}
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap">{answer.content}</p>
              </div>

              <div className="flex flex-wrap justify-between gap-4 items-center pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpvote(answer.id, isUpvoted)}
                    disabled={isPending || !canUpvote}
                    className={`gap-2 transition-all ${isUpvoted ? "bg-primary/10 border-primary text-primary" : ""} ${
                      !canUpvote ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    title={!canUpvote ? "Students cannot upvote admin answers" : ""}
                  >
                    <ChevronUp className="w-4 h-4" />
                    {answer.upvotes || 0}
                  </Button>
                  {canAccept && (
                    <Button
                      variant={answer.is_accepted ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleAccept(answer.id, questionId, answer.is_accepted)}
                      disabled={isPending}
                      className="gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {answer.is_accepted ? "Unaccept" : "Accept Answer"}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleReply(answer.id)}
                    className="gap-2"
                    disabled={isReplyPending}
                  >
                    <MessageCircleReply className="w-4 h-4" />
                    Reply
                  </Button>
                </div>
                <div
                  className="text-sm text-muted-foreground ml-auto"
                  title={formatAbsoluteTime(answer.created_at)}
                >
                  <span>{answer.profiles?.display_name || answer.profiles?.email}</span>
                  {answer.profiles?.karma_points !== undefined && (
                    <span className="ml-2 text-xs">({answer.profiles.karma_points} karma)</span>
                  )}
                  <span className="ml-2">• {formatRelativeTime(answer.created_at)}</span>
                </div>
              </div>

              {replyVisibility[answer.id] && (
                <div className="mt-4 space-y-3 border border-dashed border-border rounded-lg p-4 bg-muted/30">
                  <Textarea
                    value={replyInputs[answer.id] || ""}
                    onChange={(event) => handleReplyChange(answer.id, event.target.value)}
                    placeholder="Write a reply..."
                    rows={3}
                    disabled={isReplyPending}
                    className={cn(
                      "resize-none",
                      replyErrors[answer.id] && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                    )}
                    aria-invalid={!!replyErrors[answer.id]}
                    onKeyDown={(event) => handleReplyKeyDown(answer.id, event)}
                  />
                  {replyErrors[answer.id] && (
                    <p className="text-red-500 text-sm">{replyErrors[answer.id]}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toggleReply(answer.id)
                        setReplyInputs((prev) => ({
                          ...prev,
                          [answer.id]: "",
                        }))
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleReplySubmit(answer.id)}
                      disabled={isReplyPending || !replyInputs[answer.id]?.trim()}
                    >
                      {isReplyPending ? "Posting..." : "Post Reply"}
                    </Button>
                  </div>
                </div>
              )}

              {answer.replies && answer.replies.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  {answer.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-lg border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground"
                    >
                      <p className="text-foreground whitespace-pre-wrap">{reply.content}</p>
                      <div
                        className="mt-3 text-xs text-muted-foreground flex items-center gap-2"
                        title={formatAbsoluteTime(reply.created_at)}
                      >
                        <span>{reply.profiles?.display_name || reply.profiles?.email}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(reply.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

