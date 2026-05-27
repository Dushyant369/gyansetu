import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/require-user"
import { createAnswerBodySchema } from "@/lib/answers/validation"
import { insertAnswerWithFallback, serializeAnswerForClient } from "@/lib/answers/insert-answer"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const auth = await requireUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = createAnswerBodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { questionId, content } = parsed.data
  const mediaInput = {
    imageUrls: parsed.data.imageUrls,
    videoUrls: parsed.data.videoUrls,
    videoLinks: parsed.data.videoLinks,
  }

  const supabase = await createClient()
  const user = auth.user!

  const { data: question } = await supabase
    .from("questions")
    .select("author_id, title")
    .eq("id", questionId)
    .single()

  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 })
  }

  if (question.author_id === user.id) {
    return NextResponse.json({ error: "You cannot answer your own question" }, { status: 403 })
  }

  try {
    const { data } = await insertAnswerWithFallback(
      supabase,
      questionId,
      user.id,
      content,
      mediaInput
    )

    if (question.author_id !== user.id) {
      void Promise.resolve(
        supabase.from("notifications").insert({
          user_id: question.author_id,
          message: `Your question "${question.title.substring(0, 50)}" received a new answer`,
          type: "answer",
          related_question_id: questionId,
          related_answer_id: data.id,
        })
      ).catch(() => {})
    }

    return NextResponse.json({ answer: serializeAnswerForClient(data) }, { status: 201 })
  } catch (err) {
    console.error("POST /api/answers:", err)
    const message = err instanceof Error ? err.message : "Failed to create answer"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
