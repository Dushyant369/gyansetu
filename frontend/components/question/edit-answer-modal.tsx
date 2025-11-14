"use client"

import { useState, useTransition } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { updateAnswer } from "@/app/question/[id]/edit-actions"
import Image from "next/image"

interface EditAnswerModalProps {
  answer: {
    id: string
    content: string
    image_url?: string | null
  }
  questionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditAnswerModal({ answer, questionId, open, onOpenChange, onSuccess }: EditAnswerModalProps) {
  const [content, setContent] = useState(answer.content)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSave = () => {
    if (!content.trim()) {
      toast({
        title: "Validation error",
        description: "Answer content is required.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        await updateAnswer(answer.id, questionId, content.trim())
        toast({
          title: "Answer updated",
          description: "Your answer has been updated successfully.",
        })
        onOpenChange(false)
        onSuccess()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update answer",
          variant: "destructive",
        })
      }
    })
  }

  const handleClose = () => {
    setContent(answer.content)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Answer</DialogTitle>
          <DialogDescription>Update your answer content.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-answer-content">Content</Label>
            <Textarea
              id="edit-answer-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter answer content"
              rows={8}
              className="resize-none"
              disabled={isPending}
            />
          </div>
          {answer.image_url && (
            <div className="space-y-2">
              <Label>Current Image</Label>
              <div className="relative mt-2 w-full max-w-md overflow-hidden rounded-lg border border-border">
                <Image
                  src={answer.image_url}
                  alt="Current answer image"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                />
                <p className="text-xs text-muted-foreground mt-1">Current image (image updates coming soon)</p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !content.trim()}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

