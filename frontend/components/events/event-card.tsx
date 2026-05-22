"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Pin, User, Pencil, Trash2 } from "lucide-react"
import type { EventWithCreator } from "@/lib/events/types"
import { EVENT_CATEGORY_LABELS } from "@/lib/events/types"
import { formatAbsoluteTime } from "@/lib/date"

interface EventCardProps {
  event: EventWithCreator
  canManage: boolean
  onView: (event: EventWithCreator) => void
  onEdit: (event: EventWithCreator) => void
  onDelete: (event: EventWithCreator) => void
}

export function EventCard({ event, canManage, onView, onEdit, onDelete }: EventCardProps) {
  const excerpt =
    event.description.length > 120 ? `${event.description.slice(0, 120)}…` : event.description

  return (
    <Card
      className="overflow-hidden flex flex-col hover:shadow-lg transition-shadow cursor-pointer border-border/80"
      onClick={() => onView(event)}
    >
      {event.image_url ? (
        <div className="relative h-40 w-full bg-muted">
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        </div>
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
          <Calendar className="w-10 h-10 text-primary/40" />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground line-clamp-2">{event.title}</h3>
          {event.pinned && (
            <Badge variant="secondary" className="shrink-0 gap-1">
              <Pin className="w-3 h-3" />
              Pinned
            </Badge>
          )}
        </div>

        <Badge variant="outline" className="w-fit">
          {EVENT_CATEGORY_LABELS[event.category]}
        </Badge>

        <p className="text-sm text-muted-foreground line-clamp-2">{excerpt}</p>

        <div className="space-y-1.5 text-sm text-muted-foreground mt-auto">
          <p className="flex items-center gap-2">
            <Calendar className="w-4 h-4 shrink-0" />
            {formatAbsoluteTime(event.starts_at, "MMM d, yyyy · h:mm a")}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="line-clamp-1">{event.venue}</span>
          </p>
          <p className="flex items-center gap-2">
            <User className="w-4 h-4 shrink-0" />
            <span className="line-clamp-1">{event.organizer}</span>
          </p>
        </div>

        <p className="text-xs text-muted-foreground pt-1 border-t border-border">
          By {event.created_by_name || "Admin"} · {formatAbsoluteTime(event.created_at, "MMM d, yyyy")}
        </p>

        {canManage && (
          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEdit(event)}>
              <Pencil className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" className="flex-1" onClick={() => onDelete(event)}>
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
