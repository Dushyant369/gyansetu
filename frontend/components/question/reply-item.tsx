"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { updateReply, deleteReply } from "@/app/question/[id]/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Edit2, Trash2, X, Check } from "lucide-react"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"
import Image from "next/image"
import { ReportButton } from "@/components/question/report-button"
import { cn } from "@/lib/utils"

interface Reply {
  id: string
  content: string
  author_id: string
  created_at: string
  image_url?: string | null
  profiles?: {
    display_name: string | null
    email: string
    role?: string
  }
}

interface ReplyItemProps {
  reply: Reply
  questionId: string
  currentUserId: string
  currentUserRole: string
}

export function ReplyItem({ reply, questionId, currentUserId, currentUserRole }: ReplyItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(reply.content)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const isReplyAuthor = reply.author_id === currentUserId
  const isAdmin = currentUserRole === "admin" || currentUserRole === "superadmin"
  const canEdit = isReplyAuthor || isAdmin
  const canDelete = isReplyAuthor || isAdmin

  const handleUpdate = () => {
    if (!editContent.trim()) {
      toast({
        title: "Content required",
        description: "Reply content cannot be empty.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        await updateReply(reply.id, questionId, editContent.trim())
        toast({
          title: "Reply updated",
          description: "Your reply has been updated.",
        })
        setIsEditing(false)
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update reply",
          variant: "destructive",
        })
      }
    })
  }

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this reply?")) {
      return
    }

    startTransition(async () => {
      try {
        await deleteReply(reply.id, questionId)
        toast({
          title: "Reply deleted",
          description: "The reply has been deleted.",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete reply",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="p-3 bg-muted/50 rounded-md border border-border">
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="resize-none"
            disabled={isPending}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={isPending || !editContent.trim()}
              className="gap-2"
            >
              <Check className="w-4 h-4" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsEditing(false)
                setEditContent(reply.content)
              }}
              disabled={isPending}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>
          {reply.image_url && (
            <div className="mt-2 overflow-hidden rounded-lg border border-border bg-card/80">
              <Image
                src={reply.image_url}
                alt="Reply attachment"
                width={400}
                height={300}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              By: {reply.profiles?.display_name || reply.profiles?.email} •{" "}
              <span title={formatAbsoluteTime(reply.created_at)}>{formatRelativeTime(reply.created_at)}</span>
            </p>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-7 px-2 gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="h-7 px-2 gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
              <ReportButton
                replyId={reply.id}
                currentUserId={currentUserId}
                size="sm"
                variant="ghost"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

