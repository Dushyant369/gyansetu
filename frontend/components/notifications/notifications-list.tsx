"use client"

import { useState, useTransition } from "react"
import { deleteNotification } from "@/app/notifications/actions"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
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

interface NotificationsListProps {
  notifications: Notification[]
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "answer":
      return "💬"
    case "upvote":
      return "👍"
    case "accepted":
      return "✅"
    default:
      return "🔔"
  }
}

export function NotificationsList({ notifications: initialNotifications }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async (notificationId: string) => {
    startTransition(async () => {
      try {
        await deleteNotification(notificationId)
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
        toast({
          title: "Success",
          description: "Notification deleted",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete notification",
          variant: "destructive",
        })
      }
    })
  }

  if (notifications.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No notifications yet</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-4 ${!notification.seen ? "border-primary/30 bg-primary/5" : ""}`}
        >
          <div className="flex items-start gap-4">
            <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
            <div className="flex-1 min-w-0">
              <Link
                href={
                  notification.related_question_id
                    ? `/question/${notification.related_question_id}`
                    : "/dashboard"
                }
                className="block"
              >
                <p className={`text-sm ${!notification.seen ? "font-semibold" : ""} hover:text-primary`}>
                  {notification.message}
                </p>
              </Link>
              <p
                className="text-xs text-muted-foreground mt-1"
                title={formatAbsoluteTime(notification.created_at)}
              >
                {formatRelativeTime(notification.created_at)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(notification.id)}
              disabled={isPending}
            >
              ×
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

