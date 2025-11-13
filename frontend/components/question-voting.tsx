"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

interface QuestionVotingProps {
  questionId: string
  userId: string
}

export default function QuestionVoting({ questionId, userId }: QuestionVotingProps) {
  const [upvotes, setUpvotes] = useState(0)
  const [downvotes, setDownvotes] = useState(0)

  const handleVote = async (voteType: 1 | -1) => {
    try {
      const supabase = createClient()

      // Check if user already voted
      const { data: existingVote } = await supabase
        .from("votes")
        .select()
        .eq("user_id", userId)
        .eq("question_id", questionId)
        .single()

      if (existingVote) {
        // Update existing vote
        await supabase.from("votes").update({ vote_type: voteType }).eq("id", existingVote.id)
      } else {
        // Create new vote
        await supabase.from("votes").insert({
          user_id: userId,
          question_id: questionId,
          vote_type: voteType,
        })
      }

      if (voteType === 1) {
        setUpvotes(upvotes + 1)
      } else {
        setDownvotes(downvotes + 1)
      }
    } catch (error) {
      console.error("Vote failed:", error)
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => handleVote(1)}>
        ▲ Upvote
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleVote(-1)}>
        ▼ Downvote
      </Button>
    </div>
  )
}
