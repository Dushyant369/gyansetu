import type { SupabaseClient } from "@supabase/supabase-js"
import { hasAnswerBody, normalizeAnswerMediaInput, toAnswerDbFields } from "@/lib/answers/validation"
import type { AnswerMediaInput } from "@/lib/media/types"

export type CreateAnswerMediaArg = AnswerMediaInput | string | null | undefined

export function resolveAnswerMedia(media?: CreateAnswerMediaArg): ReturnType<typeof normalizeAnswerMediaInput> {
  if (typeof media === "string") {
    return normalizeAnswerMediaInput({ imageUrls: media ? [media] : [] })
  }
  return normalizeAnswerMediaInput(media ?? {})
}

function isMissingColumnError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  if (error.code === "PGRST204") return true
  const msg = (error.message ?? "").toLowerCase()
  return msg.includes("could not find") && msg.includes("column")
}

function buildInsertPayloads(
  questionId: string,
  authorId: string,
  content: string,
  media: ReturnType<typeof normalizeAnswerMediaInput>
): Record<string, unknown>[] {
  const base = {
    question_id: questionId,
    author_id: authorId,
    content: content || "",
  }

  const full = toAnswerDbFields(media)
  const payloads: Record<string, unknown>[] = []

  const hasMedia =
    full.image_urls.length > 0 || full.video_urls.length > 0 || full.video_links.length > 0

  if (hasMedia) {
    payloads.push({ ...base, ...full })
  }

  if (full.image_url) {
    payloads.push({ ...base, image_url: full.image_url })
  }

  payloads.push({ ...base })
  return payloads
}

const SELECT_FULL =
  "id, question_id, author_id, content, is_accepted, created_at, updated_at, image_url, image_urls, video_urls, video_links"

const SELECT_MINIMAL =
  "id, question_id, author_id, content, is_accepted, created_at, updated_at, image_url"

export type InsertedAnswerRow = {
  id: string
  question_id: string
  author_id: string
  content: string
  is_accepted: boolean
  created_at: string
  updated_at: string
  image_url?: string | null
  image_urls?: string[] | null
  video_urls?: string[] | null
  video_links?: string[] | null
}

async function fetchAnswerRow(
  supabase: SupabaseClient,
  answerId: string
): Promise<InsertedAnswerRow | null> {
  const { data: full, error: fullErr } = await supabase
    .from("answers")
    .select(SELECT_FULL)
    .eq("id", answerId)
    .single()

  if (!fullErr && full) return full as InsertedAnswerRow

  if (!isMissingColumnError(fullErr)) {
    return null
  }

  const { data: minimal, error: minErr } = await supabase
    .from("answers")
    .select(SELECT_MINIMAL)
    .eq("id", answerId)
    .single()

  if (!minErr && minimal) return minimal as InsertedAnswerRow
  return null
}

export async function insertAnswerWithFallback(
  supabase: SupabaseClient,
  questionId: string,
  authorId: string,
  content: string,
  media?: CreateAnswerMediaArg
): Promise<{ data: InsertedAnswerRow; usedMediaColumns: "full" | "image_url" | "none" }> {
  const trimmedContent = (content ?? "").trim()
  const normalizedMedia = resolveAnswerMedia(media)

  if (!hasAnswerBody(trimmedContent, normalizedMedia)) {
    throw new Error("Add answer text or attach images, video, or a video link")
  }

  const payloads = buildInsertPayloads(questionId, authorId, trimmedContent, normalizedMedia)
  let lastError: { code?: string; message?: string } | null = null

  for (let i = 0; i < payloads.length; i++) {
    const payload = payloads[i]
    const { data: inserted, error: insertError } = await supabase
      .from("answers")
      .insert(payload)
      .select("id")
      .single()

    if (insertError || !inserted?.id) {
      lastError = insertError
      if (!isMissingColumnError(insertError)) {
        break
      }
      continue
    }

    const row = await fetchAnswerRow(supabase, inserted.id as string)
    if (!row) {
      lastError = { message: "Answer created but could not be loaded" }
      break
    }

    const usedMediaColumns: "full" | "image_url" | "none" =
      i === 0 && Object.prototype.hasOwnProperty.call(payload, "image_urls")
        ? "full"
        : Object.prototype.hasOwnProperty.call(payload, "image_url")
          ? "image_url"
          : "none"

    return { data: row, usedMediaColumns }
  }

  if (lastError?.code === "42501") {
    throw new Error("Permission denied. Please check your account permissions.")
  }
  if (lastError?.code === "23503") {
    throw new Error("Invalid question or user reference.")
  }
  if (lastError?.code === "23505") {
    throw new Error("This answer already exists.")
  }
  throw new Error(lastError?.message || "Failed to create answer. Please try again.")
}

export function serializeAnswerForClient(data: InsertedAnswerRow) {
  return {
    id: data.id,
    question_id: data.question_id,
    author_id: data.author_id,
    content: data.content ?? "",
    is_accepted: Boolean(data.is_accepted),
    created_at: String(data.created_at ?? ""),
    updated_at: String(data.updated_at ?? ""),
    image_url: data.image_url ?? null,
    image_urls: data.image_urls ?? null,
    video_urls: data.video_urls ?? null,
    video_links: data.video_links ?? null,
  }
}
