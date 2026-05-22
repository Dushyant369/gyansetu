"use client"

import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Pin, User } from "lucide-react"
import type { EventWithCreator } from "@/lib/events/types"
import { EVENT_CATEGORY_LABELS } from "@/lib/events/types"
import { formatAbsoluteTime } from "@/lib/date"

interface EventDetailDialogProps {
  event: EventWithCreator | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventDetailDialog({ event, open, onOpenChange }: EventDetailDialogProps) {
  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8">{event.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap gap-2 items-center">
            <Badge variant="outline">{EVENT_CATEGORY_LABELS[event.category]}</Badge>
            {event.pinned && (
              <Badge variant="secondary" className="gap-1">
                <Pin className="w-3 h-3" />
                Pinned
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {event.image_url && (
          <div className="relative h-48 w-full rounded-lg overflow-hidden bg-muted">
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              sizes="512px"
              unoptimized
            />
          </div>
        )}

        <p className="text-sm text-foreground whitespace-pre-wrap">{event.description}</p>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatAbsoluteTime(event.starts_at, "EEEE, MMM d, yyyy · h:mm a")}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {event.venue}
          </p>
          <p className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Organizer: {event.organizer}
          </p>
        </div>

        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Created by {event.created_by_name || event.created_by_email || "Admin"} on{" "}
          {formatAbsoluteTime(event.created_at, "MMM d, yyyy h:mm a")}
        </p>
      </DialogContent>
    </Dialog>
  )
}
