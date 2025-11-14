"use client"

import { useState, useTransition } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { updateQuestion } from "@/app/question/[id]/edit-actions"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

interface EditQuestionModalProps {
  question: {
    id: string
    title: string
    content: string | null
    image_url?: string | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditQuestionModal({ question, open, onOpenChange, onSuccess }: EditQuestionModalProps) {
  const [title, setTitle] = useState(question.title)
  const [content, setContent] = useState(question.content || "")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(question.image_url || null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImageFile(null)
      if (imagePreview && imagePreview !== question.image_url) {
        URL.revokeObjectURL(imagePreview)
      }
      setImagePreview(question.image_url || null)
      return
    }

    const allowedTypes = ["image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({
        title: "Invalid image",
        description: "Only JPG or PNG images under 5MB are allowed.",
        variant: "destructive",
      })
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImageFile(file)
    setImagePreview(previewUrl)
  }

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Validation error",
        description: "Title and content are required.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        // Note: Image update would require a separate updateQuestionImage action
        // For now, we'll just update title and content
        await updateQuestion(question.id, title.trim(), content.trim())
        toast({
          title: "Question updated",
          description: "Your question has been updated successfully.",
        })
        onOpenChange(false)
        onSuccess()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update question",
          variant: "destructive",
        })
      }
    })
  }

  const handleClose = () => {
    setTitle(question.title)
    setContent(question.content || "")
    if (imagePreview && imagePreview !== question.image_url) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(question.image_url || null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
          <DialogDescription>Update your question title and content.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-question-title">Title</Label>
            <Input
              id="edit-question-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter question title"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-question-content">Content</Label>
            <Textarea
              id="edit-question-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter question content"
              rows={8}
              className="resize-none"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-question-image">Image (optional)</Label>
            {question.image_url && !imageFile && (
              <div className="relative mt-2 w-full max-w-md overflow-hidden rounded-lg border border-border">
                <Image
                  src={question.image_url}
                  alt="Current question image"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
                <p className="text-xs text-muted-foreground mt-1">Current image (image updates coming soon)</p>
              </div>
            )}
            {imagePreview && imagePreview !== question.image_url && (
              <div className="relative mt-2 w-full max-w-md overflow-hidden rounded-lg border border-border">
                <Image
                  src={imagePreview}
                  alt="New image preview"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur"
                  onClick={() => {
                    if (imagePreview && imagePreview !== question.image_url) {
                      URL.revokeObjectURL(imagePreview)
                    }
                    setImageFile(null)
                    setImagePreview(question.image_url || null)
                  }}
                  disabled={isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Note: Image editing will be available in a future update.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !title.trim() || !content.trim()}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

