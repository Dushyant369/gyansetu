import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/require-user"
import {
  createAnswerBodySchema,
  hasAnswerBody,
  normalizeAnswerMediaInput,
  toAnswerDbFields,
} from "@/lib/answers/validation"
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
  const media = normalizeAnswerMediaInput({
    imageUrls: parsed.data.imageUrls,
    videoUrls: parsed.data.videoUrls,
    videoLinks: parsed.data.videoLinks,
  })

  const trimmedContent = content.trim()
  if (!hasAnswerBody(trimmedContent, media)) {
    return NextResponse.json({ error: "Answer must include text or media" }, { status: 400 })
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

  const mediaFields = toAnswerDbFields(media)

  const { data, error } = await supabase
    .from("answers")
    .insert({
      question_id: questionId,
      author_id: user.id,
      content: trimmedContent || "",
      ...mediaFields,
    })
    .select("id, question_id, author_id, content, is_accepted, created_at, updated_at")
    .single()

  if (error) {
    console.error("POST /api/answers:", error)
    return NextResponse.json({ error: error.message || "Failed to create answer" }, { status: 500 })
  }

  if (question.author_id !== user.id) {
    // Fire-and-forget notification
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

  return NextResponse.json({
    answer: {
      id: data.id,
      question_id: data.question_id,
      author_id: data.author_id,
      content: data.content,
      is_accepted: data.is_accepted,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }
  }, { status: 201 })
}
