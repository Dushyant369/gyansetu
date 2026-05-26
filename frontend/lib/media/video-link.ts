import type { ParsedVideoLink, VideoPlatform } from "./types"

function safeHttpsUrl(raw: string): URL | null {
  try {
    const url = new URL(raw.trim())
    if (url.protocol !== "https:") return null
    return url
  } catch {
    return null
  }
}

function parseYouTube(url: URL): ParsedVideoLink | null {
  let id: string | null = null
  if (url.hostname.includes("youtu.be")) {
    id = url.pathname.slice(1).split("/")[0] || null
  } else if (url.pathname.startsWith("/watch")) {
    id = url.searchParams.get("v")
  } else if (url.pathname.startsWith("/embed/")) {
    id = url.pathname.split("/")[2] || null
  } else if (url.pathname.startsWith("/shorts/")) {
    id = url.pathname.split("/")[2] || null
  }
  if (!id) return null
  const watchUrl = `https://www.youtube.com/watch?v=${id}`
  return {
    platform: "youtube",
    watchUrl,
    embedUrl: `https://www.youtube.com/embed/${id}`,
  }
}

function parseVimeo(url: URL): ParsedVideoLink | null {
  const parts = url.pathname.split("/").filter(Boolean)
  const id = parts[0] === "video" ? parts[1] : parts[0]
  if (!id || !/^\d+$/.test(id)) return null
  const watchUrl = `https://vimeo.com/${id}`
  return {
    platform: "vimeo",
    watchUrl,
    embedUrl: `https://player.vimeo.com/video/${id}`,
  }
}

function parseLoom(url: URL): ParsedVideoLink | null {
  const match = url.pathname.match(/\/share\/([a-zA-Z0-9]+)/)
  const id = match?.[1]
  if (!id) return null
  const watchUrl = `https://www.loom.com/share/${id}`
  return {
    platform: "loom",
    watchUrl,
    embedUrl: `https://www.loom.com/embed/${id}`,
  }
}

function parseGoogleDrive(url: URL): ParsedVideoLink | null {
  const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/)
  const id = fileMatch?.[1] || url.searchParams.get("id")
  if (!id) {
    return { platform: "google_drive", watchUrl: url.href, embedUrl: null }
  }
  const watchUrl = `https://drive.google.com/file/d/${id}/view`
  return {
    platform: "google_drive",
    watchUrl,
    embedUrl: `https://drive.google.com/file/d/${id}/preview`,
  }
}

export function parseVideoLink(raw: string): ParsedVideoLink | null {
  const url = safeHttpsUrl(raw)
  if (!url) return null

  const host = url.hostname.toLowerCase()

  if (host.includes("youtube.com") || host.includes("youtu.be")) {
    return parseYouTube(url)
  }
  if (host.includes("vimeo.com")) {
    return parseVimeo(url)
  }
  if (host.includes("loom.com")) {
    return parseLoom(url)
  }
  if (host.includes("drive.google.com") || host.includes("docs.google.com")) {
    return parseGoogleDrive(url)
  }

  return {
    platform: "unknown",
    watchUrl: url.href,
    embedUrl: null,
  }
}

export function normalizeVideoLink(raw: string): string {
  const parsed = parseVideoLink(raw)
  return parsed?.watchUrl ?? raw.trim()
}

export function getPlatformLabel(platform: VideoPlatform): string {
  switch (platform) {
    case "youtube":
      return "YouTube"
    case "vimeo":
      return "Vimeo"
    case "google_drive":
      return "Google Drive"
    case "loom":
      return "Loom"
    default:
      return "Video link"
  }
}
