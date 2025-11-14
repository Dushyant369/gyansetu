import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card } from "@/components/ui/card"
import { Plus, BookOpen, User, Settings, MessageSquare, HelpCircle, Lightbulb, CheckCircle2 } from "lucide-react"
import { KarmaLeaderboard } from "@/components/dashboard/karma-leaderboard"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const metadataDisplayName =
    (typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()) ||
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) ||
    null

  const resolvedDisplayName =
    (profile?.display_name && profile.display_name.trim().length > 0 && profile.display_name.trim()) ||
    metadataDisplayName ||
    (user.email?.split("@")[0] ?? "Student")

  const userProfile = {
    id: profile?.id ?? user.id,
    email: profile?.email ?? user.email ?? "",
    display_name: resolvedDisplayName,
    karma_points: profile?.karma_points ?? 0,
    role: profile?.role ?? "student",
  }

  const isAdmin = userProfile.role === "admin" || userProfile.role === "superadmin"
  const isStudent = userProfile.role === "student"

  // Check if this is first login and create welcome notification
  const { data: existingWelcomeNotification } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "welcome")
    .limit(1)

  if (!existingWelcomeNotification || existingWelcomeNotification.length === 0) {
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "welcome",
      message: "Welcome to GyanSetu! Start exploring courses and solving questions.",
      metadata: { is_welcome: true },
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader showAdminLink={true} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome, {userProfile?.display_name || "Student"}!
            </h2>
            <p className="text-muted-foreground">
              You have {userProfile?.karma_points || 0} karma points. Start asking questions or helping others!
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isStudent && (
              <Link href="/dashboard/questions/new">
                <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg border-primary/10">
                  <div className="space-y-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                      <Plus className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">Ask a Question</h3>
                    <p className="text-sm text-muted-foreground">Post your academic questions to the community</p>
                  </div>
                </Card>
              </Link>
            )}

            <Link href="/solve-questions">
              <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg border-primary/10">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Browse Questions</h3>
                  <p className="text-sm text-muted-foreground">Browse and answer questions by subject or general topics</p>
                </div>
              </Card>
            </Link>

            <Link href="/enrolled-questions">
              <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg border-primary/10">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Solve Enrolled Courses Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    {isStudent 
                      ? "Practice questions from your enrolled subjects"
                      : "View and answer questions from enrolled courses"}
                  </p>
                </div>
              </Card>
            </Link>

            <Link href="/resolved-questions">
              <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg border-primary/10">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-foreground">Resolved Questions</h3>
                  <p className="text-sm text-muted-foreground">View questions marked as solved by teachers/admins</p>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/courses">
              <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg border-primary/10">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Browse Courses</h3>
                  <p className="text-sm text-muted-foreground">Explore questions from your courses</p>
                </div>
              </Card>
            </Link>

            <Link href="/dashboard/profile">
              <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg border-primary/10">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">View Profile</h3>
                  <p className="text-sm text-muted-foreground">Update your profile and view your history</p>
                </div>
              </Card>
            </Link>
          </div>

          {/* Admin Quick Access */}
          {isAdmin && (
            <Link href="/admin">
              <Card className="p-6 hover:bg-card/80 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg border-primary/20">
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Admin Panel</h3>
                  <p className="text-sm text-muted-foreground">Manage users, courses, and platform settings</p>
                </div>
              </Card>
            </Link>
          )}

          {/* Karma Leaderboard */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <KarmaLeaderboard currentUserId={user.id} />
            <Card className="p-8 text-center flex items-center justify-center">
              <p className="text-muted-foreground">More features coming soon!</p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
