import { IMAGE_BUCKET, VIDEO_BUCKET } from "./constants"

export function extractStoragePath(
  publicUrl: string,
  bucket: typeof IMAGE_BUCKET | typeof VIDEO_BUCKET
): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.slice(idx + marker.length)
}

export function extractImagePath(url: string): string | null {
  return extractStoragePath(url, IMAGE_BUCKET)
}

export function extractVideoPath(url: string): string | null {
  return extractStoragePath(url, VIDEO_BUCKET)
}
