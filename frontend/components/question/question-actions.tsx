"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { deleteQuestion } from "@/app/question/[id]/edit-actions"
import { EditQuestionModal } from "./edit-question-modal"

interface QuestionActionsProps {
  question: {
    id: string
    title: string
    content: string | null
    author_id: string
    image_url?: string | null
  }
  currentUserId: string
  currentUserRole: string
}

export function QuestionActions({ question, currentUserId, currentUserRole }: QuestionActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const isQuestionAuthor = question.author_id === currentUserId
  const isAdmin = currentUserRole === "admin" || currentUserRole === "superadmin"
  const canEdit = isQuestionAuthor || isAdmin
  const canDelete = isQuestionAuthor || isAdmin

  // SuperAdmin can delete any question, Admin can only delete student questions
  const canDeleteWithRoleCheck = () => {
    if (isQuestionAuthor) return true
    if (currentUserRole === "superadmin") return true
    if (currentUserRole === "admin" && !isQuestionAuthor) {
      // Admin can delete student questions, but we'll check in the server action
      return true
    }
    return false
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteQuestion(question.id)
        toast({
          title: "Question deleted",
          description: "The question has been deleted successfully.",
        })
        router.push("/dashboard/questions")
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete question",
          variant: "destructive",
        })
      }
    })
  }

  if (!canEdit && !canDelete) {
    return null
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </Button>
        )}
        {canDeleteWithRoleCheck() && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this question and all its answers. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={isPending}
                >
                  {isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <EditQuestionModal
        question={question}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onSuccess={() => router.refresh()}
      />
    </>
  )
}

