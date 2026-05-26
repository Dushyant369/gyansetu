"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Video, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { isContentManagerRole } from "@/lib/auth/require-content-manager"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Lecture {
  id: string
  title: string
  description: string | null
  subject: string | null
  video_link: string | null
  file_urls: string[]
  created_at: string
}

interface LecturesSectionProps {
  userRole: string
}

export function LecturesSection({ userRole }: LecturesSectionProps) {
  const canManage = isContentManagerRole(userRole)
  const { toast } = useToast()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [videoLink, setVideoLink] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchLectures = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/lectures")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load lectures")
      setLectures(json.lectures ?? [])
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load lectures",
        variant: "destructive",
      })
      setLectures([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchLectures()
  }, [fetchLectures])

  const handleCreate = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          subject: subject.trim() || null,
          video_link: videoLink.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create lecture")
      toast({ title: "Lecture created" })
      setFormOpen(false)
      setTitle("")
      setDescription("")
      setSubject("")
      setVideoLink("")
      fetchLectures()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/lectures/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Failed to delete")
      }
      setLectures((prev) => prev.filter((l) => l.id !== id))
      toast({ title: "Lecture deleted" })
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Delete failed",
        variant: "destructive",
      })
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            Lectures
          </h2>
          <p className="text-sm text-muted-foreground">Course lectures and learning materials</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Lecture
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading lectures...</p>
      ) : lectures.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground text-sm">No lectures yet.</Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {lectures.map((lecture) => (
            <Card key={lecture.id} className="p-4 space-y-2">
              <div className="flex justify-between gap-2">
                <h3 className="font-semibold text-foreground">{lecture.title}</h3>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(lecture.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {lecture.subject && (
                <p className="text-xs text-primary font-medium">{lecture.subject}</p>
              )}
              {lecture.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{lecture.description}</p>
              )}
              {lecture.video_link && (
                <a
                  href={lecture.video_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Watch video
                </a>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Lecture</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="lec-title">Title</Label>
              <Input id="lec-title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lec-subject">Subject</Label>
              <Input id="lec-subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lec-desc">Description</Label>
              <Textarea id="lec-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lec-video">Video link</Label>
              <Input id="lec-video" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving || !title.trim()}>
              {saving ? "Saving..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
