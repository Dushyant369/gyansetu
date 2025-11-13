"use client"

import { useState, useTransition } from "react"
import { enrollInCourse, unenrollFromCourse } from "@/app/dashboard/courses/actions"
import { Button } from "@/components/ui/button"

interface EnrollButtonProps {
  courseId: string
  isEnrolled: boolean
}

export function EnrollButton({ courseId, isEnrolled }: EnrollButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  const handleEnroll = () => {
    setError("")
    startTransition(async () => {
      try {
        await enrollInCourse(courseId)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to enroll")
      }
    })
  }

  const handleUnenroll = () => {
    setError("")
    startTransition(async () => {
      try {
        await unenrollFromCourse(courseId)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to unenroll")
      }
    })
  }

  if (error) {
    return (
      <div className="flex-1">
        <p className="text-xs text-destructive text-center">{error}</p>
      </div>
    )
  }

  return (
    <Button
      variant={isEnrolled ? "outline" : "default"}
      size="sm"
      onClick={isEnrolled ? handleUnenroll : handleEnroll}
      disabled={isPending}
      className="flex-1"
    >
      {isPending ? "..." : isEnrolled ? "Enrolled" : "Enroll"}
    </Button>
  )
}

