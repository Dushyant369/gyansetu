"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

interface ReportContentParams {
  questionId?: string
  answerId?: string
  replyId?: string
  reason: string
}

export async function reportContent({ questionId, answerId, replyId, reason }: ReportContentParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  if (!reason || !reason.trim()) {
    throw new Error("Reason is required")
  }

  if (!questionId && !answerId && !replyId) {
    throw new Error("Either questionId, answerId, or replyId must be provided")
  }

  // Check if user already reported this content
  const existingReportQuery = supabase.from("moderation_reports").select("id")

  if (questionId) {
    existingReportQuery.eq("question_id", questionId)
  }
  if (answerId) {
    existingReportQuery.eq("answer_id", answerId)
  }
  if (replyId) {
    existingReportQuery.eq("reply_id", replyId)
  }
  existingReportQuery.eq("reporter_id", user.id).eq("status", "pending")

  const { data: existingReport } = await existingReportQuery.single()

  if (existingReport) {
    throw new Error("You have already reported this content. Please wait for moderator review.")
  }

  // Create report
  const { error } = await supabase.from("moderation_reports").insert({
    reporter_id: user.id,
    question_id: questionId || null,
    answer_id: answerId || null,
    reply_id: replyId || null,
    reason: reason.trim(),
    status: "pending",
  })

  if (error) {
    throw new Error(error.message || "Failed to submit report")
  }

  if (questionId) {
    revalidatePath(`/question/${questionId}`)
  }
  if (answerId) {
    revalidatePath(`/question/[id]`, "page")
  }

  return { success: true }
}

