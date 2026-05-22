import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Bell } from "lucide-react"
import { formatRelativeTime } from "@/lib/date"

interface RecentNotificationsProps {
  userId: string
}

export async function RecentNotifications({ userId }: RecentNotificationsProps) {
  const supabase = await createClient()

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, message, type, seen, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5)

  const items = notifications ?? []

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Bell className="w-7 h-7 text-primary" />
          Notifications
        </h2>
        <Link href="/notifications" className="text-sm text-primary hover:underline font-medium">
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No notifications yet.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <Card className={`p-4 ${!n.seen ? "border-primary/30 bg-primary/5" : ""}`}>
                <p className="text-sm text-foreground line-clamp-2">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(n.created_at)}
                  {!n.seen && (
                    <span className="ml-2 text-primary font-medium">New</span>
                  )}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
