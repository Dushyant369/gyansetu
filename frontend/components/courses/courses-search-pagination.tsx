"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { EnrollButton } from "@/components/courses/enroll-button"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

interface Course {
  id: string
  name: string
  code: string
  description?: string
  semester?: string
}

interface CoursesSearchPaginationProps {
  courses: Course[]
  enrolledCourseIds: Set<string>
}

const COURSES_PER_PAGE = 6

export function CoursesSearchPagination({
  courses,
  enrolledCourseIds,
}: CoursesSearchPaginationProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)

  // Filter courses by search term
  const filteredCourses = useMemo(() => {
    if (!searchTerm.trim()) {
      return courses
    }

    const term = searchTerm.toLowerCase()
    return courses.filter(
      (course) =>
        course.name.toLowerCase().includes(term) || course.code.toLowerCase().includes(term)
    )
  }, [courses, searchTerm])

  // Paginate filtered courses
  const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE)
  const startIndex = (currentPage - 1) * COURSES_PER_PAGE
  const endIndex = startIndex + COURSES_PER_PAGE
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by course name or code..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results Count */}
      {searchTerm && (
        <p className="text-sm text-muted-foreground">
          {filteredCourses.length === 0
            ? "No matching courses found"
            : `Found ${filteredCourses.length} course${filteredCourses.length !== 1 ? "s" : ""}`}
        </p>
      )}

      {/* Courses Grid */}
      {paginatedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCourses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course.id)
            return (
              <Card
                key={course.id}
                className="p-6 h-full flex flex-col transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border-border/50"
              >
                <div className="space-y-4 flex-1">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{course.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{course.code}</p>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {course.description || "No description available"}
                  </p>

                  {course.semester && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">Semester: {course.semester}</p>
                    </div>
                  )}
                </div>
                <div className="pt-4 mt-4 border-t border-border flex gap-2">
                  <Link href={`/courses/${course.id}/questions`} className="flex-1">
                    <Button className="w-full" size="sm">
                      View Questions
                    </Button>
                  </Link>
                  <EnrollButton courseId={course.id} isEnrolled={isEnrolled} />
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {searchTerm ? "No matching courses found" : "No courses available"}
          </p>
        </Card>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredCourses.length)} of{" "}
            {filteredCourses.length} courses
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
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
}
