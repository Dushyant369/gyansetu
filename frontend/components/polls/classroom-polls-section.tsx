"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, BarChart3, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { isContentManagerRole } from "@/lib/auth/require-content-manager"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PollOption {
  id: string
  label: string
  votes: number
  percent: number
}

interface Poll {
  id: string
  question: string
  options: PollOption[]
  totalVotes: number
  userVoteOptionId: string | null
  expires_at: string | null
}

interface ClassroomPollsSectionProps {
  userRole: string
}

export function ClassroomPollsSection({ userRole }: ClassroomPollsSectionProps) {
  const canManage = isContentManagerRole(userRole)
  const { toast } = useToast()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [opt1, setOpt1] = useState("")
  const [opt2, setOpt2] = useState("")
  const [opt3, setOpt3] = useState("")
  const [saving, setSaving] = useState(false)
  const [votingId, setVotingId] = useState<string | null>(null)

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/polls")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to load polls")
      setPolls(json.polls ?? [])
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load polls",
        variant: "destructive",
      })
      setPolls([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPolls()
  }, [fetchPolls])

  const handleCreate = async () => {
    const options = [opt1, opt2, opt3].map((o) => o.trim()).filter(Boolean)
    if (!question.trim() || options.length < 2) {
      toast({ title: "Need a question and at least 2 options", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), options }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to create poll")
      toast({ title: "Poll created" })
      setFormOpen(false)
      setQuestion("")
      setOpt1("")
      setOpt2("")
      setOpt3("")
      fetchPolls()
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

  const handleVote = async (pollId: string, optionId: string) => {
    setVotingId(pollId)
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option_id: optionId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Vote failed")
      await fetchPolls()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Could not vote",
        variant: "destructive",
      })
    } finally {
      setVotingId(null)
    }
  }

  const handleDelete = async (pollId: string) => {
    try {
      const res = await fetch(`/api/polls/${pollId}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Delete failed")
      }
      setPolls((prev) => prev.filter((p) => p.id !== pollId))
      toast({ title: "Poll deleted" })
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
            <BarChart3 className="w-6 h-6 text-primary" />
            Classroom Polls
          </h2>
          <p className="text-sm text-muted-foreground">Vote once per poll — live results update after each vote</p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Poll
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading polls...</p>
      ) : polls.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground text-sm">No active polls.</Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <Card key={poll.id} className="p-4 space-y-3">
              <div className="flex justify-between gap-2">
                <p className="font-semibold text-foreground">{poll.question}</p>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive shrink-0"
                    onClick={() => handleDelete(poll.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{poll.totalVotes} vote(s)</p>
              <div className="space-y-2">
                {poll.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={votingId === poll.id}
                    onClick={() => handleVote(poll.id, opt.id)}
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-colors",
                      poll.userVoteOptionId === opt.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/50"
                    )}
                  >
                    <div className="flex justify-between text-sm mb-1">
                      <span>{opt.label}</span>
                      <span className="text-muted-foreground">{opt.percent}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${opt.percent}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Poll</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Question</Label>
              <Input value={question} onChange={(e) => setQuestion(e.target.value)} />
            </div>
            <div>
              <Label>Option 1</Label>
              <Input value={opt1} onChange={(e) => setOpt1(e.target.value)} />
            </div>
            <div>
              <Label>Option 2</Label>
              <Input value={opt2} onChange={(e) => setOpt2(e.target.value)} />
            </div>
            <div>
              <Label>Option 3 (optional)</Label>
              <Input value={opt3} onChange={(e) => setOpt3(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create Poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
