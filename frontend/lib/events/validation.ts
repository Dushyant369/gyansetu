import { z } from "zod"
import { EVENT_CATEGORIES } from "./types"

export const eventCategorySchema = z.enum(EVENT_CATEGORIES)

export const createEventSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(5000),
  category: eventCategorySchema,
  starts_at: z
    .string()
    .min(1)
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: "Invalid date/time" }),
  venue: z.string().trim().min(2).max(300),
  image_url: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  organizer: z.string().trim().min(2).max(200),
  pinned: z.boolean().optional().default(false),
})

export const updateEventSchema = createEventSchema.partial()

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
