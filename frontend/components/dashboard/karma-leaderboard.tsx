import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award } from "lucide-react"

interface KarmaLeaderboardProps {
  currentUserId: string
}

export async function KarmaLeaderboard({ currentUserId }: KarmaLeaderboardProps) {
  const supabase = await createClient()

  // Fetch top 5 users by karma
  const { data: topUsers, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, karma_points")
    .order("karma_points", { ascending: false })
    .limit(5)

  if (error || !topUsers || topUsers.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top Contributors</h3>
        <p className="text-sm text-muted-foreground text-center py-4">No contributors yet</p>
      </Card>
    )
  }

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 2:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-muted-foreground text-sm font-bold">{index + 1}</span>
    }
  }

  const getRoleBadge = (role: string) => {
    if (role === "superadmin") {
      return (
        <Badge className="bg-purple-600 text-white border-purple-500/30 text-xs">
          SuperAdmin
        </Badge>
      )
    }
    if (role === "admin") {
      return (
        <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs">
          Admin
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="text-xs">
        Student
      </Badge>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-foreground">Top Contributors</h3>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {topUsers.map((user, index) => {
            const isCurrentUser = user.id === currentUserId
            return (
              <div
                key={user.id}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrentUser
                    ? "bg-primary/10 border-primary/30 shadow-md"
                    : "bg-card border-border hover:bg-card/80"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">{getRankIcon(index)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`font-medium text-sm truncate ${
                            isCurrentUser ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {user.display_name || user.email?.split("@")[0] || "User"}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-primary">(You)</span>
                          )}
                        </p>
                        {getRoleBadge(user.role || "student")}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-sm font-semibold text-foreground">
                      {user.karma_points || 0} pts
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
