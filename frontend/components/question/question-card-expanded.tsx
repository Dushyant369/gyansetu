"use client"

import { useState, useTransition, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QuestionVoting } from "@/components/question/question-voting"
import { AnswerVoting } from "@/components/question/answer-voting"
import { createAnswer, createReply, markBestAnswer } from "@/app/question/[id]/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { MessageSquareReply, ChevronDown, ChevronUp, Upload, X, CheckCircle2 } from "lucide-react"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ReportButton } from "@/components/question/report-button"
import { ReplyItem } from "@/components/question/reply-item"
import { QuestionActions } from "@/components/question/question-actions"
import { EditAnswerModal } from "@/components/question/edit-answer-modal"
import { Edit2, Trash2 } from "lucide-react"
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

interface QuestionCardExpandedProps {
  question: {
    id: string
    title: string
    content: string | null
    author_id: string
    is_resolved: boolean
    views: number
    created_at: string
    course_id: string | null
    best_answer_id?: string | null
    courses?: {
      id: string
      name: string
      code: string
    } | null
    profiles: {
      display_name: string | null
      email: string
      role?: string
    }
    tags?: string[]
  }
  currentUserId: string
  currentUserRole: string
  initialAnswers?: Answer[]
  initialQuestionScore?: number
  initialUserVote?: number | null
}

export function QuestionCardExpanded({
  question,
  currentUserId,
  currentUserRole,
  initialAnswers = [],
  initialQuestionScore = 0,
  initialUserVote = null,
}: QuestionCardExpandedProps) {
  const [showAnswers, setShowAnswers] = useState(false)
  const [showAnswerForm, setShowAnswerForm] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>(initialAnswers)
  const [questionScore, setQuestionScore] = useState(initialQuestionScore)
  const [userVote, setUserVote] = useState<number | null>(initialUserVote)
  const [answerContent, setAnswerContent] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isAnswering, setIsAnswering] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({})
  const [replyVisibility, setReplyVisibility] = useState<Record<string, boolean>>({})
  const [isReplyPending, setIsReplyPending] = useState<Record<string, boolean>>({})
  const [replyImageFiles, setReplyImageFiles] = useState<Record<string, File | null>>({})
  const [replyImagePreviews, setReplyImagePreviews] = useState<Record<string, string | null>>({})
  const [isReplyUploading, setIsReplyUploading] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const router = useRouter()

  const isQuestionAuthor = question.author_id === currentUserId
  const isCurrentUserAdmin = currentUserRole === "admin" || currentUserRole === "superadmin"
  const isCurrentUserStudent = currentUserRole === "student"

  // Fetch answers when showing answers
  useEffect(() => {
    if (showAnswers && answers.length === 0) {
      const fetchAnswers = async () => {
        const supabase = createClient()
        const { data: fetchedAnswers } = await supabase
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
          .eq("question_id", question.id)
          .order("is_accepted", { ascending: false })
          .order("created_at", { ascending: true })

        if (fetchedAnswers) {
          // Get vote scores for all answers
          const answerIds = fetchedAnswers.map((a) => a.id)
          const { data: answerVotes } = answerIds.length > 0
            ? await supabase.from("answer_votes").select("answer_id, vote").in("answer_id", answerIds)
            : { data: [] }

          // Get user's votes on all answers
          const { data: userAnswerVotes } = answerIds.length > 0
            ? await supabase
                .from("answer_votes")
                .select("answer_id, vote")
                .in("answer_id", answerIds)
                .eq("user_id", currentUserId)
            : { data: [] }

          // Calculate scores and attach user votes
          const answersWithVotes = fetchedAnswers.map((answer) => {
            const votes = answerVotes?.filter((v) => v.answer_id === answer.id) || []
            const score = votes.reduce((sum, v) => sum + v.vote, 0)
            const userVote = userAnswerVotes?.find((v) => v.answer_id === answer.id)?.vote || null
            return { ...answer, voteScore: score, userVote }
          })

          setAnswers(answersWithVotes)
        }
      }
      fetchAnswers()
    }
  }, [showAnswers, question.id, currentUserId, answers.length])


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      return
    }

    const allowedTypes = ["image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({
        title: "Invalid image",
        description: "Only JPG or PNG images under 5MB are allowed.",
        variant: "destructive",
      })
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
      setImageFile(null)
      setImagePreview(null)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImageFile(file)
    setImagePreview(previewUrl)
  }

  const handleAnswerSubmit = async () => {
    if (!answerContent.trim()) {
      toast({
        title: "Answer required",
        description: "Please write an answer before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsAnswering(true)
    try {
      let uploadedImageUrl: string | null = null

      if (imageFile) {
        setIsUploading(true)
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("You must be signed in to upload images.")
        }

        const fileExt = imageFile.name.split(".").pop() || "jpg"
        const fileName = `${user.id}-answer-${Date.now()}.${fileExt}`
        const filePath = `answers/${fileName}`

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
        setIsUploading(false)
      }

      await createAnswer(question.id, answerContent.trim(), uploadedImageUrl)
      toast({
        title: "Success",
        description: "Answer posted successfully!",
      })
      setAnswerContent("")
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
      setImageFile(null)
      setImagePreview(null)
      setShowAnswerForm(false)
      setShowAnswers(true)
      
      // Refetch answers
      const supabase = createClient()
      const { data: fetchedAnswers } = await supabase
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
        .eq("question_id", question.id)
        .order("is_accepted", { ascending: false })
        .order("created_at", { ascending: true })

      if (fetchedAnswers) {
        const answerIds = fetchedAnswers.map((a) => a.id)
        const { data: answerVotes } = answerIds.length > 0
          ? await supabase.from("answer_votes").select("answer_id, vote").in("answer_id", answerIds)
          : { data: [] }

        const { data: userAnswerVotes } = answerIds.length > 0
          ? await supabase
              .from("answer_votes")
              .select("answer_id, vote")
              .in("answer_id", answerIds)
              .eq("user_id", currentUserId)
          : { data: [] }

        const answersWithVotes = fetchedAnswers.map((answer) => {
          const votes = answerVotes?.filter((v) => v.answer_id === answer.id) || []
          const score = votes.reduce((sum, v) => sum + v.vote, 0)
          const userVote = userAnswerVotes?.find((v) => v.answer_id === answer.id)?.vote || null
          return { ...answer, voteScore: score, userVote }
        })

        setAnswers(answersWithVotes)
      }
      
      router.refresh()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to post answer",
        variant: "destructive",
      })
    } finally {
      setIsAnswering(false)
      setIsUploading(false)
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
      toast({
        title: "Reply required",
        description: "Please write a reply before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsReplyPending((prev) => ({ ...prev, [answerId]: true }))
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

      const reply = await createReply(answerId, question.id, content, uploadedImageUrl)
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
      setReplyInputs((prev) => ({ ...prev, [answerId]: "" }))
      if (replyImagePreviews[answerId]) {
        URL.revokeObjectURL(replyImagePreviews[answerId]!)
      }
      setReplyImageFiles((prev) => ({ ...prev, [answerId]: null }))
      setReplyImagePreviews((prev) => ({ ...prev, [answerId]: null }))
      setReplyVisibility((prev) => ({ ...prev, [answerId]: false }))
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
      setIsReplyPending((prev) => ({ ...prev, [answerId]: false }))
      setIsReplyUploading((prev) => ({ ...prev, [answerId]: false }))
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Question Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/question/${question.id}`}>
                <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                  {question.title}
                </h3>
              </Link>
              {question.is_resolved && (
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Resolved</Badge>
              )}
            </div>
            {question.content && (
              <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{question.content}</p>
            )}
            {question.courses && (
              <Badge variant="outline" className="text-xs mb-2">
                {question.courses.code} - {question.courses.name}
              </Badge>
            )}
            {!question.courses && (
              <Badge variant="outline" className="text-xs mb-2 bg-primary/10">
                General Question
              </Badge>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>By: {question.profiles?.display_name || question.profiles?.email}</span>
                <span>•</span>
                <span>{question.views} views</span>
                <span>•</span>
                <span title={formatAbsoluteTime(question.created_at)}>{formatRelativeTime(question.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <QuestionActions
                  question={{
                    id: question.id,
                    title: question.title,
                    content: question.content,
                    author_id: question.author_id,
                    image_url: null,
                  }}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                />
                <ReportButton questionId={question.id} currentUserId={currentUserId} />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <QuestionVoting
              questionId={question.id}
              initialScore={questionScore}
              userVote={userVote}
              currentUserId={currentUserId}
              disabled={isQuestionAuthor}
            />
            {!isQuestionAuthor && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAnswerForm(!showAnswerForm)}
                disabled={isAnswering || isUploading}
                className="gap-2"
              >
                <MessageSquareReply className="w-4 h-4" />
                Answer
              </Button>
            )}
          </div>
        </div>

        {/* Answer Form */}
        {showAnswerForm && !isQuestionAuthor && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <h5 className="text-sm font-semibold text-foreground">Your Answer</h5>
            <Textarea
              value={answerContent}
              onChange={(e) => setAnswerContent(e.target.value)}
              placeholder="Write your answer here..."
              rows={4}
              className="resize-none"
              disabled={isAnswering || isUploading}
            />
            <div className="space-y-2">
              <Label htmlFor={`answer-image-${question.id}`} className="text-sm">
                Attach Image (optional)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id={`answer-image-${question.id}`}
                  type="file"
                  accept="image/png,image/jpeg"
                  disabled={isAnswering || isUploading}
                  onChange={handleImageChange}
                />
                {imageFile && (
                  <span className="text-xs text-muted-foreground">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                )}
              </div>
              {imagePreview && (
                <div className="relative mt-2 w-full max-w-sm overflow-hidden rounded-lg border border-border">
                  <Image
                    src={imagePreview}
                    alt="Image preview"
                    width={600}
                    height={400}
                    className="w-full h-auto object-cover"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur"
                    onClick={() => {
                      if (imagePreview) {
                        URL.revokeObjectURL(imagePreview)
                      }
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    disabled={isAnswering || isUploading}
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
            <div className="flex gap-2">
              <Button
                onClick={handleAnswerSubmit}
                disabled={isAnswering || isUploading || !answerContent.trim()}
                size="sm"
              >
                {isAnswering || isUploading ? "Posting..." : "Post Answer"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAnswerForm(false)
                  setAnswerContent("")
                  if (imagePreview) {
                    URL.revokeObjectURL(imagePreview)
                  }
                  setImageFile(null)
                  setImagePreview(null)
                }}
                disabled={isAnswering || isUploading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Show Answers Button */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnswers(!showAnswers)}
            className="gap-2"
          >
            {showAnswers ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Hide Answers
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show Answers ({answers.length})
              </>
            )}
          </Button>
        </div>

        {/* Answers List */}
        {showAnswers && (
          <div className="space-y-4 pt-4 border-t border-border">
            {answers.length > 0 ? (
              answers.map((answer) => {
                const isAnswerAuthor = answer.author_id === currentUserId
                const answerAuthorRole = answer.profiles?.role || "student"
                const isAnswerAuthorAdmin = answerAuthorRole === "admin" || answerAuthorRole === "superadmin"
                const canVote = !isAnswerAuthor && !(isCurrentUserStudent && isAnswerAuthorAdmin) && !(isCurrentUserAdmin && isAnswerAuthorAdmin)

                const isBestAnswer = question.best_answer_id === answer.id
                const isAnswerAuthorStudent = answer.profiles?.role === "student" || !answer.profiles?.role
                const canMarkBestAnswer = (currentUserRole === "admin" || currentUserRole === "superadmin" || currentUserRole === "teacher") && isAnswerAuthorStudent

                return (
                  <Card
                    key={answer.id}
                    className={cn(
                      "p-4 transition-all duration-200",
                      isBestAnswer
                        ? "border-green-600 border-2 bg-green-50 dark:bg-green-900/20 shadow-lg"
                        : answer.is_accepted
                        ? "border-green-500 border-2 bg-green-500/5 shadow-lg"
                        : "border-border hover:bg-card/50"
                    )}
                  >
                    <div className="space-y-3">
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

                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          {answer.image_url && (
                            <div className="mb-3 overflow-hidden rounded-lg border border-border bg-card/80">
                              <Image
                                src={answer.image_url}
                                alt="Answer attachment"
                                width={600}
                                height={400}
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          )}
                          <p className="text-sm text-foreground whitespace-pre-wrap">{answer.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>By: {answer.profiles?.display_name || answer.profiles?.email}</span>
                            <span>•</span>
                            <span title={formatAbsoluteTime(answer.created_at)}>
                              {formatRelativeTime(answer.created_at)}
                            </span>
                            {answer.profiles?.karma_points !== undefined && (
                              <>
                                <span>•</span>
                                <span>{answer.profiles.karma_points} karma</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <AnswerVoting
                            answerId={answer.id}
                            initialScore={answer.voteScore || 0}
                            userVote={answer.userVote || null}
                            currentUserId={currentUserId}
                            disabled={!canVote}
                            questionId={question.id}
                          />
                          {canMarkBestAnswer && (
                            <Button
                              variant={isBestAnswer ? "default" : "outline"}
                              size="sm"
                              onClick={async () => {
                                try {
                                  const result = await markBestAnswer(answer.id, question.id)
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
                              }}
                              className={`gap-2 ${isBestAnswer ? "bg-green-600 hover:bg-green-700 text-white" : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"}`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              {isBestAnswer ? "Unmark" : "Mark Best"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Reply Section */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setReplyVisibility((prev) => ({
                                ...prev,
                                [answer.id]: !prev[answer.id],
                              }))
                            }
                            className="gap-2"
                            disabled={isReplyPending[answer.id]}
                          >
                            <MessageSquareReply className="w-4 h-4" />
                            Reply
                          </Button>
                          <ReportButton answerId={answer.id} currentUserId={currentUserId} />
                        </div>

                        {replyVisibility[answer.id] && (
                          <div className="mt-3 space-y-2">
                            <Textarea
                              value={replyInputs[answer.id] || ""}
                              onChange={(e) =>
                                setReplyInputs((prev) => ({
                                  ...prev,
                                  [answer.id]: e.target.value,
                                }))
                              }
                              placeholder="Write a reply..."
                              rows={2}
                              className="resize-none"
                              disabled={isReplyPending[answer.id] || isReplyUploading[answer.id]}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey && replyInputs[answer.id]?.trim()) {
                                  e.preventDefault()
                                  handleReplySubmit(answer.id)
                                }
                              }}
                            />
                            <div className="space-y-2">
                              <Label htmlFor={`reply-image-${answer.id}`} className="text-sm">
                                Attach Image (optional)
                              </Label>
                              <div className="flex items-center gap-3">
                                <Input
                                  id={`reply-image-${answer.id}`}
                                  type="file"
                                  accept="image/png,image/jpeg"
                                  disabled={isReplyPending[answer.id] || isReplyUploading[answer.id]}
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
                                    disabled={isReplyPending[answer.id] || isReplyUploading[answer.id]}
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
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReplySubmit(answer.id)}
                                disabled={isReplyPending[answer.id] || isReplyUploading[answer.id] || !replyInputs[answer.id]?.trim()}
                                size="sm"
                              >
                                {isReplyPending[answer.id] || isReplyUploading[answer.id] ? "Posting..." : "Post Reply"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setReplyVisibility((prev) => ({ ...prev, [answer.id]: false }))
                                  setReplyInputs((prev) => ({ ...prev, [answer.id]: "" }))
                                  if (replyImagePreviews[answer.id]) {
                                    URL.revokeObjectURL(replyImagePreviews[answer.id]!)
                                  }
                                  setReplyImageFiles((prev) => ({ ...prev, [answer.id]: null }))
                                  setReplyImagePreviews((prev) => ({ ...prev, [answer.id]: null }))
                                }}
                                disabled={isReplyPending[answer.id] || isReplyUploading[answer.id]}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Replies List */}
                        {answer.replies && answer.replies.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {answer.replies.map((reply) => (
                              <ReplyItem
                                key={reply.id}
                                reply={reply}
                                questionId={question.id}
                                currentUserId={currentUserId}
                                currentUserRole={currentUserRole}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No answers yet. Be the first to answer!</p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

