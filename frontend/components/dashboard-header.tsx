import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { logout } from "@/app/auth/actions"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface DashboardHeaderProps {
  showAdminLink?: boolean
}

export async function DashboardHeader({ showAdminLink = false }: DashboardHeaderProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
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
    (user.email?.split("@")[0] ?? "User")

  const userProfile = {
    id: profile?.id ?? user.id,
    email: profile?.email ?? user.email ?? "",
    display_name: resolvedDisplayName,
    role: profile?.role ?? "student",
  }

  const isSuperAdmin = userProfile.role === "superadmin"
  const isAdmin = userProfile.role === "admin" || isSuperAdmin

  return (
    <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold">G</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">GyanSetu</h1>
        </Link>
        <div className="flex items-center gap-4">
          {/* Role Badge and Name */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-purple-600 text-white border-purple-500/30">
                SuperAdmin
              </Badge>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {userProfile?.display_name || "SuperAdmin"}
              </span>
            </div>
          )}
          {isAdmin && !isSuperAdmin && (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-primary/10 text-primary border-primary/20">
                Admin
              </Badge>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {userProfile?.display_name || "Admin"}
              </span>
            </div>
          )}
          {!isAdmin && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {userProfile?.display_name || "Student"}
            </span>
          )}
          {/* Notifications */}
          <NotificationsDropdown />
          <ThemeToggle />
          {isAdmin && (
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                Admin
              </Button>
            </Link>
          )}
          <Link href="/dashboard/profile">
            <Button variant="ghost" size="sm">
              Profile
            </Button>
          </Link>
          <form action={logout}>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="border-border hover:bg-destructive/20 hover:text-destructive hover:border-destructive/40 active:bg-destructive/30 dark:hover:bg-destructive/30 dark:hover:text-destructive-foreground dark:active:bg-destructive/40 transition-all"
            >
              Logout
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}

