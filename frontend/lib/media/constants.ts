export const IMAGE_BUCKET = "qa-images"
export const VIDEO_BUCKET = "qa-videos"
export const IMAGE_ANSWER_PREFIX = "answers"

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024
export const MAX_IMAGES_PER_ANSWER = 4
export const MAX_VIDEOS_PER_ANSWER = 1
export const MAX_VIDEO_LINKS_PER_ANSWER = 5
