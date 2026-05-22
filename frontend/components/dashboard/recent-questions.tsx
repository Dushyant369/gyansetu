import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import { formatRelativeTime } from "@/lib/date"

export async function RecentQuestions() {
  const supabase = await createClient()

  const { data: questions } = await supabase
    .from("questions")
    .select(
      `
      id,
      title,
      created_at,
      profiles!author_id (display_name),
      courses (name)
    `
    )
    .order("created_at", { ascending: false })
    .limit(5)

  const items = questions ?? []

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-primary" />
          Recent Questions
        </h2>
        <Link
          href="/solve-questions"
          className="text-sm text-primary hover:underline font-medium"
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No questions yet. Be the first to ask!</p>
          <Link href="/dashboard/questions/new" className="text-sm text-primary hover:underline mt-2 inline-block">
            Ask a question
          </Link>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((q) => {
            const profile = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles
            const course = Array.isArray(q.courses) ? q.courses[0] : q.courses
            return (
              <li key={q.id}>
                <Link href={`/question/${q.id}`}>
                  <Card className="p-4 hover:bg-card/80 transition-colors">
                    <p className="font-medium text-foreground line-clamp-1">{q.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(profile as { display_name?: string } | null)?.display_name ?? "Anonymous"}
                      {course ? ` · ${(course as { name?: string }).name}` : ""}
                      {" · "}
                      {formatRelativeTime(q.created_at)}
                    </p>
                  </Card>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
