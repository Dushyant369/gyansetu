"use client"

import Image from "next/image"
import Link from "next/link"
import {
  getAnswerImageUrls,
  getAnswerVideoLinks,
  getAnswerVideoUrls,
} from "@/lib/answers/normalize-answer-media"
import { getPlatformLabel, parseVideoLink } from "@/lib/media/video-link"
import { ExternalLink } from "lucide-react"

interface AnswerMediaDisplayProps {
  answer: {
    image_url?: string | null
    image_urls?: string[] | null
    video_urls?: string[] | null
    video_links?: string[] | null
  }
}

export function AnswerMediaDisplay({ answer }: AnswerMediaDisplayProps) {
  const images = getAnswerImageUrls(answer)
  const videos = getAnswerVideoUrls(answer)
  const links = getAnswerVideoLinks(answer)

  if (images.length === 0 && videos.length === 0 && links.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div
          className={
            images.length > 1
              ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
              : "space-y-2"
          }
        >
          {images.map((url) => (
            <div
              key={url}
              className="overflow-hidden rounded-lg border border-border bg-card/80"
            >
              <Image
                src={url}
                alt="Answer attachment"
                width={1200}
                height={800}
                loading="lazy"
                className="w-full h-auto object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
            </div>
          ))}
        </div>
      )}

      {videos.map((url) => (
        <video
          key={url}
          src={url}
          controls
          preload="metadata"
          playsInline
          className="w-full max-w-2xl rounded-lg border border-border bg-black"
        />
      ))}

      {links.map((url) => {
        const parsed = parseVideoLink(url)
        if (parsed?.embedUrl) {
          return (
            <div key={url} className="space-y-2">
              <div className="relative w-full aspect-video max-w-2xl rounded-lg overflow-hidden border border-border bg-muted">
                <iframe
                  src={parsed.embedUrl}
                  title={getPlatformLabel(parsed.platform)}
                  className="absolute inset-0 w-full h-full"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <Link
                href={parsed.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                Open on {getPlatformLabel(parsed.platform)}
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )
        }

        return (
          <Link
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            {parsed ? `${getPlatformLabel(parsed.platform)} video` : "Video link"}
          </Link>
        )
      })}
    </div>
  )
}
