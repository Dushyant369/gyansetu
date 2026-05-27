import { createClient } from "@/lib/supabase/client"
import {
  ALLOWED_VIDEO_TYPES,
  IMAGE_ANSWER_PREFIX,
  MAX_VIDEO_SIZE,
  VIDEO_BUCKET,
} from "./constants"

export function validateVideoFile(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type as (typeof ALLOWED_VIDEO_TYPES)[number])) {
    return "Only MP4, MOV, or WebM videos are allowed."
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return "Video must be 50MB or smaller."
  }
  return null
}

export async function uploadAnswerVideo(
  file: File,
  userId: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const validationError = validateVideoFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  onProgress?.(5)

  const supabase = createClient()
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "mp4"
  // Path MUST start with userId to satisfy RLS: auth.uid() = foldername(name)[1]
  const filePath = `${userId}/${IMAGE_ANSWER_PREFIX}/${userId}-video-${Date.now()}.${fileExt}`

  onProgress?.(25)

  const { error: uploadError } = await supabase.storage.from(VIDEO_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  })

  if (uploadError) {
    if (uploadError.message?.toLowerCase().includes("bucket")) {
      throw new Error(
        `Storage bucket "${VIDEO_BUCKET}" not found. Please run script 25-ensure-storage-buckets.sql in your Supabase SQL editor to create the required storage buckets.`
      )
    }
    throw new Error(uploadError.message || "Failed to upload video")
  }

  onProgress?.(90)

  const {
    data: { publicUrl },
  } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(filePath)

  onProgress?.(100)
  return publicUrl
}
