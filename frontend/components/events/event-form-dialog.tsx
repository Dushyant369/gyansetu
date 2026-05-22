"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createEventSchema, type CreateEventInput } from "@/lib/events/validation"
import { EVENT_CATEGORIES, EVENT_CATEGORY_LABELS, type EventWithCreator } from "@/lib/events/types"
import { uploadEventImage } from "@/lib/events/upload-event-image"

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface EventFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event?: EventWithCreator | null
  onSuccess: () => void
}

export function EventFormDialog({ open, onOpenChange, event, onSuccess }: EventFormDialogProps) {
  const isEdit = Boolean(event)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "technical",
      starts_at: "",
      venue: "",
      organizer: "",
      pinned: false,
      image_url: null,
    },
  })

  const category = watch("category")
  const pinned = watch("pinned")

  useEffect(() => {
    if (!open) return
    setFormError("")
    setImageFile(null)
    if (event) {
      reset({
        title: event.title,
        description: event.description,
        category: event.category,
        starts_at: toDatetimeLocalValue(event.starts_at),
        venue: event.venue,
        organizer: event.organizer,
        pinned: event.pinned,
        image_url: event.image_url,
      })
    } else {
      reset({
        title: "",
        description: "",
        category: "technical",
        starts_at: "",
        venue: "",
        organizer: "",
        pinned: false,
        image_url: null,
      })
    }
  }, [open, event, reset])

  const onSubmit = async (data: CreateEventInput) => {
    setSubmitting(true)
    setFormError("")
    try {
      let imageUrl = data.image_url ?? null
      if (imageFile) {
        imageUrl = await uploadEventImage(imageFile)
      }

      const startsAt = new Date(data.starts_at).toISOString()
      const body = {
        ...data,
        starts_at: startsAt,
        image_url: imageUrl,
      }

      const url = isEdit ? `/api/events/${event!.id}` : "/api/events"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to save event")
      }

      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save event")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Event" : "Add Event"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update campus event details." : "Create a new campus event for students to view."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} {...register("description")} />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setValue("category", v as CreateEventInput["category"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {EVENT_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="starts_at">Date & time</Label>
            <Input id="starts_at" type="datetime-local" {...register("starts_at")} />
            {errors.starts_at && (
              <p className="text-sm text-destructive">{errors.starts_at.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue">Venue</Label>
            <Input id="venue" {...register("venue")} />
            {errors.venue && <p className="text-sm text-destructive">{errors.venue.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizer">Organizer</Label>
            <Input id="organizer" {...register("organizer")} />
            {errors.organizer && (
              <p className="text-sm text-destructive">{errors.organizer.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner">Banner image (optional)</Label>
            <Input
              id="banner"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="pinned">Pin event</Label>
              <p className="text-xs text-muted-foreground">Pinned events appear first</p>
            </div>
            <Switch
              id="pinned"
              checked={pinned}
              onCheckedChange={(v) => setValue("pinned", v)}
            />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
