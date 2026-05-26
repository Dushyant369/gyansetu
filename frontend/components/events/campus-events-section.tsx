"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, CalendarDays } from "lucide-react"
import type { EventWithCreator } from "@/lib/events/types"
import { EventCard } from "@/components/events/event-card"
import { EventDetailDialog } from "@/components/events/event-detail-dialog"
import { EventFormDialog } from "@/components/events/event-form-dialog"
import { EventsSkeleton } from "@/components/events/events-skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CampusEventsSectionProps {
  userRole: string
}

export function CampusEventsSection({ userRole }: CampusEventsSectionProps) {
  const canManage =
    userRole === "admin" || userRole === "superadmin" || userRole === "professor"
  const { toast } = useToast()

  const [events, setEvents] = useState<EventWithCreator[]>([])
  const [loading, setLoading] = useState(true)
  const [detailEvent, setDetailEvent] = useState<EventWithCreator | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventWithCreator | null>(null)
  const [deleteEvent, setDeleteEvent] = useState<EventWithCreator | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/events")
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to load events")
      }
      setEvents(json.events ?? [])
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load events",
        variant: "destructive",
      })
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleAdd = () => {
    setEditingEvent(null)
    setFormOpen(true)
  }

  const handleEdit = (event: EventWithCreator) => {
    setEditingEvent(event)
    setFormOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteEvent) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/events/${deleteEvent.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to delete event")
      }
      toast({ title: "Deleted", description: "Event removed successfully." })
      setDeleteEvent(null)
      await fetchEvents()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete event",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleFormSuccess = () => {
    toast({
      title: editingEvent ? "Updated" : "Created",
      description: editingEvent ? "Event updated successfully." : "Event created successfully.",
    })
    fetchEvents()
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-primary" />
            Campus Events
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Upcoming technical events, workshops, hackathons, and more
          </p>
        </div>
        {canManage && (
          <Button onClick={handleAdd} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>

      {loading ? (
        <EventsSkeleton />
      ) : events.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No upcoming events</p>
          <p className="text-sm text-muted-foreground mt-1">
            {canManage ? "Add an event to share it with the campus." : "Check back later for new events."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              canManage={canManage}
              onView={(e) => {
                setDetailEvent(e)
                setDetailOpen(true)
              }}
              onEdit={handleEdit}
              onDelete={(e) => setDeleteEvent(e)}
            />
          ))}
        </div>
      )}

      <EventDetailDialog event={detailEvent} open={detailOpen} onOpenChange={setDetailOpen} />

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        onSuccess={handleFormSuccess}
      />

      <AlertDialog open={Boolean(deleteEvent)} onOpenChange={(open) => !open && setDeleteEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{deleteEvent?.title}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
