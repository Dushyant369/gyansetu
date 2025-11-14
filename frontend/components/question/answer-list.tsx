"use client"

import { useState, useTransition, useEffect } from "react"
import Image from "next/image"
import { acceptAnswer, createReply, markBestAnswer } from "@/app/question/[id]/actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { CheckCircle2, MessageCircleReply } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"
import { AnswerVoting } from "@/components/question/answer-voting"
import { ReportButton } from "@/components/question/report-button"
import { ReplyItem } from "@/components/question/reply-item"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Edit2, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { EditAnswerModal } from "./edit-answer-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteAnswer } from "@/app/question/[id]/edit-actions"

interface Answer {
  id: string
  content: string
  author_id: string
  is_accepted: boolean
  upvotes: number
  upvoted_by: string[] | null
  created_at: string
  image_url?: string | null
  voteScore?: number
  userVote?: number | null
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
  image_url?: string | null
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
  bestAnswerId?: string | null
}

export function AnswerList({ answers: initialAnswers, isQuestionAuthor, currentUserId, currentUserRole, questionId, bestAnswerId }: AnswerListProps) {
  const [answers, setAnswers] = useState(initialAnswers)
  const [isPending, startTransition] = useTransition()
  const [isReplyPending, startReplyTransition] = useTransition()
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [replyVisibility, setReplyVisibility] = useState<Record<string, boolean>>({})
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({})
  const [replyImageFiles, setReplyImageFiles] = useState<Record<string, File | null>>({})
  const [replyImagePreviews, setReplyImagePreviews] = useState<Record<string, string | null>>({})
  const [isReplyUploading, setIsReplyUploading] = useState<Record<string, boolean>>({})
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null)
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Sync with server state
  useEffect(() => {
    setAnswers(initialAnswers)
  }, [initialAnswers])


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

  const handleMarkBestAnswer = async (answerId: string) => {
    startTransition(async () => {
      try {
        const result = await markBestAnswer(answerId, questionId)
        toast({
          title: "Success",
          description: result.isBestAnswer ? "Answer marked as best answer!" : "Best answer unmarked",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to mark best answer",
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

  const handleReplyImageChange = (answerId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setReplyImageFiles((prev) => ({ ...prev, [answerId]: null }))
      if (replyImagePreviews[answerId]) {
        URL.revokeObjectURL(replyImagePreviews[answerId]!)
      }
      setReplyImagePreviews((prev) => ({ ...prev, [answerId]: null }))
      return
    }

    const allowedTypes = ["image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({
        title: "Invalid image",
        description: "Only JPG or PNG images under 5MB are allowed.",
        variant: "destructive",
      })
      if (replyImagePreviews[answerId]) {
        URL.revokeObjectURL(replyImagePreviews[answerId]!)
      }
      setReplyImageFiles((prev) => ({ ...prev, [answerId]: null }))
      setReplyImagePreviews((prev) => ({ ...prev, [answerId]: null }))
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setReplyImageFiles((prev) => ({ ...prev, [answerId]: file }))
    setReplyImagePreviews((prev) => ({ ...prev, [answerId]: previewUrl }))
  }

  const handleReplySubmit = async (answerId: string) => {
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
        let uploadedImageUrl: string | null = null
        const imageFile = replyImageFiles[answerId]

        if (imageFile) {
          setIsReplyUploading((prev) => ({ ...prev, [answerId]: true }))
          const supabase = createClient()
          const {
            data: { user },
          } = await supabase.auth.getUser()

          if (!user) {
            throw new Error("You must be signed in to upload images.")
          }

          const fileExt = imageFile.name.split(".").pop() || "jpg"
          const fileName = `${user.id}-reply-${Date.now()}.${fileExt}`
          const filePath = `replies/${fileName}`

          const { error: uploadError } = await supabase.storage.from("qa-images").upload(filePath, imageFile, {
            cacheControl: "3600",
            upsert: true,
          })

          if (uploadError) {
            throw new Error(uploadError.message || "Failed to upload image")
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("qa-images").getPublicUrl(filePath)
          uploadedImageUrl = publicUrl
          setIsReplyUploading((prev) => ({ ...prev, [answerId]: false }))
        }

        const reply = await createReply(answerId, questionId, content, uploadedImageUrl)
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
        if (replyImagePreviews[answerId]) {
          URL.revokeObjectURL(replyImagePreviews[answerId]!)
        }
        setReplyImageFiles((prev) => ({ ...prev, [answerId]: null }))
        setReplyImagePreviews((prev) => ({ ...prev, [answerId]: null }))
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
      } finally {
        setIsReplyUploading((prev) => ({ ...prev, [answerId]: false }))
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
        const isAnswerAuthor = answer.author_id === currentUserId
        const answerAuthorRole = answer.profiles?.role || "student"
        const isAnswerAuthorAdmin = answerAuthorRole === "admin" || answerAuthorRole === "superadmin"
        const isCurrentUserStudent = currentUserRole === "student"
        const isCurrentUserAdmin = currentUserRole === "admin" || currentUserRole === "superadmin"
        
        // Role-based voting rules
        // Students cannot vote on admin/superadmin answers
        // Admins cannot vote on other admin/superadmin answers
        // No one can vote on their own answer
        const canVote = !isAnswerAuthor && !(isCurrentUserStudent && isAnswerAuthorAdmin) && !(isCurrentUserAdmin && isAnswerAuthorAdmin)
        
        // Admins/SuperAdmins can accept any answer, question authors can accept any answer
        const canAccept = isCurrentUserAdmin || (isQuestionAuthor && !isAnswerAuthor)

        // Edit/Delete permissions
        // Students can edit/delete own answers
        // SuperAdmin can edit/delete any answer
        // Admin can edit/delete student answers only
        const canEdit = isAnswerAuthor || (isCurrentUserAdmin && !isAnswerAuthorAdmin) || currentUserRole === "superadmin"
        const canDelete = isAnswerAuthor || (isCurrentUserAdmin && !isAnswerAuthorAdmin) || currentUserRole === "superadmin"

        const handleDeleteAnswer = async (answerId: string) => {
          setDeletingAnswerId(answerId)
          startTransition(async () => {
            try {
              await deleteAnswer(answerId, questionId)
              toast({
                title: "Answer deleted",
                description: "The answer has been deleted successfully.",
              })
              router.refresh()
            } catch (error) {
              toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete answer",
                variant: "destructive",
              })
            } finally {
              setDeletingAnswerId(null)
            }
          })
        }

        const isBestAnswer = bestAnswerId === answer.id
        const isAnswerAuthorStudent = answer.profiles?.role === "student" || !answer.profiles?.role
        const canMarkBestAnswer = (currentUserRole === "admin" || currentUserRole === "superadmin" || currentUserRole === "teacher") && isAnswerAuthorStudent

        return (
          <Card
            key={answer.id}
            className={`p-6 transition-all duration-200 ${
              isBestAnswer
                ? "border-green-600 border-2 bg-green-50 dark:bg-green-900/20 shadow-lg"
                : answer.is_accepted
                ? "border-green-500 border-2 bg-green-500/5 shadow-lg"
                : "hover:bg-card/50 hover:shadow-md"
            }`}
          >
            <div className="space-y-4">
              {isBestAnswer && (
                <Badge className="bg-green-600/20 text-green-700 dark:text-green-400 mb-2 font-semibold">
                  ✓ Best Answer
                </Badge>
              )}
              {answer.is_accepted && !isBestAnswer && (
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
                  <AnswerVoting
                    answerId={answer.id}
                    initialScore={answer.voteScore || 0}
                    userVote={answer.userVote || null}
                    currentUserId={currentUserId}
                    disabled={!canVote}
                    questionId={questionId}
                  />
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
                  {canMarkBestAnswer && (
                    <Button
                      variant={isBestAnswer ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleMarkBestAnswer(answer.id)}
                      disabled={isPending}
                      className={`gap-2 ${isBestAnswer ? "bg-green-600 hover:bg-green-700 text-white" : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"}`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isBestAnswer ? "Unmark Best Answer" : "Mark as Best Answer"}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingAnswerId(answer.id)}
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={isPending || deletingAnswerId === answer.id}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this answer and all its replies. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isPending || deletingAnswerId === answer.id}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAnswer(answer.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isPending || deletingAnswerId === answer.id}
                          >
                            {isPending || deletingAnswerId === answer.id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
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
                  <ReportButton answerId={answer.id} currentUserId={currentUserId} />
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
                    disabled={isReplyPending || isReplyUploading[answer.id]}
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
                  <div className="space-y-2">
                    <Label htmlFor={`reply-image-${answer.id}`} className="text-sm">
                      Attach Image (optional)
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id={`reply-image-${answer.id}`}
                        type="file"
                        accept="image/png,image/jpeg"
                        disabled={isReplyPending || isReplyUploading[answer.id]}
                        onChange={(e) => handleReplyImageChange(answer.id, e)}
                      />
                      {replyImageFiles[answer.id] && (
                        <span className="text-xs text-muted-foreground">
                          {(replyImageFiles[answer.id]!.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      )}
                    </div>
                    {replyImagePreviews[answer.id] && (
                      <div className="relative mt-2 w-full max-w-sm overflow-hidden rounded-lg border border-border">
                        <Image
                          src={replyImagePreviews[answer.id]!}
                          alt="Image preview"
                          width={400}
                          height={300}
                          className="w-full h-auto object-cover"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 bg-background/80 backdrop-blur"
                          onClick={() => {
                            if (replyImagePreviews[answer.id]) {
                              URL.revokeObjectURL(replyImagePreviews[answer.id]!)
                            }
                            setReplyImageFiles((prev) => ({ ...prev, [answer.id]: null }))
                            setReplyImagePreviews((prev) => ({ ...prev, [answer.id]: null }))
                          }}
                          disabled={isReplyPending || isReplyUploading[answer.id]}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Supported formats: JPG, PNG. Max size 5MB.
                    </p>
                  </div>
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
                        if (replyImagePreviews[answer.id]) {
                          URL.revokeObjectURL(replyImagePreviews[answer.id]!)
                        }
                        setReplyImageFiles((prev) => ({ ...prev, [answer.id]: null }))
                        setReplyImagePreviews((prev) => ({ ...prev, [answer.id]: null }))
                      }}
                      disabled={isReplyPending || isReplyUploading[answer.id]}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleReplySubmit(answer.id)}
                      disabled={isReplyPending || isReplyUploading[answer.id] || !replyInputs[answer.id]?.trim()}
                    >
                      {isReplyPending || isReplyUploading[answer.id] ? "Posting..." : "Post Reply"}
                    </Button>
                  </div>
                </div>
              )}

              {answer.replies && answer.replies.length > 0 && (
                <div className="mt-4 space-y-3 border-t border-border pt-4">
                  {answer.replies.map((reply) => (
                    <ReplyItem
                      key={reply.id}
                      reply={reply}
                      questionId={questionId}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        )
      })}

      {/* Edit Answer Modals */}
      {answers.map((answer) => (
        <EditAnswerModal
          key={`edit-${answer.id}`}
          answer={{
            id: answer.id,
            content: answer.content,
            image_url: answer.image_url,
          }}
          questionId={questionId}
          open={editingAnswerId === answer.id}
          onOpenChange={(open) => setEditingAnswerId(open ? answer.id : null)}
          onSuccess={() => {
            setEditingAnswerId(null)
            router.refresh()
          }}
        />
      ))}
    </div>
  )
}

