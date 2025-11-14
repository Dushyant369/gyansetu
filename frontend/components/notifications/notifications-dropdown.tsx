"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { markNotificationsAsSeen } from "@/app/notifications/actions"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"

interface Notification {
  id: string
  message: string
  type: string
  seen: boolean
  created_at: string
  related_question_id: string | null
  related_answer_id: string | null
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "answer":
      return "💬"
    case "upvote":
      return "👍"
    case "accepted":
      return "✅"
    case "reply":
      return "💭"
    case "resolved":
      return "✅"
    case "welcome":
      return "👋"
    default:
      return "🔔"
  }
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unseenCount, setUnseenCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [autoClearTimer, setAutoClearTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const fetchNotifications = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) {
        console.error("Error fetching notifications:", error)
        return
      }

      setNotifications(data || [])
      setUnseenCount((data || []).filter((n) => !n.seen).length)
      setLoading(false)
    }

    fetchNotifications()

    // Subscribe to realtime updates
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
  }

  useEffect(() => {
    if (!isOpen || unseenCount === 0) {
      if (autoClearTimer) {
        clearTimeout(autoClearTimer)
        setAutoClearTimer(null)
      }
      return
    }

    const timer = setTimeout(async () => {
      try {
        await markNotificationsAsSeen()
        setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })))
        setUnseenCount(0)
      } catch (error) {
        console.error("Error marking notifications as seen:", error)
      }
    }, 10000)

    setAutoClearTimer(timer)

    return () => {
      clearTimeout(timer)
      setAutoClearTimer(null)
    }
  }, [isOpen, unseenCount])

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-slate-500 dark:text-muted-foreground">
        <Bell className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative transition-all text-slate-700 hover:text-blue-600 hover:bg-blue-50 dark:text-muted-foreground dark:hover:text-primary dark:hover:bg-primary/10"
        >
          <Bell className="w-5 h-5" />
          {unseenCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow-sm">
              {unseenCount > 9 ? "9+" : unseenCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto bg-white text-slate-800 shadow-xl border border-slate-200 dark:bg-card dark:text-foreground dark:shadow-lg dark:border-border transition-opacity duration-300"
      >
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications yet</div>
        ) : (
          notifications.map((notification) => (
            <Link
              key={notification.id}
              href={
                notification.related_question_id
                  ? `/question/${notification.related_question_id}`
                  : "/dashboard"
              }
            >
              <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer">
                <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.seen ? "font-semibold" : ""}`}>
                    {notification.message}
                  </p>
                  <p
                    className="text-xs text-muted-foreground mt-1"
                    title={formatAbsoluteTime(notification.created_at)}
                  >
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
                {!notification.seen && (
                  <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-primary flex-shrink-0 mt-2" />
                )}
              </DropdownMenuItem>
            </Link>
          ))
        )}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <Link href="/notifications">
              <DropdownMenuItem className="text-center justify-center cursor-pointer">
                View all notifications
              </DropdownMenuItem>
            </Link>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

