import { createClient } from "@/lib/supabase/server"
import { extractImagePath, extractVideoPath } from "@/lib/media/extract-storage-path"
import { IMAGE_BUCKET, VIDEO_BUCKET } from "@/lib/media/constants"

export async function removeAnswerMediaFromStorage(answer: {
  image_url?: string | null
  image_urls?: string[] | null
  video_urls?: string[] | null
}) {
  const supabase = await createClient()

  const imageUrls = new Set<string>()
  if (answer.image_url) imageUrls.add(answer.image_url)
  ;(answer.image_urls ?? []).forEach((u) => imageUrls.add(u))

  const imagePaths = [...imageUrls]
    .map((u) => extractImagePath(u))
    .filter((p): p is string => Boolean(p))

  if (imagePaths.length > 0) {
    await supabase.storage.from(IMAGE_BUCKET).remove(imagePaths)
  }

  const videoPaths = (answer.video_urls ?? [])
    .map((u) => extractVideoPath(u))
    .filter((p): p is string => Boolean(p))

  if (videoPaths.length > 0) {
    await supabase.storage.from(VIDEO_BUCKET).remove(videoPaths)
  }
}

export async function removeUrlsFromStorage(imageUrls: string[], videoUrls: string[]) {
  const supabase = await createClient()

  const imagePaths = imageUrls
    .map((u) => extractImagePath(u))
    .filter((p): p is string => Boolean(p))
  if (imagePaths.length > 0) {
    await supabase.storage.from(IMAGE_BUCKET).remove(imagePaths)
  }

  const videoPaths = videoUrls
    .map((u) => extractVideoPath(u))
    .filter((p): p is string => Boolean(p))
  if (videoPaths.length > 0) {
    await supabase.storage.from(VIDEO_BUCKET).remove(videoPaths)
  }
}
