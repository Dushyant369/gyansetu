import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { DashboardHeader } from "@/components/dashboard-header"
import { EmptyState } from "@/components/ui/empty-state"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function MyCoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get student's enrolled courses
  const { data: enrollments } = await supabase
    .from("student_courses")
    .select("course_id, courses(*)")
    .eq("student_id", user.id)
    .order("enrolled_at", { ascending: false })

  const enrolledCourses = (enrollments || []).map((e: any) => e.courses).filter(Boolean)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">My Courses</h2>
              <p className="text-muted-foreground">Courses you are enrolled in</p>
            </div>
            <Link href="/courses">
              <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                Browse All Courses
              </button>
            </Link>
          </div>

          {/* Enrolled Courses Grid */}
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course: any) => (
                <Card key={course.id} className="p-6 h-full flex flex-col transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border-border/50">
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
                  <div className="pt-4 mt-4 border-t border-border">
                    <Link href={`/courses/${course.id}/questions`}>
                      <button className="w-full px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        View Questions
                      </button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="w-12 h-12 text-muted-foreground" />}
              title="No enrolled courses"
              description="You haven't enrolled in any courses yet. Browse available courses and start learning!"
              action={
                <Link href="/courses">
                  <Button>Browse Courses</Button>
                </Link>
              }
            />
          )}
        </div>
      </main>
    </div>
  )
}

