import { createClient } from "@/lib/supabase/client"
import {
  ALLOWED_IMAGE_TYPES,
  IMAGE_BUCKET,
  MAX_IMAGE_SIZE,
} from "./constants"

export function validateQuestionImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Only JPG, PNG, or WebP images are allowed."
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return "Image must be 5MB or smaller."
  }
  return null
}

/** Upload path: `{userId}/questions/...` — first folder must match auth.uid() for RLS */
export async function uploadQuestionImage(
  file: File,
  userId: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const validationError = validateQuestionImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  onProgress?.(10)
  const supabase = createClient()
  const fileExt = file.name.split(".").pop() || "jpg"
  const filePath = `${userId}/questions/${userId}-question-${Date.now()}.${fileExt}`

  onProgress?.(40)
  const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image")
  }

  onProgress?.(90)
  const {
    data: { publicUrl },
  } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath)

  onProgress?.(100)
  return publicUrl
}

/** Upload path: `{userId}/replies/...` */
export async function uploadReplyImage(file: File, userId: string): Promise<string> {
  const validationError = validateQuestionImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const supabase = createClient()
  const fileExt = file.name.split(".").pop() || "jpg"
  const filePath = `${userId}/replies/${userId}-reply-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image")
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath)

  return publicUrl
}
