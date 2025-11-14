"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Flag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { reportContent } from "@/app/question/[id]/report-actions"

interface ReportButtonProps {
  questionId?: string
  answerId?: string
  replyId?: string
  currentUserId: string
  variant?: "default" | "outline" | "ghost" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ReportButton({ questionId, answerId, replyId, currentUserId, variant = "ghost", size = "sm" }: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  if (!questionId && !answerId && !replyId) {
    return null
  }

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for reporting this content.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        await reportContent({
          questionId: questionId || undefined,
          answerId: answerId || undefined,
          replyId: replyId || undefined,
          reason: reason.trim(),
        })
        toast({
          title: "Report submitted",
          description: "Thank you for your report. Our moderators will review it shortly.",
        })
        setOpen(false)
        setReason("")
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to submit report",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Flag className="w-4 h-4" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Please provide a reason for reporting this {questionId ? "question" : answerId ? "answer" : "reply"}. Our moderators will review
            your report.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Inappropriate content, spam, harassment, etc."
              rows={4}
              className="resize-none"
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !reason.trim()}>
            {isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

