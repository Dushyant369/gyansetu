"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatRelativeTime, formatAbsoluteTime } from "@/lib/date"
import { AlertCircle, ExternalLink, CheckCircle2, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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

interface Report {
  report_id: string
  reason: string
  reported_by: {
    name: string | null
    email: string | null
  }
  reported_at: string
}

interface ReportedQuestion {
  id: string
  title: string
  description: string | null
  course_id: string | null
  course: {
    name: string
    code: string
  } | null
  author: {
    name: string | null
    email: string | null
  }
  created_at: string
  is_resolved: boolean
  reports: Report[]
  latest_report_at: string
}

export function ReportedQuestions() {
  const [questions, setQuestions] = useState<ReportedQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchReportedQuestions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/reported-questions")
      if (!response.ok) {
        throw new Error("Failed to fetch reported questions")
      }
      const data = await response.json()
      setQuestions(data.questions || [])
    } catch (error) {
      console.error("Error fetching reported questions:", error)
      toast({
        title: "Error",
        description: "Failed to load reported questions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportedQuestions()
  }, [])

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      setProcessing(`delete-${questionId}`)
      const response = await fetch("/api/admin/moderation/delete-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: questionId }),
      })

      if (!response.ok) {
        throw new Error("Failed to delete question")
      }

      toast({
        title: "Success",
        description: "Question deleted successfully",
      })
      fetchReportedQuestions()
    } catch (error) {
      console.error("Error deleting question:", error)
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleResolveQuestion = async (questionId: string) => {
    try {
      setProcessing(`resolve-${questionId}`)
      const response = await fetch("/api/admin/moderation/resolve-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: questionId }),
      })

      if (!response.ok) {
        throw new Error("Failed to resolve question")
      }

      toast({
        title: "Success",
        description: "Question marked as resolved",
      })
      fetchReportedQuestions()
    } catch (error) {
      console.error("Error resolving question:", error)
      toast({
        title: "Error",
        description: "Failed to resolve question",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleDismissReport = async (reportId: string) => {
    try {
      setProcessing(`dismiss-${reportId}`)
      const response = await fetch("/api/admin/moderation/dismiss-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: reportId }),
      })

      if (!response.ok) {
        throw new Error("Failed to dismiss report")
      }

      toast({
        title: "Success",
        description: "Report dismissed",
      })
      fetchReportedQuestions()
    } catch (error) {
      console.error("Error dismissing report:", error)
      toast({
        title: "Error",
        description: "Failed to dismiss report",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading reported questions...</div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No reports at this moment.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Reported Questions</h3>
        <p className="text-sm text-muted-foreground">Review and moderate reported questions</p>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question.id} className="p-6 border-l-4 border-l-red-500">
            <div className="space-y-4">
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-foreground text-lg">{question.title}</h4>
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                      Reported
                    </Badge>
                    {question.is_resolved && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        Resolved
                      </Badge>
                    )}
                    <Badge variant="secondary">{question.reports.length} report{question.reports.length !== 1 ? "s" : ""}</Badge>
                  </div>

                  {question.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{question.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Course: <strong>{question.course ? question.course.name : "Others"}</strong>
                      {question.course?.code && ` (${question.course.code})`}
                    </span>
                    <span>•</span>
                    <span>
                      Created by: <strong>{question.author.name || question.author.email || "Anonymous"}</strong>
                    </span>
                    <span>•</span>
                    <span title={formatAbsoluteTime(question.created_at)}>
                      Created {formatRelativeTime(question.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Reports Accordion */}
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value={`reports-${question.id}`}>
                  <AccordionTrigger className="text-sm font-medium">
                    View All Reports ({question.reports.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {question.reports.map((report, index) => (
                        <div key={report.report_id} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 space-y-1">
                              <div className="text-sm">
                                <span className="font-medium">Reason: </span>
                                <span className="text-muted-foreground">{report.reason}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span>Reported By: </span>
                                <span className="font-medium">
                                  {report.reported_by.name || report.reported_by.email || "Anonymous"}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span>Reported At: </span>
                                <span title={formatAbsoluteTime(report.reported_at)}>
                                  {formatRelativeTime(report.reported_at)}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDismissReport(report.report_id)}
                              disabled={processing === `dismiss-${report.report_id}`}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {index < question.reports.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/question/${question.id}`}>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    View Question
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolveQuestion(question.id)}
                  disabled={processing === `resolve-${question.id}` || question.is_resolved}
                  className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {question.is_resolved ? "Resolved" : "Mark as Resolved"}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={processing === `delete-${question.id}`}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Question
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the question and all associated answers, replies, and votes.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

