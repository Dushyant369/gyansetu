"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createAnswer } from "@/app/question/[id]/actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface AnswerFormProps {
  questionId: string
}

export function AnswerForm({ questionId }: AnswerFormProps) {
  const [content, setContent] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ content?: string; image?: string }>({})
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
    setContent("")
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
    setFieldErrors({})
  }

  const submitAnswer = async () => {
    setFieldErrors((prev) => ({ ...prev, content: undefined }))

    if (!content.trim()) {
      const message = "Answer content is required."
      setFieldErrors((prev) => ({ ...prev, content: message }))
      toast({
        title: "Invalid answer",
        description: message,
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
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
          const fileName = `${user.id}-answer-${Date.now()}.${fileExt}`
          const filePath = `answers/${fileName}`

          const { error: uploadError } = await supabase.storage.from("qa-images").upload(filePath, imageFile, {
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

        await createAnswer(questionId, content.trim(), uploadedImageUrl)
        toast({
          title: "Success",
          description: "Answer posted successfully!",
        })
        resetForm()
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to post answer"
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitAnswer()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      if (isPending || isUploading) return
      event.preventDefault()
      void submitAnswer()
    }
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="answer">Your Answer</Label>
          <Textarea
            id="answer"
            value={content}
            onChange={(e) => {
              if (fieldErrors.content) {
                setFieldErrors((prev) => ({ ...prev, content: undefined }))
              }
              setContent(e.target.value)
            }}
            placeholder="Write your answer here..."
            rows={6}
            disabled={isPending || isUploading}
            className={cn(
              "resize-none",
              fieldErrors.content && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
            )}
            aria-invalid={!!fieldErrors.content}
            onKeyDown={handleKeyDown}
          />
          {fieldErrors.content && <p className="text-red-500 text-sm mt-1">{fieldErrors.content}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="answer-image">Attach Image (optional)</Label>
          <div className="flex items-center gap-3">
            <Input
              id="answer-image"
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
        <Button type="submit" disabled={isPending || isUploading || !content.trim()}>
          {isPending || isUploading ? "Posting..." : "Post Answer"}
        </Button>
      </form>
    </Card>
  )
}

