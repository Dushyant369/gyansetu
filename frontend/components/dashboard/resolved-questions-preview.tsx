import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
import { formatRelativeTime } from "@/lib/date"
import { fetchResolvedQuestions } from "@/lib/questions/resolved"

export const dynamic = "force-dynamic"

export async function ResolvedQuestionsPreview() {
  const supabase = await createClient()
  const { data: questions, error } = await fetchResolvedQuestions(supabase)

  if (error) {
    console.error("ResolvedQuestionsPreview fetch error:", error.message)
  }

  const items = (questions ?? []).slice(0, 5)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
          Resolved Questions
        </h2>
        <Link
          href="/resolved-questions"
          className="text-sm text-primary hover:underline font-medium"
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No resolved questions yet. Admins and professors can mark questions as resolved from the
            question page.
          </p>
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground line-clamp-1">{q.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {(profile as { display_name?: string } | null)?.display_name ?? "Anonymous"}
                          {course ? ` · ${(course as { name?: string }).name}` : ""}
                          {" · "}
                          {formatRelativeTime(q.created_at)}
                        </p>
                      </div>
                      <Badge className="shrink-0 bg-green-600/20 text-green-700 dark:text-green-400">
                        Resolved
                      </Badge>
                    </div>
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
