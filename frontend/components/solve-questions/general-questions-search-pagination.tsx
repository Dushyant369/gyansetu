"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageSquare, Search, ChevronLeft, ChevronRight, MessageSquareReply } from "lucide-react"
import { formatRelativeTime } from "@/lib/date"
import { EmptyState } from "@/components/ui/empty-state"

interface GeneralQuestion {
  id: string
  title: string
  content: string | null
  created_at: string
  views: number | null
  author_id: string
  answerCount?: number
  profiles: {
    display_name: string | null
    email: string
  } | null
}

interface GeneralQuestionsSearchPaginationProps {
  questions: GeneralQuestion[]
  currentUserId: string
}

const QUESTIONS_PER_PAGE = 10

export function GeneralQuestionsSearchPagination({
  questions,
  currentUserId,
}: GeneralQuestionsSearchPaginationProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Filter questions by search term
  const filteredQuestions = useMemo(() => {
    if (!searchTerm.trim()) {
      return questions
    }

    const term = searchTerm.toLowerCase()
    return questions.filter(
      (question) =>
        question.title.toLowerCase().includes(term) ||
        (question.content && question.content.toLowerCase().includes(term))
    )
  }, [questions, searchTerm])

  // Paginate filtered questions
  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE)
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE
  const endIndex = startIndex + QUESTIONS_PER_PAGE
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search general questions by title or content..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2 w-full"
        />
      </div>

      {/* Questions List */}
      {paginatedQuestions.length > 0 ? (
        <>
          <div className="space-y-4">
            {paginatedQuestions.map((question) => {
              const isQuestionAuthor = question.author_id === currentUserId
              return (
                <Card
                  key={question.id}
                  className="p-6 hover:bg-card/80 transition-all duration-200 hover:scale-[1.01] hover:shadow-md border-border"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/question/${question.id}`}
                        className="flex-1 group"
                      >
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {question.title}
                        </h3>
                      </Link>
                      <Badge variant="outline" className="bg-primary/10 flex-shrink-0">
                        General
                      </Badge>
                    </div>
                    {question.content && (
                      <Link href={`/question/${question.id}`}>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {question.content}
                        </p>
                      </Link>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          By: {question.profiles?.display_name || question.profiles?.email || "Anonymous"}
                        </span>
                        <span>•</span>
                        <span>{question.views || 0} views</span>
                        <span>•</span>
                        <span>{question.answerCount || 0} answers</span>
                        <span>•</span>
                        <span>{formatRelativeTime(question.created_at)}</span>
                      </div>
                      <Link href={`/question/${question.id}`}>
                        <Button
                          variant={isQuestionAuthor ? "outline" : "default"}
                          size="sm"
                          className="gap-2"
                        >
                          <MessageSquareReply className="w-4 h-4" />
                          {isQuestionAuthor ? "View Answers" : "Answer"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredQuestions.length)} of {filteredQuestions.length}{" "}
                question{filteredQuestions.length !== 1 ? "s" : ""}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground px-4">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon={<MessageSquare className="w-12 h-12 text-muted-foreground" />}
          title={searchTerm ? "No matching questions found" : "No general questions yet"}
          description={
            searchTerm
              ? "Try adjusting your search terms"
              : "There are no general questions posted yet. Be the first to ask!"
          }
        />
      )}
    </div>
  )
}

