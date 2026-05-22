import { createClient } from "@/lib/supabase/client"

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export async function uploadEventImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Only JPEG, PNG, or WebP images are allowed")
  }
  if (file.size > MAX_SIZE) {
    throw new Error("Image must be 5MB or smaller")
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("You must be signed in to upload images")
  }

  const fileExt = file.name.split(".").pop() || "jpg"
  const filePath = `${user.id}/event-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage.from("event-images").upload(filePath, file, {
    cacheControl: "3600",
    upsert: true,
  })

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload image")
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("event-images").getPublicUrl(filePath)

  return publicUrl
}
