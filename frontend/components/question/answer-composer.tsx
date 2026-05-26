"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ImageUploadField } from "@/components/media/image-upload-field"
import { VideoUploadField } from "@/components/media/video-upload-field"
import { VideoLinkInput } from "@/components/media/video-link-input"
import { UploadProgress } from "@/components/media/upload-progress"
import type { PendingImage } from "@/lib/media/types"
import { uploadAnswerMediaFiles } from "@/lib/answers/submit-answer-media"
import { createAnswer } from "@/app/question/[id]/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { hasAnswerBody, normalizeAnswerMediaInput } from "@/lib/answers/validation"

interface AnswerComposerProps {
  questionId: string
  onSuccess?: () => void
  onCancel?: () => void
  compact?: boolean
  className?: string
}

export function AnswerComposer({
  questionId,
  onSuccess,
  onCancel,
  compact = false,
  className,
}: AnswerComposerProps) {
  const [content, setContent] = useState("")
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoLinks, setVideoLinks] = useState<string[]>([])
  const [uploadLabel, setUploadLabel] = useState("")
  const [uploadPercent, setUploadPercent] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<{ content?: string }>({})
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const busy = isPending || (uploadPercent > 0 && uploadPercent < 100)

  const resetForm = () => {
    setContent("")
    pendingImages.forEach((img) => URL.revokeObjectURL(img.preview))
    setPendingImages([])
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoFile(null)
    setVideoPreview(null)
    setVideoLinks([])
    setUploadLabel("")
    setUploadPercent(0)
    setFieldErrors({})
  }

  const submit = async () => {
    const trimmed = content.trim()
    const hasMedia =
      pendingImages.length > 0 || videoFile !== null || videoLinks.length > 0

    if (!trimmed && !hasMedia) {
      const message = "Add answer text or attach images, video, or a video link."
      setFieldErrors({ content: message })
      toast({ title: "Invalid answer", description: message, variant: "destructive" })
      return
    }

    startTransition(async () => {
      try {
        setUploadPercent(0)
        const media = await uploadAnswerMediaFiles({
          pendingImages,
          videoFile,
          videoLinks,
          onProgress: (label, percent) => {
            setUploadLabel(label)
            setUploadPercent(percent)
          },
        })

        await createAnswer(questionId, trimmed, media)

        toast({ title: "Success", description: "Answer posted successfully!" })
        resetForm()
        onSuccess?.()
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to post answer"
        toast({ title: "Error", description: message, variant: "destructive" })
      } finally {
        setUploadLabel("")
        setUploadPercent(0)
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void submit()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (busy) return
      e.preventDefault()
      void submit()
    }
  }

  const canSubmit =
    content.trim().length > 0 ||
    pendingImages.length > 0 ||
    videoFile !== null ||
    videoLinks.length > 0

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor={`answer-${questionId}`}>Your Answer</Label>
        <Textarea
          id={`answer-${questionId}`}
          value={content}
          onChange={(e) => {
            setFieldErrors({})
            setContent(e.target.value)
          }}
          placeholder="Write your answer here..."
          rows={compact ? 4 : 6}
          disabled={busy}
          className={cn(
            "resize-none",
            fieldErrors.content && "border-red-500 focus-visible:ring-red-500"
          )}
          onKeyDown={handleKeyDown}
        />
        {fieldErrors.content && (
          <p className="text-red-500 text-sm">{fieldErrors.content}</p>
        )}
      </div>

      <ImageUploadField
        images={pendingImages}
        onChange={setPendingImages}
        disabled={busy}
      />

      <VideoUploadField
        file={videoFile}
        previewUrl={videoPreview}
        onChange={(f, preview) => {
          setVideoFile(f)
          setVideoPreview(preview)
        }}
        disabled={busy}
      />

      <VideoLinkInput links={videoLinks} onChange={setVideoLinks} disabled={busy} />

      <UploadProgress label={uploadLabel} percent={uploadPercent} />

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy || !canSubmit}>
          {busy ? "Posting…" : "Post Answer"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
