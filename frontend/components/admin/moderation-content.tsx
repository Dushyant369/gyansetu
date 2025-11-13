"use client"

import { useState, useEffect, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Trash2, Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Badge } from "@/components/ui/badge"
import { deleteQuestion, deleteAnswer } from "@/app/admin/moderation/actions"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"

interface Stats {
  totalUsers: number
  totalCourses: number
  totalQuestions: number
  totalAnswers: number
  topUsers: Array<{
    id: string
    display_name: string | null
    email: string
    karma_points: number
  }>
}

interface Course {
  id: string
  name: string
  code: string
}

interface ModerationContentProps {
  stats: Stats
  courses: Course[]
}

export function ModerationContent({ stats, courses }: ModerationContentProps) {
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [contentType, setContentType] = useState<"questions" | "answers">("questions")
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true)
      try {
        const supabase = createClient()

        if (contentType === "questions") {
          let query = supabase
            .from("questions")
            .select(
              `
              *,
              profiles!author_id(display_name, email),
              courses(name, code)
            `
            )
            .order("created_at", { ascending: false })
            .limit(50)

          if (selectedCourse !== "all") {
            query = query.eq("course_id", selectedCourse)
          }

          if (searchTerm) {
            query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
          }

          const { data, error } = await query

          if (error) throw error
          setQuestions(data || [])
        } else {
          let query = supabase
            .from("answers")
            .select(
              `
              *,
              profiles!author_id(display_name, email),
              questions(id, title, courses(name, code))
            `
            )
            .order("created_at", { ascending: false })
            .limit(50)

          if (searchTerm) {
            query = query.ilike("content", `%${searchTerm}%`)
          }

          const { data, error } = await query

          if (error) throw error
          setAnswers(data || [])
        }
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to fetch content",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [contentType, selectedCourse, searchTerm, toast])

  const handleDeleteQuestion = async (questionId: string) => {
    startTransition(async () => {
      try {
        await deleteQuestion(questionId)
        toast({
          title: "Success",
          description: "Question deleted successfully",
        })
        setQuestions((prev) => prev.filter((q) => q.id !== questionId))
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete question",
          variant: "destructive",
        })
      }
    })
  }

  const handleDeleteAnswer = async (answerId: string) => {
    startTransition(async () => {
      try {
        await deleteAnswer(answerId)
        toast({
          title: "Success",
          description: "Answer deleted successfully",
        })
        setAnswers((prev) => prev.filter((a) => a.id !== answerId))
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete answer",
          variant: "destructive",
        })
      }
    })
  }

  const filteredContent = contentType === "questions" ? questions : answers

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">{stats.totalCourses}</div>
          <div className="text-sm text-muted-foreground">Total Courses</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">{stats.totalQuestions}</div>
          <div className="text-sm text-muted-foreground">Total Questions</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">{stats.totalAnswers}</div>
          <div className="text-sm text-muted-foreground">Total Answers</div>
        </Card>
      </div>

      {/* Top Users */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Top 5 Users by Karma</h3>
        <div className="space-y-2">
          {stats.topUsers.map((user, index) => (
            <div key={user.id} className="flex justify-between items-center p-3 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    {user.display_name || user.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Badge variant="secondary">{user.karma_points || 0} karma</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Filters and Content Type */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <Button
              variant={contentType === "questions" ? "default" : "outline"}
              onClick={() => setContentType("questions")}
            >
              Questions
            </Button>
            <Button
              variant={contentType === "answers" ? "default" : "outline"}
              onClick={() => setContentType("answers")}
            >
              Answers
            </Button>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {contentType === "questions" && (
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Content List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading...</span>
            </div>
          </div>
        ) : filteredContent.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No {contentType} found matching your search</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contentType === "questions" ? (
              questions.map((question) => (
                <div key={question.id} className="p-4 border border-border rounded-lg hover:bg-card/50 transition-all duration-200">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <Link href={`/question/${question.id}`}>
                        <h4 className="font-semibold text-foreground hover:text-primary">
                          {question.title}
                        </h4>
                      </Link>
                      {question.content && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {question.content}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>
                          By: {question.is_anonymous ? "Anonymous" : question.profiles?.display_name || question.profiles?.email}
                        </span>
                        {question.courses && (
                          <Badge variant="outline" className="text-xs">
                            {question.courses.code}
                          </Badge>
                        )}
                        <span title={formatAbsoluteTime(question.created_at)}>
                          {formatRelativeTime(question.created_at)}
                        </span>
                        <span>{question.views || 0} views</span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isPending}>
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this question and all its answers. This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isPending}
                          >
                            {isPending ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              answers.map((answer) => (
                <div key={answer.id} className="p-4 border border-border rounded-lg hover:bg-card/50 transition-all duration-200">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <Link href={`/question/${answer.questions?.id}`}>
                        <h4 className="font-semibold text-foreground hover:text-primary">
                          {answer.questions?.title || "Question"}
                        </h4>
                      </Link>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{answer.content}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>By: {answer.profiles?.display_name || answer.profiles?.email}</span>
                        {answer.questions?.courses && (
                          <Badge variant="outline" className="text-xs">
                            {answer.questions.courses.code}
                          </Badge>
                        )}
                        {answer.is_accepted && (
                          <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 text-xs">
                            Accepted
                          </Badge>
                        )}
                        <span title={formatAbsoluteTime(answer.created_at)}>
                          {formatRelativeTime(answer.created_at)}
                        </span>
                        <span>{answer.upvotes || 0} upvotes</span>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={isPending}>
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this answer. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAnswer(answer.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isPending}
                          >
                            {isPending ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

