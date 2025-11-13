"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface AnswerSectionProps {
  questionId: string
  userId: string
}

export default function AnswerSection({ questionId, userId }: AnswerSectionProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()

      const { error: insertError } = await supabase.from("answers").insert({
        question_id: questionId,
        author_id: userId,
        content,
      })

      if (insertError) throw insertError

      setContent("")
      // Reload page to show new answer
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post answer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-8">
      <h3 className="text-xl font-bold text-foreground mb-6">Post Your Answer</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your answer and insights..."
          required
          disabled={loading}
          rows={6}
          className="w-full px-4 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Posting..." : "Post Answer"}
        </Button>
      </form>
    </Card>
  )
}
