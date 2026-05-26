import { createClient } from "@/lib/supabase/client"
import { uploadAnswerImage } from "@/lib/media/upload-image"
import type { PendingImage } from "@/lib/media/types"
import { uploadAnswerVideo } from "@/lib/media/upload-video"
import type { AnswerMediaInput } from "@/lib/media/types"

export interface SubmitAnswerMediaOptions {
  pendingImages: PendingImage[]
  videoFile: File | null
  videoLinks: string[]
  onProgress?: (label: string, percent: number) => void
}

export async function uploadAnswerMediaFiles(
  options: SubmitAnswerMediaOptions
): Promise<AnswerMediaInput> {
  const supabase = createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error("You must be signed in to upload media.")
  }

  const imageUrls: string[] = []
  const totalImages = options.pendingImages.length

  for (let i = 0; i < totalImages; i++) {
    const img = options.pendingImages[i]
    const url = await uploadAnswerImage(img.file, user.id, (p) => {
      const base = (i / totalImages) * 50
      options.onProgress?.(`Image ${i + 1}`, Math.round(base + (p / 100) * (50 / totalImages)))
    })
    imageUrls.push(url)
  }

  let videoUrls: string[] = []
  if (options.videoFile) {
    const videoUrl = await uploadAnswerVideo(options.videoFile, user.id, (p) => {
      options.onProgress?.("Video", 50 + Math.round(p / 2))
    })
    videoUrls = [videoUrl]
  }

  options.onProgress?.("Done", 100)

  return {
    imageUrls,
    videoUrls,
    videoLinks: options.videoLinks,
  }
}
