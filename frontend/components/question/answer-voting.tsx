"use client"

import { useState, useTransition } from "react"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { voteAnswer } from "@/app/question/[id]/voting-actions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AnswerVotingProps {
  answerId: string
  initialScore: number
  userVote: number | null
  currentUserId: string
  disabled?: boolean
  questionId: string
}

export function AnswerVoting({
  answerId,
  initialScore,
  userVote,
  currentUserId,
  disabled = false,
  questionId,
}: AnswerVotingProps) {
  const [score, setScore] = useState(initialScore)
  const [vote, setVote] = useState<number | null>(userVote)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const handleVote = async (voteValue: 1 | -1) => {
    if (disabled || isPending || !currentUserId) {
      return
    }

    startTransition(async () => {
      try {
        const result = await voteAnswer(answerId, voteValue)

        if (result.removed) {
          // Vote was removed
          setScore((prev) => prev - voteValue)
          setVote(null)
          toast({
            title: "Vote removed",
            description: "Your vote has been removed.",
          })
        } else {
          // Vote was added or changed
          if (vote === null) {
            // New vote
            setScore((prev) => prev + voteValue)
          } else {
            // Changed vote
            setScore((prev) => prev - vote + voteValue)
          }
          setVote(voteValue)
          toast({
            title: voteValue === 1 ? "Upvoted" : "Downvoted",
            description: `Answer ${voteValue === 1 ? "upvoted" : "downvoted"} successfully.`,
          })
        }

        router.refresh()
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to vote",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(1)}
        disabled={disabled || isPending}
        className={cn(
          "h-8 w-8 p-0 transition-all",
          vote === 1 && "text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400",
          !disabled && !isPending && "hover:bg-blue-50 dark:hover:bg-blue-950"
        )}
        title="Upvote"
      >
        <ThumbsUp className={cn("w-4 h-4", vote === 1 && "fill-current")} />
      </Button>
      <span
        className={cn(
          "text-sm font-semibold min-w-[2rem] text-center",
          score > 0 && "text-green-600 dark:text-green-400",
          score < 0 && "text-red-600 dark:text-red-400"
        )}
      >
        {score > 0 ? `+${score}` : score}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={disabled || isPending}
        className={cn(
          "h-8 w-8 p-0 transition-all",
          vote === -1 && "text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400",
          !disabled && !isPending && "hover:bg-red-50 dark:hover:bg-red-950"
        )}
        title="Downvote"
      >
        <ThumbsDown className={cn("w-4 h-4", vote === -1 && "fill-current")} />
      </Button>
    </div>
  )
}

