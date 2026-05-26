export function getAnswerImageUrls(answer: {
  image_urls?: string[] | null
  image_url?: string | null
}): string[] {
  if (answer.image_urls && answer.image_urls.length > 0) {
    return answer.image_urls
  }
  if (answer.image_url) {
    return [answer.image_url]
  }
  return []
}

export function getAnswerVideoUrls(answer: { video_urls?: string[] | null }): string[] {
  return answer.video_urls ?? []
}

export function getAnswerVideoLinks(answer: { video_links?: string[] | null }): string[] {
  return answer.video_links ?? []
}
