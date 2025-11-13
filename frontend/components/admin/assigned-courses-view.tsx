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
import { useTransition } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"

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
  const { toast } = useToast()

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
                            variant={question.is_resolved ? "outline" : "default"}
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

