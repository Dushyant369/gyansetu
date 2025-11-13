import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function ModerationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is moderator or admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (!profile || (profile.role !== "moderator" && profile.role !== "admin")) {
    redirect("/dashboard")
  }

  // Fetch reports
  const { data: reports } = await supabase
    .from("moderation_reports")
    .select(`
      *,
      reporter:profiles!reporter_id(display_name),
      moderator:profiles!moderator_id(display_name),
      question:questions(id, title),
      answer:answers(id, question_id)
    `)
    .order("created_at", { ascending: false })

  const pendingReports = reports?.filter((r) => r.status === "pending") || []
  const resolvedReports = reports?.filter((r) => r.status === "resolved") || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">G</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">GyanSetu</h1>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Moderation Dashboard</h2>
            <p className="text-muted-foreground">Review and manage community reports</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6">
              <p className="text-2xl font-bold text-primary">{pendingReports.length}</p>
              <p className="text-sm text-muted-foreground mt-2">Pending Reports</p>
            </Card>
            <Card className="p-6">
              <p className="text-2xl font-bold text-primary">{resolvedReports.length}</p>
              <p className="text-sm text-muted-foreground mt-2">Resolved Reports</p>
            </Card>
            <Card className="p-6">
              <p className="text-2xl font-bold text-primary">{reports?.length || 0}</p>
              <p className="text-sm text-muted-foreground mt-2">Total Reports</p>
            </Card>
          </div>

          {/* Pending Reports */}
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-6">Pending Reports</h3>

            {pendingReports.length > 0 ? (
              <div className="space-y-4">
                {pendingReports.map((report: any) => (
                  <Card key={report.id} className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="font-medium text-foreground mb-2">
                            {report.question?.title || "Answer in question"}
                          </p>
                          <p className="text-sm text-muted-foreground mb-3">Reason: {report.reason}</p>
                          <p className="text-xs text-muted-foreground">Reported by: {report.reporter?.display_name}</p>
                        </div>
                        <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">Pending</Badge>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button size="sm">Approve</Button>
                        <Button size="sm" variant="outline">
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground">No pending reports</p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
