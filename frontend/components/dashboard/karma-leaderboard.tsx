"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, Medal, Award, ChevronLeft, ChevronRight } from "lucide-react"

interface KarmaLeaderboardProps {
  currentUserId: string
  usersPerPage?: number
}

const USERS_PER_PAGE = 5

export function KarmaLeaderboard({ currentUserId, usersPerPage = USERS_PER_PAGE }: KarmaLeaderboardProps) {
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, email, role, karma_points")
          .order("karma_points", { ascending: false })

        if (error) throw error
        setTopUsers(data || [])
      } catch (error) {
        console.error("Error fetching karma leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const totalPages = Math.ceil(topUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const paginatedUsers = useMemo(() => topUsers.slice(startIndex, endIndex), [topUsers, startIndex, endIndex])

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top Contributors</h3>
        <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
      </Card>
    )
  }

  if (!topUsers || topUsers.length === 0) {
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
          {paginatedUsers.map((user, index) => {
            const globalIndex = startIndex + index
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
                    <div className="flex-shrink-0">{getRankIcon(globalIndex)}</div>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, topUsers.length)} of {topUsers.length} users
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
    </Card>
  )
}
