"use client"

import { useState, useEffect, useTransition, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { updateUserRole } from "@/app/admin/users/actions"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface User {
  id: string
  display_name: string | null
  email: string
  role: string
  created_at: string
}

interface ManageUsersProps {
  currentUserId: string
  currentUserRole: string
}

const USERS_PER_PAGE = 10

export function ManageUsers({ currentUserId, currentUserRole }: ManageUsersProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [isPaginating, startPaginateTransition] = useTransition()
  const [currentPage, setCurrentPage] = useState(1)
  const { toast } = useToast()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, email, role, created_at")
          .order("created_at", { ascending: false })

        if (error) {
          throw error
        }

        setUsers(data || [])
        setFilteredUsers(data || [])
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch users",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [toast])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
      setCurrentPage(1)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = users.filter(
      (user) =>
        user.email.toLowerCase().includes(term) ||
        (user.display_name && user.display_name.toLowerCase().includes(term))
    )
    setFilteredUsers(filtered)
    setCurrentPage(1)
  }, [searchTerm, users])

  const visibleUsers = useMemo(() => {
    return filteredUsers.filter((user) => {
      if (currentUserRole === "superadmin") {
        return true
      }
      return user.role === "student"
    })
  }, [filteredUsers, currentUserRole])

  const totalUsers = visibleUsers.length
  const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedUsers = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages)
    const startIndex = (safePage - 1) * USERS_PER_PAGE
    return visibleUsers.slice(startIndex, startIndex + USERS_PER_PAGE)
  }, [visibleUsers, currentPage, totalPages])

  const safePage = Math.min(currentPage, totalPages)
  const startEntry = totalUsers === 0 ? 0 : (safePage - 1) * USERS_PER_PAGE + 1
  const endEntry = totalUsers === 0 ? 0 : Math.min(startEntry + USERS_PER_PAGE - 1, totalUsers)

  const handleRoleChange = async (userId: string, currentRole: string) => {
    // Determine new role based on current role
    let newRole: "student" | "admin" | "superadmin"
    if (currentRole === "admin") {
      newRole = "student"
    } else if (currentRole === "student") {
      newRole = "admin"
    } else {
      // SuperAdmin cannot be changed
      return
    }

    startTransition(async () => {
      try {
        await updateUserRole(userId, newRole)
        toast({
          title: "Success",
          description: `User role updated to ${newRole} successfully!`,
        })

        // Update local state
        setUsers((prev) =>
          prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
        )
        setFilteredUsers((prev) =>
          prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
        )
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to update user role",
          variant: "destructive",
        })
      }
    })
  }

  if (loading) {
    return (
      <Card className="p-12">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Loading users...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Manage Users</h3>
          <p className="text-sm text-muted-foreground">
            Search for users and manage their roles. You cannot change your own role.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Role</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    {searchTerm ? "No users found matching your search." : "No users found."}
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => {
                    const isCurrentUser = user.id === currentUserId
                    const isSuperAdmin = user.role === "superadmin"
                    const isAdmin = user.role === "admin"
                    const isStudent = user.role === "student"

                    // Determine if current user can modify this user
                    const canModify =
                      !isCurrentUser &&
                      !isSuperAdmin &&
                      (currentUserRole === "superadmin" || (currentUserRole === "admin" && isStudent))

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-border hover:bg-muted/50 transition-colors ${
                          index % 2 === 0 ? "bg-card" : "bg-muted/20"
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">
                            {user.display_name || user.email?.split("@")[0] || "User"}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={
                              isSuperAdmin
                                ? "default"
                                : isAdmin
                                  ? "default"
                                  : "secondary"
                            }
                            className={
                              isSuperAdmin
                                ? "bg-purple-600 text-white border-purple-500/30"
                                : isAdmin
                                  ? "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30"
                                  : ""
                            }
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {isCurrentUser ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="opacity-50 cursor-not-allowed"
                                  >
                                    {isAdmin ? "Make Student" : isSuperAdmin ? "SuperAdmin" : "Make Admin"}
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>You cannot change your own role.</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : isSuperAdmin ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="opacity-50 cursor-not-allowed"
                                  >
                                    SuperAdmin
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>SuperAdmin cannot be modified.</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : !canModify && isAdmin ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled
                                    className="opacity-50 cursor-not-allowed"
                                  >
                                    Admin
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>You don't have permission to modify other admins.</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRoleChange(user.id, user.role)}
                              disabled={isPending}
                              className="transition-all hover:scale-105"
                            >
                              {isPending
                                ? "Updating..."
                                : isAdmin
                                  ? "Make Student"
                                  : "Make Admin"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {totalUsers === 0
              ? "Showing 0 of 0 users"
              : `Showing ${startEntry}-${endEntry} of ${totalUsers} user${totalUsers === 1 ? "" : "s"}`}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  startPaginateTransition(() => {
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  })
                }
                disabled={safePage === 1 || isPaginating}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  startPaginateTransition(() => {
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  })
                }
                disabled={safePage === totalPages || isPaginating}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

