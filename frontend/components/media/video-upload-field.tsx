"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateVideoFile } from "@/lib/media/upload-video"
import { Video, X } from "lucide-react"

interface VideoUploadFieldProps {
  file: File | null
  previewUrl: string | null
  onChange: (file: File | null, previewUrl: string | null) => void
  disabled?: boolean
  error?: string
}

export function VideoUploadField({
  file,
  previewUrl,
  onChange,
  disabled,
  error,
}: VideoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState("")

  const handleFile = (selected: File | null) => {
    setLocalError("")
    if (previewUrl) URL.revokeObjectURL(previewUrl)

    if (!selected) {
      onChange(null, null)
      return
    }

    const err = validateVideoFile(selected)
    if (err) {
      setLocalError(err)
      onChange(null, null)
      return
    }

    onChange(selected, URL.createObjectURL(selected))
  }

  return (
    <div className="space-y-2">
      <Label>Video file (optional)</Label>
      <Input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Video className="w-4 h-4 mr-2" />
          {file ? "Replace video" : "Upload video"}
        </Button>
        {file && (
          <>
            <span className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => {
                handleFile(null)
                if (inputRef.current) inputRef.current.value = ""
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </>
        )}
        <span className="text-xs text-muted-foreground">MP4, MOV, WebM · max 50MB</span>
      </div>

      {(error || localError) && <p className="text-sm text-destructive">{error || localError}</p>}

      {previewUrl && (
        <video
          src={previewUrl}
          controls
          preload="metadata"
          className="w-full max-w-md rounded-lg border border-border bg-black"
        />
      )}
    </div>
  )
}
