export type VideoPlatform = "youtube" | "vimeo" | "google_drive" | "loom" | "unknown"

export interface ParsedVideoLink {
  platform: VideoPlatform
  watchUrl: string
  embedUrl: string | null
}

export interface AnswerMediaInput {
  imageUrls?: string[]
  videoUrls?: string[]
  videoLinks?: string[]
}

export interface PendingImage {
  id: string
  file: File
  preview: string
}

export interface AnswerMediaFields {
  image_urls: string[]
  video_urls: string[]
  video_links: string[]
  image_url: string | null
}
