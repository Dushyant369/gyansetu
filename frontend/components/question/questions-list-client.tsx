"use client"

import { useState, useMemo } from "react"
import { QuestionCardExpanded } from "./question-card-expanded"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect } from "react"

interface Question {
  id: string
  title: string
  content: string | null
  author_id: string
  is_resolved: boolean
  views: number
  created_at: string
  course_id: string | null
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

interface QuestionsListClientProps {
  questions: Question[]
  currentUserId: string
  currentUserRole: string
  questionsPerPage?: number
}

const QUESTIONS_PER_PAGE = 10

export function QuestionsListClient({
  questions,
  currentUserId,
  currentUserRole,
  questionsPerPage = QUESTIONS_PER_PAGE,
}: QuestionsListClientProps) {
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({})
  const [userVotes, setUserVotes] = useState<Record<string, number | null>>({})

  // Fetch vote scores and user votes
  useEffect(() => {
    const fetchVotes = async () => {
      const supabase = createClient()
      const questionIds = questions.map((q) => q.id)

      if (questionIds.length === 0) return

      // Get all question votes
      const { data: questionVotes } = await supabase
        .from("question_votes")
        .select("question_id, vote")
        .in("question_id", questionIds)

      // Get user's votes
      const { data: userQuestionVotes } = await supabase
        .from("question_votes")
        .select("question_id, vote")
        .in("question_id", questionIds)
        .eq("user_id", currentUserId)

      // Calculate scores
      const scores: Record<string, number> = {}
      const votes: Record<string, number | null> = {}

      questionIds.forEach((qId) => {
        const votesForQuestion = questionVotes?.filter((v) => v.question_id === qId) || []
        scores[qId] = votesForQuestion.reduce((sum, v) => sum + v.vote, 0)
        const userVote = userQuestionVotes?.find((v) => v.question_id === qId)
        votes[qId] = userVote?.vote || null
      })

      setQuestionScores(scores)
      setUserVotes(votes)
    }

    fetchVotes()
  }, [questions, currentUserId])

  // Group questions by course
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, Question[]> = {}
    questions.forEach((question) => {
      const key = question.course_id || "general"
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(question)
    })
    return groups
  }, [questions])

  // Track pagination per course group
  const [coursePages, setCoursePages] = useState<Record<string, number>>({})

  return (
    <div className="space-y-8">
      {Object.entries(groupedQuestions).map(([courseId, courseQuestions]) => {
        const courseName =
          courseId === "general"
            ? "General Questions"
            : courseQuestions[0]?.courses?.name || "Unknown Course"
        const courseCode = courseId === "general" ? "GEN" : courseQuestions[0]?.courses?.code || ""

        const groupCurrentPage = coursePages[courseId] || 1
        const startIndex = (groupCurrentPage - 1) * questionsPerPage
        const endIndex = startIndex + questionsPerPage
        const paginatedQuestions = courseQuestions.slice(startIndex, endIndex)
        const groupTotalPages = Math.ceil(courseQuestions.length / questionsPerPage)

        const setGroupPage = (newPage: number) => {
          setCoursePages((prev) => ({ ...prev, [courseId]: newPage }))
        }

        return (
          <div key={courseId} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground">{courseName}</h3>
                {courseCode && <p className="text-sm text-muted-foreground">{courseCode}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  {courseQuestions.length} question{courseQuestions.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {paginatedQuestions.map((question) => (
                <QuestionCardExpanded
                  key={question.id}
                  question={question}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  initialQuestionScore={questionScores[question.id] || 0}
                  initialUserVote={userVotes[question.id] || null}
                />
              ))}
            </div>

            {/* Pagination for this group */}
            {groupTotalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, courseQuestions.length)} of {courseQuestions.length}{" "}
                  questions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGroupPage(Math.max(1, groupCurrentPage - 1))}
                    disabled={groupCurrentPage === 1}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="text-sm text-muted-foreground px-4">
                    Page {groupCurrentPage} of {groupTotalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGroupPage(Math.min(groupTotalPages, groupCurrentPage + 1))}
                    disabled={groupCurrentPage === groupTotalPages}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

