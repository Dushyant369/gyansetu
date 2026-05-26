import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/require-user"
import { ANSWER_SELECT, mapAnswerRow } from "@/lib/answers/map-answer"
import {
  answerMediaBodySchema,
  hasAnswerBody,
  normalizeAnswerMediaInput,
  toAnswerDbFields,
} from "@/lib/answers/validation"
import {
  getAnswerImageUrls,
  getAnswerVideoUrls,
} from "@/lib/answers/normalize-answer-media"
import { removeUrlsFromStorage, removeAnswerMediaFromStorage } from "@/lib/answers/storage-cleanup"
import { NextResponse } from "next/server"

type RouteContext = { params: Promise<{ id: string }> }

async function canModifyAnswer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  answer: { author_id: string }
) {
  if (answer.author_id === userId) return true

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single()
  const role = profile?.role ?? "student"
  if (role === "superadmin") return true

  if (role === "admin") {
    const { data: author } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", answer.author_id)
      .single()
    const authorRole = author?.role ?? "student"
    return authorRole === "student"
  }

  return false
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const { id } = await context.params
  const supabase = await createClient()

  const { data, error } = await supabase.from("answers").select(ANSWER_SELECT).eq("id", id).single()

  if (error || !data) {
    return NextResponse.json({ error: "Answer not found" }, { status: 404 })
  }

  return NextResponse.json({ answer: mapAnswerRow(data as Record<string, unknown>) })
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const { id } = await context.params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const contentParsed = answerMediaBodySchema.safeParse(body)

  if (!contentParsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: contentParsed.error.flatten() },
      { status: 400 }
    )
  }

  const media = normalizeAnswerMediaInput({
    imageUrls: contentParsed.data.imageUrls,
    videoUrls: contentParsed.data.videoUrls,
    videoLinks: contentParsed.data.videoLinks,
  })
  const trimmedContent = contentParsed.data.content.trim()

  if (!hasAnswerBody(trimmedContent, media)) {
    return NextResponse.json({ error: "Answer must include text or media" }, { status: 400 })
  }

  const supabase = await createClient()
  const user = auth.user!

  const { data: existing } = await supabase
    .from("answers")
    .select("author_id, image_url, image_urls, video_urls, video_links, question_id")
    .eq("id", id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: "Answer not found" }, { status: 404 })
  }

  if (!(await canModifyAnswer(supabase, user.id, existing))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const oldImages = getAnswerImageUrls(existing)
  const oldVideos = getAnswerVideoUrls(existing)
  const mediaFields = toAnswerDbFields(media)
  const removedImages = oldImages.filter((u) => !mediaFields.image_urls.includes(u))
  const removedVideos = oldVideos.filter((u) => !mediaFields.video_urls.includes(u))
  await removeUrlsFromStorage(removedImages, removedVideos)

  const { data, error } = await supabase
    .from("answers")
    .update({
      content: trimmedContent,
      ...mediaFields,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(ANSWER_SELECT)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Failed to update answer" }, { status: 500 })
  }

  return NextResponse.json({ answer: mapAnswerRow(data as Record<string, unknown>) })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const { id } = await context.params
  const supabase = await createClient()
  const user = auth.user!

  const { data: existing } = await supabase
    .from("answers")
    .select("author_id, image_url, image_urls, video_urls, video_links")
    .eq("id", id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: "Answer not found" }, { status: 404 })
  }

  if (!(await canModifyAnswer(supabase, user.id, existing))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await removeAnswerMediaFromStorage(existing)

  const { error } = await supabase.from("answers").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to delete answer" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
