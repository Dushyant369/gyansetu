"use client"

import { useEffect, useState, useTransition } from "react"
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

export function MarkResolvedButton({ questionId, isResolved: initialResolved, currentUserRole }: MarkResolvedButtonProps) {
  const [resolved, setResolved] = useState(initialResolved)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setResolved(initialResolved)
  }, [initialResolved])

  if (currentUserRole !== "admin" && currentUserRole !== "superadmin" && currentUserRole !== "professor") {
    return null
  }

  const handleMarkResolved = async () => {
    if (resolved) return

    startTransition(async () => {
      try {
        const result = await markAsResolved(questionId)
        if (!result.resolved) {
          throw new Error("Could not mark question as resolved. Check your permissions.")
        }
        setResolved(true)
        toast({
          title: "Success",
          description: "Question marked as resolved!",
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

  if (resolved) {
    return (
      <Button
        variant="secondary"
        size="sm"
        disabled
        className="gap-2 bg-green-600/15 text-green-700 dark:text-green-400 border-green-600/30"
      >
        <CheckCircle2 className="w-4 h-4" />
        Resolved
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleMarkResolved}
      disabled={isPending}
      className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
    >
      <CheckCircle2 className="w-4 h-4" />
      Mark as Resolved
    </Button>
  )
}

