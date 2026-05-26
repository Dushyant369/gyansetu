"use client"

import { Card } from "@/components/ui/card"
import { AnswerComposer } from "@/components/question/answer-composer"

interface AnswerFormProps {
  questionId: string
}

export function AnswerForm({ questionId }: AnswerFormProps) {
  if (!questionId) {
    return (
      <Card className="p-6">
        <p className="text-destructive">Error: Question ID is missing. Please refresh the page.</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <AnswerComposer questionId={questionId} />
    </Card>
  )
}
