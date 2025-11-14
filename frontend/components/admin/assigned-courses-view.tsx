"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { deleteQuestion, markQuestionResolved } from "@/app/admin/questions/actions"
import { createAnswer } from "@/app/question/[id]/actions"
import { useTransition } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageSquareReply, Upload, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface Answer {
  id: string
  content: string
  author_id: string
  is_accepted: boolean
  created_at: string
  profiles: {
    display_name: string | null
    email: string
  }
}

interface Question {
  id: string
  title: string
  content: string | null
  is_resolved: boolean
  views: number
  upvotes: number
  downvotes: number
  created_at: string
  profiles: {
    display_name: string | null
    email: string
  }
  answers?: Answer[]
}

interface Course {
  id: string
  name: string
  code: string
  description: string | null
  semester: string | null
}

interface AssignedCoursesViewProps {
  courses: Course[]
}

export function AssignedCoursesView({ courses }: AssignedCoursesViewProps) {
  const [questionsByCourse, setQuestionsByCourse] = useState<Record<string, Question[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [answerInputs, setAnswerInputs] = useState<Record<string, string>>({})
  const [answerVisibility, setAnswerVisibility] = useState<Record<string, boolean>>({})
  const [isAnswering, setIsAnswering] = useState<Record<string, boolean>>({})
  const [imageFiles, setImageFiles] = useState<Record<string, File | null>>({})
  const [imagePreviews, setImagePreviews] = useState<Record<string, string | null>>({})
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, { content?: string; image?: string }>>({})
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const supabase = createClient()
        const questionsMap: Record<string, Question[]> = {}

        // Fetch questions for each course
        for (const course of courses) {
          let questionsQuery = supabase
            .from("questions")
            .select(
              `
              *,
              profiles!author_id(display_name, email)
            `
            )
            .order("created_at", { ascending: false })

          // Handle general questions (no course) vs specific course questions
          if (course.id === "general") {
            questionsQuery = questionsQuery.is("course_id", null)
          } else {
            questionsQuery = questionsQuery.eq("course_id", course.id)
          }

          const { data: questions, error: questionsError } = await questionsQuery

          if (questionsError) {
            console.error(`Error fetching questions for course ${course.id}:`, questionsError)
            questionsMap[course.id] = []
          } else {
            // Fetch answers for each question
            const questionsWithAnswers = await Promise.all(
              (questions || []).map(async (question) => {
                const { data: answers } = await supabase
                  .from("answers")
                  .select(
                    `
                    *,
                    profiles!author_id(display_name, email)
                  `
                  )
                  .eq("question_id", question.id)
                  .order("is_accepted", { ascending: false })
                  .order("created_at", { ascending: true })

                return {
                  ...question,
                  answers: answers || [],
                }
              })
            )
            questionsMap[course.id] = questionsWithAnswers
          }
        }

        setQuestionsByCourse(questionsMap)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch questions")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [courses])

  const handleDeleteQuestion = async (questionId: string) => {
    setError("")
    startTransition(async () => {
      try {
        await deleteQuestion(questionId)
        toast({
          title: "Success",
          description: "Question deleted successfully!",
        })
        // Remove question from state
        setQuestionsByCourse((prev) => {
          const updated = { ...prev }
          for (const courseId in updated) {
            updated[courseId] = updated[courseId].filter((q) => q.id !== questionId)
          }
          return updated
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete question"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    })
  }

  const handleToggleResolved = async (questionId: string, currentStatus: boolean) => {
    setError("")
    startTransition(async () => {
      try {
        await markQuestionResolved(questionId, !currentStatus)
        const newStatus = !currentStatus
        toast({
          title: "Success",
          description: newStatus ? "Question marked as resolved!" : "Question marked as unresolved!",
        })
        // Update question status in state
        setQuestionsByCourse((prev) => {
          const updated = { ...prev }
          for (const courseId in updated) {
            updated[courseId] = updated[courseId].map((q) =>
              q.id === questionId ? { ...q, is_resolved: newStatus } : q
            )
          }
          return updated
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update question"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    })
  }

  const toggleAnswerForm = (questionId: string) => {
    setAnswerVisibility((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }))
    if (!answerVisibility[questionId]) {
      setAnswerInputs((prev) => ({ ...prev, [questionId]: "" }))
      setImageFiles((prev) => ({ ...prev, [questionId]: null }))
      if (imagePreviews[questionId]) {
        URL.revokeObjectURL(imagePreviews[questionId]!)
      }
      setImagePreviews((prev) => ({ ...prev, [questionId]: null }))
      setFieldErrors((prev) => ({ ...prev, [questionId]: {} }))
    }
  }

  const handleImageChange = (questionId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImageFiles((prev) => ({ ...prev, [questionId]: null }))
      if (imagePreviews[questionId]) {
        URL.revokeObjectURL(imagePreviews[questionId]!)
      }
      setImagePreviews((prev) => ({ ...prev, [questionId]: null }))
      setFieldErrors((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], image: undefined },
      }))
      return
    }

    const allowedTypes = ["image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      const message = "Only JPG or PNG images under 5MB are allowed."
      toast({
        title: "Invalid image",
        description: message,
        variant: "destructive",
      })
      setFieldErrors((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], image: message },
      }))
      if (imagePreviews[questionId]) {
        URL.revokeObjectURL(imagePreviews[questionId]!)
      }
      setImageFiles((prev) => ({ ...prev, [questionId]: null }))
      setImagePreviews((prev) => ({ ...prev, [questionId]: null }))
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImageFiles((prev) => ({ ...prev, [questionId]: file }))
    setImagePreviews((prev) => ({ ...prev, [questionId]: previewUrl }))
    setFieldErrors((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], image: undefined },
    }))
  }

  const removeImage = (questionId: string) => {
    if (imagePreviews[questionId]) {
      URL.revokeObjectURL(imagePreviews[questionId]!)
    }
    setImageFiles((prev) => ({ ...prev, [questionId]: null }))
    setImagePreviews((prev) => ({ ...prev, [questionId]: null }))
    setFieldErrors((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], image: undefined },
    }))
  }

  const handleAnswerSubmit = async (questionId: string) => {
    const content = answerInputs[questionId]?.trim()
    if (!content) {
      setFieldErrors((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], content: "Answer content is required." },
      }))
      toast({
        title: "Answer required",
        description: "Please write an answer before submitting.",
        variant: "destructive",
      })
      return
    }

    setIsAnswering((prev) => ({ ...prev, [questionId]: true }))
    try {
      let uploadedImageUrl: string | null = null
      const imageFile = imageFiles[questionId]

      if (imageFile) {
        setIsUploading((prev) => ({ ...prev, [questionId]: true }))
        const supabase = createClient()
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
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
        setIsUploading((prev) => ({ ...prev, [questionId]: false }))
      }

      await createAnswer(questionId, content, uploadedImageUrl)
      toast({
        title: "Success",
        description: "Answer posted successfully!",
      })
      setAnswerInputs((prev) => ({ ...prev, [questionId]: "" }))
      if (imagePreviews[questionId]) {
        URL.revokeObjectURL(imagePreviews[questionId]!)
      }
      setImageFiles((prev) => ({ ...prev, [questionId]: null }))
      setImagePreviews((prev) => ({ ...prev, [questionId]: null }))
      setFieldErrors((prev) => ({ ...prev, [questionId]: {} }))
      setAnswerVisibility((prev) => ({ ...prev, [questionId]: false }))
      router.refresh()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to post answer",
        variant: "destructive",
      })
    } finally {
      setIsAnswering((prev) => ({ ...prev, [questionId]: false }))
      setIsUploading((prev) => ({ ...prev, [questionId]: false }))
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading questions...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {error && (
        <Alert className="bg-destructive/10 border-destructive/20">
          <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
        </Alert>
      )}

      {courses.map((course) => {
        const questions = questionsByCourse[course.id] || []
        return (
          <Card key={course.id} className="p-6">
            <div className="space-y-6">
              {/* Course Header */}
              <div className="border-b border-border pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{course.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {course.code} {course.semester && `• ${course.semester}`}
                    </p>
                    {course.description && (
                      <p className="text-sm text-muted-foreground mt-2">{course.description}</p>
                    )}
                  </div>
                  <Badge variant="secondary">{questions.length} Question{questions.length !== 1 ? "s" : ""}</Badge>
                </div>
              </div>

              {/* Questions List */}
              {questions.length > 0 ? (
                <div className="space-y-4">
                  {questions.map((question) => (
                    <div key={question.id} className="border border-border rounded-lg p-4 space-y-4">
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-foreground">{question.title}</h4>
                            {question.is_resolved && (
                              <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">Resolved</Badge>
                            )}
                          </div>
                          {question.content && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{question.content}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By: {question.profiles?.display_name || question.profiles?.email || "Unknown"}</span>
                            <span>•</span>
                            <span>{question.views} views</span>
                            <span>•</span>
                            <span>{question.upvotes - question.downvotes} votes</span>
                            <span>•</span>
                            <span title={formatAbsoluteTime(question.created_at)}>
                              {formatRelativeTime(question.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => toggleAnswerForm(question.id)}
                            disabled={isPending || isAnswering[question.id]}
                            className="gap-2"
                          >
                            <MessageSquareReply className="w-4 h-4" />
                            {answerVisibility[question.id] ? "Cancel" : "Answer"}
                          </Button>
                          <Button
                            variant={question.is_resolved ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => handleToggleResolved(question.id, question.is_resolved)}
                            disabled={isPending}
                          >
                            {question.is_resolved ? "Mark Unresolved" : "Mark Resolved"}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={isPending}>
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the question "{question.title}" and all its answers. This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {/* Answer Form */}
                      {answerVisibility[question.id] && (
                        <div className="mt-4 pt-4 border-t border-border space-y-3">
                          <h5 className="text-sm font-semibold text-foreground">Your Answer</h5>
                          <div className="space-y-2">
                            <Textarea
                              value={answerInputs[question.id] || ""}
                              onChange={(e) => {
                                setAnswerInputs((prev) => ({ ...prev, [question.id]: e.target.value }))
                                if (fieldErrors[question.id]?.content) {
                                  setFieldErrors((prev) => ({
                                    ...prev,
                                    [question.id]: { ...prev[question.id], content: undefined },
                                  }))
                                }
                              }}
                              placeholder="Write your answer here..."
                              rows={4}
                              className={cn(
                                "resize-none",
                                fieldErrors[question.id]?.content &&
                                  "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                              )}
                              disabled={isAnswering[question.id] || isUploading[question.id]}
                              aria-invalid={!!fieldErrors[question.id]?.content}
                            />
                            {fieldErrors[question.id]?.content && (
                              <p className="text-red-500 text-sm">{fieldErrors[question.id].content}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`answer-image-${question.id}`} className="text-sm">
                              Attach Image (optional)
                            </Label>
                            <div className="flex items-center gap-3">
                              <Input
                                id={`answer-image-${question.id}`}
                                type="file"
                                accept="image/png,image/jpeg"
                                disabled={isAnswering[question.id] || isUploading[question.id]}
                                onChange={(e) => handleImageChange(question.id, e)}
                                className={cn(
                                  fieldErrors[question.id]?.image &&
                                    "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                                )}
                                aria-invalid={!!fieldErrors[question.id]?.image}
                              />
                              {imageFiles[question.id] && (
                                <span className="text-xs text-muted-foreground">
                                  {(imageFiles[question.id]!.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                              )}
                            </div>
                            {fieldErrors[question.id]?.image && (
                              <p className="text-red-500 text-sm">{fieldErrors[question.id].image}</p>
                            )}
                            {imagePreviews[question.id] && (
                              <div className="relative mt-2 w-full max-w-sm overflow-hidden rounded-lg border border-border">
                                <Image
                                  src={imagePreviews[question.id]!}
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
                                  onClick={() => removeImage(question.id)}
                                  disabled={isAnswering[question.id] || isUploading[question.id]}
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
                              onClick={() => handleAnswerSubmit(question.id)}
                              disabled={
                                isAnswering[question.id] ||
                                isUploading[question.id] ||
                                !answerInputs[question.id]?.trim()
                              }
                              size="sm"
                            >
                              {isAnswering[question.id] || isUploading[question.id]
                                ? "Posting..."
                                : "Post Answer"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleAnswerForm(question.id)}
                              disabled={isAnswering[question.id] || isUploading[question.id]}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Answers Section */}
                      {question.answers && question.answers.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <h5 className="text-sm font-semibold text-foreground mb-3">
                            {question.answers.length} Answer{question.answers.length !== 1 ? "s" : ""}
                          </h5>
                          <div className="space-y-3">
                            {question.answers.map((answer) => (
                              <div
                                key={answer.id}
                                className={`p-3 rounded-md ${
                                  answer.is_accepted ? "bg-green-500/10 border border-green-500/20" : "bg-muted/50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm text-foreground flex-1 whitespace-pre-wrap">
                                    {answer.content}
                                  </p>
                                  {answer.is_accepted && (
                                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 shrink-0">
                                      Accepted
                                    </Badge>
                                  )}
                                </div>
                                <div
                                  className="text-xs text-muted-foreground mt-2"
                                  title={formatAbsoluteTime(answer.created_at)}
                                >
                                  By: {answer.profiles?.display_name || answer.profiles?.email || "Unknown"} •{" "}
                                  {formatRelativeTime(answer.created_at)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No questions for this course yet.</p>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

