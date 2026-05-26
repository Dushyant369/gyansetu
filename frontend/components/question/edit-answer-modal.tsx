"use client"

import { useEffect, useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { updateAnswer } from "@/app/question/[id]/edit-actions"
import { ImageUploadField } from "@/components/media/image-upload-field"
import { VideoUploadField } from "@/components/media/video-upload-field"
import { VideoLinkInput } from "@/components/media/video-link-input"
import { AnswerMediaDisplay } from "@/components/media/answer-media-display"
import { UploadProgress } from "@/components/media/upload-progress"
import type { PendingImage } from "@/lib/media/types"
import {
  getAnswerImageUrls,
  getAnswerVideoLinks,
  getAnswerVideoUrls,
} from "@/lib/answers/normalize-answer-media"
import { uploadAnswerMediaFiles } from "@/lib/answers/submit-answer-media"
import { hasAnswerBody, normalizeAnswerMediaInput } from "@/lib/answers/validation"

interface EditAnswerModalProps {
  answer: {
    id: string
    content: string
    image_url?: string | null
    image_urls?: string[] | null
    video_urls?: string[] | null
    video_links?: string[] | null
  }
  questionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditAnswerModal({
  answer,
  questionId,
  open,
  onOpenChange,
  onSuccess,
}: EditAnswerModalProps) {
  const [content, setContent] = useState(answer.content)
  const [keptImageUrls, setKeptImageUrls] = useState<string[]>([])
  const [keptVideoUrls, setKeptVideoUrls] = useState<string[]>([])
  const [videoLinks, setVideoLinks] = useState<string[]>([])
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [uploadLabel, setUploadLabel] = useState("")
  const [uploadPercent, setUploadPercent] = useState(0)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    setContent(answer.content)
    setKeptImageUrls(getAnswerImageUrls(answer))
    setKeptVideoUrls(getAnswerVideoUrls(answer))
    setVideoLinks(getAnswerVideoLinks(answer))
    setPendingImages([])
    setVideoFile(null)
    setVideoPreview(null)
  }, [open, answer])

  const busy = isPending || (uploadPercent > 0 && uploadPercent < 100)

  const handleSave = () => {
    const trimmed = content.trim()
    const hasNewMedia = pendingImages.length > 0 || videoFile !== null
    const hasKept =
      keptImageUrls.length > 0 || keptVideoUrls.length > 0 || videoLinks.length > 0

    if (!trimmed && !hasNewMedia && !hasKept) {
      toast({
        title: "Validation error",
        description: "Add answer text or keep/add media.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        setUploadPercent(0)
        let newMedia = normalizeAnswerMediaInput({})

        if (pendingImages.length > 0 || videoFile) {
          newMedia = normalizeAnswerMediaInput(
            await uploadAnswerMediaFiles({
            pendingImages,
            videoFile,
            videoLinks: [],
            onProgress: (label, percent) => {
              setUploadLabel(label)
              setUploadPercent(percent)
            },
          })
          )
        }

        const merged = normalizeAnswerMediaInput({
          imageUrls: [...keptImageUrls, ...newMedia.imageUrls ?? []],
          videoUrls: videoFile ? (newMedia.videoUrls ?? []) : keptVideoUrls,
          videoLinks,
        })

        if (!hasAnswerBody(trimmed, merged)) {
          throw new Error("Answer must include text or media")
        }

        await updateAnswer(answer.id, questionId, trimmed, merged)

        toast({
          title: "Answer updated",
          description: "Your answer has been updated successfully.",
        })
        onOpenChange(false)
        onSuccess()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update answer",
          variant: "destructive",
        })
      } finally {
        setUploadLabel("")
        setUploadPercent(0)
      }
    })
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Answer</DialogTitle>
          <DialogDescription>Update your answer text and media.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-answer-content">Content</Label>
            <Textarea
              id="edit-answer-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter answer content"
              rows={6}
              className="resize-none"
              disabled={busy}
            />
          </div>

          {(keptImageUrls.length > 0 || keptVideoUrls.length > 0) && (
            <div className="space-y-2">
              <Label>Current media</Label>
              <AnswerMediaDisplay
                answer={{
                  image_urls: keptImageUrls,
                  video_urls: keptVideoUrls,
                  video_links: [],
                }}
              />
              {keptImageUrls.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setKeptImageUrls([])}
                >
                  Remove all images
                </Button>
              )}
              {keptVideoUrls.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() => setKeptVideoUrls([])}
                >
                  Remove uploaded video
                </Button>
              )}
            </div>
          )}

          <ImageUploadField images={pendingImages} onChange={setPendingImages} disabled={busy} />
          <VideoUploadField
            file={videoFile}
            previewUrl={videoPreview}
            onChange={(f, preview) => {
              setVideoFile(f)
              setVideoPreview(preview)
              if (f) setKeptVideoUrls([])
            }}
            disabled={busy}
          />
          <VideoLinkInput links={videoLinks} onChange={setVideoLinks} disabled={busy} />
          <UploadProgress label={uploadLabel} percent={uploadPercent} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            {busy ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
