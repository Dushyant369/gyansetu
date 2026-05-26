import { z } from "zod"
import { parseVideoLink } from "@/lib/media/video-link"
import {
  MAX_IMAGES_PER_ANSWER,
  MAX_VIDEO_LINKS_PER_ANSWER,
  MAX_VIDEOS_PER_ANSWER,
} from "@/lib/media/constants"

const httpsUrl = z
  .string()
  .url()
  .refine((u) => u.startsWith("https://"), { message: "URL must use HTTPS" })

export const answerMediaSchema = z.object({
  imageUrls: z.array(httpsUrl).max(MAX_IMAGES_PER_ANSWER).default([]),
  videoUrls: z.array(httpsUrl).max(MAX_VIDEOS_PER_ANSWER).default([]),
  videoLinks: z
    .array(z.string().trim().min(1))
    .max(MAX_VIDEO_LINKS_PER_ANSWER)
    .default([])
    .superRefine((links, ctx) => {
      links.forEach((link, i) => {
        if (!parseVideoLink(link)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Invalid or unsupported video link",
            path: [i],
          })
        }
      })
    }),
})

export const answerMediaBodySchema = z.object({
  content: z.string().trim().max(10000).default(""),
  imageUrls: z.array(httpsUrl).max(MAX_IMAGES_PER_ANSWER).optional(),
  videoUrls: z.array(httpsUrl).max(MAX_VIDEOS_PER_ANSWER).optional(),
  videoLinks: z.array(z.string().trim()).max(MAX_VIDEO_LINKS_PER_ANSWER).optional(),
})

export const createAnswerBodySchema = answerMediaBodySchema.extend({
  questionId: z.string().uuid(),
})

export function normalizeAnswerMediaInput(input: {
  imageUrls?: string[]
  videoUrls?: string[]
  videoLinks?: string[]
}) {
  const imageUrls = (input.imageUrls ?? []).filter(Boolean)
  const videoUrls = (input.videoUrls ?? []).filter(Boolean)
  const videoLinks = (input.videoLinks ?? [])
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parsed = parseVideoLink(l)
      return parsed?.watchUrl ?? l
    })

  return { imageUrls, videoUrls, videoLinks }
}

export function hasAnswerBody(content: string, media: ReturnType<typeof normalizeAnswerMediaInput>): boolean {
  return (
    content.trim().length > 0 ||
    media.imageUrls.length > 0 ||
    media.videoUrls.length > 0 ||
    media.videoLinks.length > 0
  )
}

export function toAnswerDbFields(media: ReturnType<typeof normalizeAnswerMediaInput>) {
  const image_url = media.imageUrls[0] ?? null
  return {
    image_urls: media.imageUrls,
    video_urls: media.videoUrls,
    video_links: media.videoLinks,
    image_url,
  }
}
