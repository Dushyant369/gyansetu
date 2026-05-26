"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MAX_IMAGES_PER_ANSWER } from "@/lib/media/constants"
import { validateImageFile } from "@/lib/media/upload-image"
import type { PendingImage } from "@/lib/media/types"
import { cn } from "@/lib/utils"
import { ImagePlus, X } from "lucide-react"

export type { PendingImage }

interface ImageUploadFieldProps {
  images: PendingImage[]
  onChange: (images: PendingImage[]) => void
  disabled?: boolean
  error?: string
}

export function ImageUploadField({ images, onChange, disabled, error }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState("")

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    setLocalError("")

    const next = [...images]
    for (const file of Array.from(files)) {
      if (next.length >= MAX_IMAGES_PER_ANSWER) {
        setLocalError(`Maximum ${MAX_IMAGES_PER_ANSWER} images allowed.`)
        break
      }
      const err = validateImageFile(file)
      if (err) {
        setLocalError(err)
        continue
      }
      next.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: URL.createObjectURL(file),
      })
    }
    onChange(next)
  }

  const removeImage = (id: string) => {
    const target = images.find((i) => i.id === id)
    if (target?.preview) URL.revokeObjectURL(target.preview)
    onChange(images.filter((i) => i.id !== id))
  }

  return (
    <div className="space-y-2">
      <Label>Images (optional)</Label>
      <div className="flex flex-wrap gap-2">
        <Input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          disabled={disabled || images.length >= MAX_IMAGES_PER_ANSWER}
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ""
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || images.length >= MAX_IMAGES_PER_ANSWER}
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="w-4 h-4 mr-2" />
          Add image
        </Button>
        <span className="text-xs text-muted-foreground self-center">
          JPG, PNG, WebP · max 5MB each · up to {MAX_IMAGES_PER_ANSWER}
        </span>
      </div>

      {(error || localError) && (
        <p className={cn("text-sm text-destructive")}>{error || localError}</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-video rounded-lg border border-border overflow-hidden bg-muted"
            >
              <Image
                src={img.preview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="200px"
                unoptimized
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-1 right-1 h-7 w-7"
                disabled={disabled}
                onClick={() => removeImage(img.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
