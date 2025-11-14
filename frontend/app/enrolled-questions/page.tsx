import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, ArrowLeft } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"

export default async function EnrolledQuestionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to check role
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const userRole = profile?.role || "student"

  // Get student's enrolled courses
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("student_courses")
    .select(
      `
      course_id,
      enrolled_at,
      courses(id, name, code, description)
    `
    )
    .eq("student_id", user.id)
    .order("enrolled_at", { ascending: false })

  if (enrollmentsError) {
    console.error("Error fetching enrollments:", enrollmentsError)
  }

  const enrolledCourses = (enrollments || []).map((e: any) => e.courses).filter(Boolean)

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          {/* Back Button */}
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Enrolled Courses</h1>
            <p className="text-muted-foreground">
              Browse and solve questions from the courses you're enrolled in.
            </p>
          </div>

          {/* Enrolled Courses Grid */}
          {enrolledCourses && enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrolledCourses.map((course: any) => (
                <Link
                  href={`/enrolled-questions/${course.id}`}
                  key={course.id}
                  className="group"
                >
                  <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg border-primary/10 h-full">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {course.name}
                        </h3>
                      </div>
                      {course.code && (
                        <Badge variant="outline" className="bg-primary/10">
                          {course.code}
                        </Badge>
                      )}
                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">Click to view questions</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen className="w-12 h-12 text-muted-foreground" />}
              title="No enrolled courses"
              description="You haven't enrolled in any courses yet. Browse courses and enroll to start solving questions!"
              action={
                <Link href="/dashboard/courses">
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

