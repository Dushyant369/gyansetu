import {
  getAnswerImageUrls,
  getAnswerVideoLinks,
  getAnswerVideoUrls,
} from "./normalize-answer-media"

export const ANSWER_SELECT = `
  id,
  question_id,
  author_id,
  content,
  image_url,
  image_urls,
  video_urls,
  video_links,
  upvotes,
  downvotes,
  is_accepted,
  created_at,
  updated_at,
  upvoted_by
`

export function mapAnswerRow(row: Record<string, unknown>) {
  const base = {
    id: row.id as string,
    question_id: row.question_id as string,
    author_id: row.author_id as string,
    content: row.content as string,
    image_url: (row.image_url as string | null) ?? null,
    image_urls: (row.image_urls as string[] | null) ?? null,
    video_urls: (row.video_urls as string[] | null) ?? null,
    video_links: (row.video_links as string[] | null) ?? null,
    upvotes: row.upvotes as number | undefined,
    downvotes: row.downvotes as number | undefined,
    is_accepted: Boolean(row.is_accepted),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    upvoted_by: (row.upvoted_by as string[] | null) ?? null,
  }

  return {
    ...base,
    resolvedImageUrls: getAnswerImageUrls(base),
    resolvedVideoUrls: getAnswerVideoUrls(base),
    resolvedVideoLinks: getAnswerVideoLinks(base),
  }
}
