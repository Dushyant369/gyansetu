import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"
import Link from "next/link"
import { CourseManagement } from "@/components/admin/course-management"
import { ManageUsers } from "@/components/admin/manage-users"

export default async function AdminPage() {
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

  // Redirect non-admin and non-superadmin users to dashboard
  if (userRole !== "admin" && userRole !== "superadmin") {
    redirect("/dashboard")
  }

  // Get admin stats
  const [usersResult, coursesResult, questionsResult, topStudentsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact" }),
    supabase.from("courses").select("id", { count: "exact" }),
    supabase.from("questions").select("id", { count: "exact" }),
    supabase
      .from("profiles")
      .select("id, display_name, email, karma_points")
      .eq("role", "student")
      .order("karma_points", { ascending: false })
      .limit(5),
  ])

  const totalUsers = usersResult.count || 0
  const totalCourses = coursesResult.count || 0
  const totalQuestions = questionsResult.count || 0
  const topStudents = topStudentsResult.data || []

  // Get recent users
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(10)

  // Get all admin and superadmin users for assignment dropdown
  const { data: adminUsers } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("role", ["admin", "superadmin"])
    .order("display_name", { ascending: true })

  // Get all courses
  const { data: coursesData } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: false })

  // Get assigned admin info for courses that have assigned_to
  const coursesWithAdmins = await Promise.all(
    (coursesData || []).map(async (course) => {
      if (course.assigned_to) {
        const { data: adminProfile } = await supabase
          .from("profiles")
          .select("id, display_name, email")
          .eq("id", course.assigned_to)
          .single()
        return { ...course, assigned_admin: adminProfile }
      }
      return { ...course, assigned_admin: null }
    })
  )

  const courses = coursesWithAdmins

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader showAdminLink={false} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Page Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
              {userRole === "superadmin" && (
                <Badge className="bg-purple-600 text-white border-purple-500/30">
                  SuperAdmin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Manage users, courses, and platform content. Welcome, {profile?.display_name || "Admin"}!
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Registered Users</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalUsers}</p>
              </div>
            </Card>
            <Card className="p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Courses Created</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalCourses}</p>
              </div>
            </Card>
            <Card className="p-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground">Total Questions Posted</p>
                </div>
                <p className="text-3xl font-bold text-foreground">{totalQuestions}</p>
              </div>
            </Card>
          </div>

          {/* Top Students by Karma */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Top 5 Students by Karma</h3>
              </div>
              {topStudents.length > 0 ? (
                <div className="space-y-3">
                  {topStudents.map((student: any, index: number) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {student.display_name || student.email?.split("@")[0] || "Student"}
                          </p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                            />
                          </svg>
                          <span className="font-semibold">{student.karma_points || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No students found</p>
              )}
            </div>
          </Card>

          {/* Manage Users */}
          <ManageUsers currentUserId={user.id} currentUserRole={userRole} />

          {/* Course Management */}
          <CourseManagement courses={courses || []} adminUsers={adminUsers || []} />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/admin/assigned-courses">
              <Card className="p-6 hover:bg-card/80 transition-colors cursor-pointer">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17.25c0 5.25 4.5 9.999 10 9.999 5.5 0 10-4.75 10-9.999 0-6.252-4.5-11-10-11z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-foreground">My Assigned Courses</h3>
                  <p className="text-sm text-muted-foreground">Manage questions and answers for your courses</p>
                </div>
              </Card>
            </Link>

                    <Link href="/admin/moderation">
                      <Card className="p-6 hover:bg-card/80 transition-colors cursor-pointer">
                        <div className="space-y-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                              />
                            </svg>
                          </div>
                          <h3 className="font-semibold text-foreground">Moderation</h3>
                          <p className="text-sm text-muted-foreground">Manage content and users</p>
                        </div>
                      </Card>
                    </Link>
          </div>

          {/* Recent Users */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground">Recent Users</h3>
                <p className="text-sm text-muted-foreground">View in Supabase Dashboard to manage roles</p>
              </div>
              {recentUsers && recentUsers.length > 0 ? (
                <div className="space-y-2">
                  {recentUsers.map((user: any) => (
                    <div key={user.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{user.display_name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                          {user.role}
                        </span>
                        <span
                          className="text-xs text-muted-foreground"
                          title={formatAbsoluteTime(user.created_at)}
                        >
                          {formatRelativeTime(user.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No users yet</p>
              )}
            </div>
          </Card>

          {/* Admin Note */}
          <Card className="p-6 bg-muted/50">
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Admin Functions</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>You can create and manage courses from the Courses page</li>
                <li>Moderation reports can be handled from the Moderation page</li>
              </ul>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

