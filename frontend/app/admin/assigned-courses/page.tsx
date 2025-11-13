import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { AssignedCoursesView } from "@/components/admin/assigned-courses-view"

export default async function AssignedCoursesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to check role
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const userRole = profile?.role || "student"

  // Redirect non-admin users to dashboard
  if (userRole !== "admin") {
    redirect("/dashboard")
  }

  // Get all courses assigned to this admin
  const { data: assignedCourses } = await supabase
    .from("courses")
    .select("*")
    .eq("assigned_to", user.id)
    .order("name", { ascending: true })

  // Also include a virtual "General Questions" course for questions with no course
  const generalCourse = {
    id: "general",
    name: "General Questions",
    code: "GEN",
    description: "Questions not assigned to any specific course",
    semester: null,
  }

  const allCourses = assignedCourses && assignedCourses.length > 0 
    ? [...assignedCourses, generalCourse]
    : [generalCourse]

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader showAdminLink={true} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">My Assigned Courses</h2>
            <p className="text-muted-foreground">
              Manage questions and answers for courses assigned to you. Welcome, {profile?.display_name || "Admin"}!
            </p>
          </div>

          {/* Assigned Courses */}
          <AssignedCoursesView courses={allCourses} />
        </div>
      </main>
    </div>
  )
}

