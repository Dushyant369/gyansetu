"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { markAsResolved } from "@/app/question/[id]/actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface MarkResolvedButtonProps {
  questionId: string
  isResolved: boolean
  currentUserRole: string
}

export function MarkResolvedButton({ questionId, isResolved, currentUserRole }: MarkResolvedButtonProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  // Only show for admins and superadmins
  if (currentUserRole !== "admin" && currentUserRole !== "superadmin") {
    return null
  }

  const handleMarkResolved = async () => {
    startTransition(async () => {
      try {
        const result = await markAsResolved(questionId)
        toast({
          title: "Success",
          description: result.resolved ? "Question marked as resolved!" : "Question marked as unresolved",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to update resolved status",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Button
      variant={isResolved ? "secondary" : "outline"}
      size="sm"
      onClick={handleMarkResolved}
      disabled={isPending}
      className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
    >
      <CheckCircle2 className="w-4 h-4" />
      {isResolved ? "Mark as Unresolved" : "Mark as Resolved"}
    </Button>
  )
}

