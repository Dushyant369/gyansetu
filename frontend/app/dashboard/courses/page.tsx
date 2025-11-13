import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EnrollButton } from "@/components/courses/enroll-button"
import { DashboardHeader } from "@/components/dashboard-header"
import { EmptyState } from "@/components/ui/empty-state"
import { CoursesSearchPagination } from "@/components/courses/courses-search-pagination"
import { BackButton } from "@/components/ui/back-button"
import { BookOpen } from "lucide-react"

export default async function CoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all courses
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("semester", { ascending: true })
    .order("name", { ascending: true })

  // Get student's enrolled courses
  const { data: enrollments } = await supabase
    .from("student_courses")
    .select("course_id")
    .eq("student_id", user.id)

  const enrolledCourseIds = new Set((enrollments || []).map((e) => e.course_id))

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <BackButton />
              </div>
              <h2 className="text-3xl font-bold text-foreground mb-2">All Courses</h2>
              <p className="text-muted-foreground">Browse and enroll in courses</p>
            </div>
            <Link href="/my-courses">
              <Button>My Courses</Button>
            </Link>
          </div>

          {/* Courses with Search and Pagination */}
          {courses && courses.length > 0 ? (
            <CoursesSearchPagination courses={courses} enrolledCourseIds={enrolledCourseIds} />
          ) : (
            <EmptyState
              icon={<BookOpen className="w-12 h-12 text-muted-foreground" />}
              title="No courses available"
              description="Courses will appear here once they are added by administrators."
            />
          )}
        </div>
      </main>
    </div>
  )
}
