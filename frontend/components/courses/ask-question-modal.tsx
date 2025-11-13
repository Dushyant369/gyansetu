"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { createQuestion } from "@/app/courses/[id]/questions/actions"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface AskQuestionModalProps {
  courseId: string
}

export function AskQuestionModal({ courseId }: AskQuestionModalProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; image?: string }>({})
  const { toast } = useToast()
  const router = useRouter()

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      setFieldErrors((prev) => ({ ...prev, image: undefined }))
      return
    }

    const allowedTypes = ["image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      const message = "Only JPG or PNG images under 5MB are allowed."
      toast({
        title: "Invalid image",
        description: message,
        variant: "destructive",
      })
      setFieldErrors((prev) => ({ ...prev, image: message }))
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
      setImageFile(null)
      setImagePreview(null)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImageFile(file)
    setImagePreview(previewUrl)
    setFieldErrors((prev) => ({ ...prev, image: undefined }))
  }

  const resetForm = () => {
    setOpen(false)
    setTitle("")
    setContent("")
    setTags("")
    setIsAnonymous(false)
    setFieldErrors({})
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFieldErrors({})
    const errors: typeof fieldErrors = {}

    if (!title.trim()) {
      errors.title = "Question title is required."
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast({
        title: "Invalid question",
        description: errors.title || "Please correct the highlighted fields.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const tagsArray = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)

        let uploadedImageUrl: string | null = null

        if (imageFile) {
          setIsUploading(true)
          const supabase = createClient()
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser()

          if (userError || !user) {
            throw new Error("You must be signed in to upload images.")
          }

          const fileExt = imageFile.name.split(".").pop() || "jpg"
          const fileName = `${user.id}-question-${Date.now()}.${fileExt}`
          const filePath = `questions/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from("qa-images")
            .upload(filePath, imageFile, {
              cacheControl: "3600",
              upsert: true,
            })

          if (uploadError) {
            throw new Error(uploadError.message || "Failed to upload image")
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("qa-images").getPublicUrl(filePath)

          uploadedImageUrl = publicUrl
        }

        await createQuestion(courseId, title.trim(), content.trim(), tagsArray, isAnonymous, uploadedImageUrl)

        toast({
          title: "Success",
          description: "Question posted successfully!",
        })

        resetForm()
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to post question",
          variant: "destructive",
        })
        } finally {
          setIsUploading(false)
        }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          resetForm()
        } else {
          setOpen(true)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Ask a Question
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
            <DialogDescription>Share your question with the course community</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Question Title *</Label>
              <Input
                id="title"
                value={title}
                  onChange={(e) => {
                    if (fieldErrors.title) {
                      setFieldErrors((prev) => ({ ...prev, title: undefined }))
                    }
                    setTitle(e.target.value)
                  }}
                placeholder="What is your question?"
                required
                  disabled={isPending || isUploading}
                  className={cn(
                    fieldErrors.title && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                  )}
                  aria-invalid={!!fieldErrors.title}
              />
                {fieldErrors.title && <p className="text-red-500 text-sm mt-1">{fieldErrors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Description</Label>
              <Textarea
                id="content"
                value={content}
                  onChange={(e) => setContent(e.target.value)}
                placeholder="Provide additional context and details..."
                rows={6}
                  disabled={isPending || isUploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                  onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., homework, exam, concept"
                  disabled={isPending || isUploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question-image">Attach Image (optional)</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="question-image"
                  type="file"
                  accept="image/png,image/jpeg"
                    disabled={isPending || isUploading}
                  onChange={handleImageChange}
                    className={cn(
                      fieldErrors.image && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                    )}
                    aria-invalid={!!fieldErrors.image}
                />
                {imageFile && (
                  <span className="text-xs text-muted-foreground">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                )}
              </div>
                {fieldErrors.image && <p className="text-red-500 text-sm mt-1">{fieldErrors.image}</p>}
              {imagePreview && (
                <div className="relative mt-2 w-full max-w-sm overflow-hidden rounded-lg border border-border">
                  <Image
                    src={imagePreview}
                    alt="Image preview"
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
                      if (imagePreview) {
                        URL.revokeObjectURL(imagePreview)
                      }
                      setImageFile(null)
                      setImagePreview(null)
                      setFieldErrors((prev) => ({ ...prev, image: undefined }))
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Supported formats: JPG, PNG. Max size 5MB.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                disabled={isPending || isUploading}
              />
              <Label htmlFor="anonymous" className="text-sm font-normal cursor-pointer">
                Post anonymously
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isPending || isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || isUploading || !title.trim()}>
              {isPending || isUploading ? "Posting..." : "Post Question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

