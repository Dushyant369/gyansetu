"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BookOpen, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton } from "@/components/ui/skeleton"

interface Subject {
  id: string
  name: string
  code: string | null
}

interface SubjectsSearchPaginationProps {
  subjects: Subject[]
}

const SUBJECTS_PER_PAGE = 6

export function SubjectsSearchPagination({ subjects }: SubjectsSearchPaginationProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Filter subjects by search term
  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) {
      return subjects
    }

    const term = searchTerm.toLowerCase()
    return subjects.filter(
      (subject) =>
        subject.name.toLowerCase().includes(term) ||
        (subject.code && subject.code.toLowerCase().includes(term))
    )
  }, [subjects, searchTerm])

  // Paginate filtered subjects
  const totalPages = Math.ceil(filteredSubjects.length / SUBJECTS_PER_PAGE)
  const startIndex = (currentPage - 1) * SUBJECTS_PER_PAGE
  const endIndex = startIndex + SUBJECTS_PER_PAGE
  const paginatedSubjects = filteredSubjects.slice(startIndex, endIndex)

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
          placeholder="Search subjects by name or code..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-4 py-2 w-full"
        />
      </div>

      {/* Subjects Grid */}
      {paginatedSubjects.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSubjects.map((subject) => (
              <Link
                href={`/solve-questions/${subject.id}`}
                key={subject.id}
                className="group"
              >
                <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg border-primary/10 h-full">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {subject.name}
                      </h3>
                    </div>
                    {subject.code && (
                      <p className="text-sm text-muted-foreground">{subject.code}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">Click to view questions</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredSubjects.length)} of {filteredSubjects.length}{" "}
                subject{filteredSubjects.length !== 1 ? "s" : ""}
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
          icon={<BookOpen className="w-12 h-12 text-muted-foreground" />}
          title={searchTerm ? "No matching subjects found" : "No subjects available"}
          description={
            searchTerm
              ? "Try adjusting your search terms"
              : "There are no courses/subjects set up yet."
          }
        />
      )}
    </div>
  )
}

