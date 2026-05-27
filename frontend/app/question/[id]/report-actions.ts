"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type ReportContentResult =
  | { success: true }
  | { success: false; error: string }

interface ReportContentParams {
  questionId?: string
  answerId?: string
  replyId?: string
  reason: string
}

async function resolveQuestionIdForRevalidate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: ReportContentParams
): Promise<string | null> {
  if (params.questionId) return params.questionId

  if (params.answerId) {
    const { data } = await supabase
      .from("answers")
      .select("question_id")
      .eq("id", params.answerId)
      .maybeSingle()
    return data?.question_id ?? null
  }

  if (params.replyId) {
    const { data: reply } = await supabase
      .from("replies")
      .select("answer_id")
      .eq("id", params.replyId)
      .maybeSingle()
    if (!reply?.answer_id) return null
    const { data: answer } = await supabase
      .from("answers")
      .select("question_id")
      .eq("id", reply.answer_id)
      .maybeSingle()
    return answer?.question_id ?? null
  }

  return null
}

export async function reportContent({
  questionId,
  answerId,
  replyId,
  reason,
}: ReportContentParams): Promise<ReportContentResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { success: false, error: "You must be signed in to report content" }
    }

    const trimmedReason = reason?.trim()
    if (!trimmedReason) {
      return { success: false, error: "Reason is required" }
    }

    if (!questionId && !answerId && !replyId) {
      return { success: false, error: "Missing content to report" }
    }

    let existingQuery = supabase
      .from("moderation_reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("status", "pending")

    if (questionId) existingQuery = existingQuery.eq("question_id", questionId)
    if (answerId) existingQuery = existingQuery.eq("answer_id", answerId)
    if (replyId) existingQuery = existingQuery.eq("reply_id", replyId)

    const { data: existingReport, error: existingError } = await existingQuery.maybeSingle()

    if (existingError && existingError.code !== "PGRST116") {
      console.error("reportContent existing check:", existingError)
    }

    if (existingReport) {
      return {
        success: false,
        error: "You have already reported this content. Please wait for moderator review.",
      }
    }

    const insertPayload: Record<string, unknown> = {
      reporter_id: user.id,
      question_id: questionId ?? null,
      answer_id: answerId ?? null,
      reason: trimmedReason,
      status: "pending",
    }

    if (replyId) {
      insertPayload.reply_id = replyId
    }

    const { error: insertError } = await supabase.from("moderation_reports").insert(insertPayload)

    if (insertError) {
      console.error("reportContent insert:", insertError)
      if (insertError.code === "42P01") {
        return {
          success: false,
          error: "Reporting is not set up yet. Contact an administrator.",
        }
      }
      if (insertError.message?.includes("reply_id")) {
        const { error: retryError } = await supabase.from("moderation_reports").insert({
          reporter_id: user.id,
          question_id: questionId ?? null,
          answer_id: answerId ?? null,
          reason: trimmedReason,
          status: "pending",
        })
        if (retryError) {
          return { success: false, error: retryError.message || "Failed to submit report" }
        }
      } else {
        return { success: false, error: insertError.message || "Failed to submit report" }
      }
    }

    const revalidateQuestionId = await resolveQuestionIdForRevalidate(supabase, {
      questionId,
      answerId,
      replyId,
      reason: trimmedReason,
    })
    if (revalidateQuestionId) {
      revalidatePath(`/question/${revalidateQuestionId}`)
    }

    return { success: true }
  } catch (err) {
    console.error("reportContent unexpected:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to submit report",
    }
  }
}
