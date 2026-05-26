"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MAX_VIDEO_LINKS_PER_ANSWER } from "@/lib/media/constants"
import { getPlatformLabel, parseVideoLink } from "@/lib/media/video-link"
import { Link2, X } from "lucide-react"

interface VideoLinkInputProps {
  links: string[]
  onChange: (links: string[]) => void
  disabled?: boolean
  error?: string
}

export function VideoLinkInput({ links, onChange, disabled, error }: VideoLinkInputProps) {
  const [draft, setDraft] = useState("")
  const [localError, setLocalError] = useState("")

  const addLink = () => {
    setLocalError("")
    const trimmed = draft.trim()
    if (!trimmed) return

    if (links.length >= MAX_VIDEO_LINKS_PER_ANSWER) {
      setLocalError(`Maximum ${MAX_VIDEO_LINKS_PER_ANSWER} links allowed.`)
      return
    }

    const parsed = parseVideoLink(trimmed)
    if (!parsed) {
      setLocalError("Enter a valid HTTPS video link (YouTube, Vimeo, Google Drive, or Loom).")
      return
    }

    if (links.includes(parsed.watchUrl)) {
      setLocalError("This link is already added.")
      return
    }

    onChange([...links, parsed.watchUrl])
    setDraft("")
  }

  const removeLink = (url: string) => {
    onChange(links.filter((l) => l !== url))
  }

  return (
    <div className="space-y-2">
      <Label>Video links (optional)</Label>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setLocalError("")
          }}
          placeholder="https://youtube.com/watch?v=..."
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addLink()
            }
          }}
        />
        <Button type="button" variant="outline" disabled={disabled} onClick={addLink}>
          <Link2 className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        YouTube, Vimeo, Google Drive, Loom · up to {MAX_VIDEO_LINKS_PER_ANSWER}
      </p>

      {(error || localError) && <p className="text-sm text-destructive">{error || localError}</p>}

      {links.length > 0 && (
        <ul className="space-y-2">
          {links.map((url) => {
            const parsed = parseVideoLink(url)
            return (
              <li
                key={url}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <Badge variant="outline" className="mb-1">
                    {parsed ? getPlatformLabel(parsed.platform) : "Link"}
                  </Badge>
                  <p className="text-xs text-muted-foreground truncate">{url}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={disabled}
                  onClick={() => removeLink(url)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
