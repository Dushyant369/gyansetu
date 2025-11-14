"use client"

import type React from "react"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { BackButton } from "@/components/ui/back-button"
import { DashboardHeaderClient } from "@/components/dashboard/dashboard-header-client"
import { Label } from "@/components/ui/label"
import { Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Course {
  id: string
  name: string
  code: string
  semester?: string
}

export default function AskQuestionPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState("")
  const [courseId, setCourseId] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  // Fetch enrolled courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        // Get user profile to check if admin
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        const userRole = profile?.role || "student"
        const isAdmin = userRole === "admin" || userRole === "superadmin"
        
        // Redirect admins - they cannot ask questions
        if (isAdmin) {
          router.push("/dashboard")
          return
        }

        // Get enrolled courses for students, all courses for admins
        if (isAdmin) {
          const { data, error: fetchError } = await supabase
            .from("courses")
            .select("id, name, code, semester")
            .order("semester", { ascending: false })
            .order("name", { ascending: true })

          if (fetchError) {
            console.error("Error fetching courses:", fetchError)
          } else {
            setCourses(data || [])
          }
        } else {
          // Get student's enrolled courses
          const { data: enrollments, error: enrollmentError } = await supabase
            .from("student_courses")
            .select("course_id")
            .eq("student_id", user.id)

          if (enrollmentError) {
            console.error("Error fetching enrollments:", enrollmentError)
            setLoadingCourses(false)
            return
          }

          const enrolledCourseIds = (enrollments || []).map((e) => e.course_id)

          if (enrolledCourseIds.length > 0) {
            const { data, error: fetchError } = await supabase
              .from("courses")
              .select("id, name, code, semester")
              .in("id", enrolledCourseIds)
              .order("semester", { ascending: false })
              .order("name", { ascending: true })

            if (fetchError) {
              console.error("Error fetching courses:", fetchError)
            } else {
              setCourses(data || [])
            }
          } else {
            // No enrolled courses
            setCourses([])
          }
        }
      } catch (err) {
        console.error("Error fetching courses:", err)
      } finally {
        setLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [router])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      setImageFile(null)
      setImagePreview(null)
      return
    }

    const allowedTypes = ["image/jpeg", "image/png"]
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast({
        title: "Invalid image",
        description: "Only JPG or PNG images under 5MB are allowed.",
        variant: "destructive",
      })
      setImageFile(null)
      setImagePreview(null)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setImageFile(file)
    setImagePreview(previewUrl)
  }

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    startTransition(async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        const tagsArray = tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag)

        let uploadedImageUrl: string | null = null

        if (imageFile) {
          setIsUploading(true)
          const fileExt = imageFile.name.split(".").pop() || "jpg"
          const fileName = `${user.id}-question-${Date.now()}.${fileExt}`
          const filePath = `questions/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from("qa-images")
            .upload(filePath, imageFile, {
              cacheControl: "3600",
              upsert: true,
            })

          if (uploadError) {
            throw new Error(uploadError.message || "Failed to upload image")
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("qa-images").getPublicUrl(filePath)
          uploadedImageUrl = publicUrl
          setIsUploading(false)
        }

        const { data, error: insertError } = await supabase
          .from("questions")
          .insert({
            title,
            content: content || null,
            author_id: user.id,
            tags: tagsArray,
            course_id: courseId && courseId !== "others" ? courseId : null,
            image_url: uploadedImageUrl || null,
          })
          .select()
          .single()

        if (insertError) throw insertError

        if (imagePreview) {
          URL.revokeObjectURL(imagePreview)
        }

        router.push(`/dashboard/questions/${data.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create question")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to create question",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeaderClient />
      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-6">
          <BackButton />
        </div>
        <Card className="p-6 md:p-8 animate-fade-in">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Ask a Question</h2>
            <p className="text-muted-foreground">
              Share your academic question with the community and get help from mentors and peers
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                Question Title *
              </label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What is your question?"
                required
                disabled={loading}
                className="text-base"
              />
              <p className="text-xs text-muted-foreground mt-2">Be specific and descriptive about your question</p>
            </div>

                   <div>
                     <label htmlFor="course" className="block text-sm font-medium text-foreground mb-2">
                       Course
                     </label>
                     {loadingCourses ? (
                       <div className="w-full px-4 py-2 bg-input border border-input rounded-md text-muted-foreground">
                         Loading courses...
                       </div>
                     ) : (
                       <Select
                         value={courseId}
                         onValueChange={setCourseId}
                         disabled={loading || loadingCourses}
                       >
                         <SelectTrigger className="w-full">
                           <SelectValue placeholder="Select a course (optional)" />
                         </SelectTrigger>
                         <SelectContent>
                           {courses.length > 0 ? (
                             <>
                               {courses.map((course) => (
                                 <SelectItem key={course.id} value={course.id}>
                                   <div className="flex flex-col">
                                     <span>{course.name}</span>
                                     {course.code && (
                                       <span className="text-xs text-muted-foreground">{course.code}</span>
                                     )}
                                   </div>
                                 </SelectItem>
                               ))}
                               <SelectItem value="others">Others</SelectItem>
                             </>
                           ) : (
                             <>
                               <SelectItem value="others">Others</SelectItem>
                               <p className="px-2 py-1 text-xs text-muted-foreground">
                                 No enrolled courses. Enroll in courses to ask questions.
                               </p>
                             </>
                           )}
                         </SelectContent>
                       </Select>
                     )}
                     <p className="text-xs text-muted-foreground mt-2">
                       {courses.length > 0
                         ? 'Select the course this question belongs to, or choose "Others" if it doesn\'t fit any category'
                         : "You need to enroll in courses first to ask course-specific questions. Visit the Courses page to enroll."}
                     </p>
                   </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-foreground mb-2">
                Question Details
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Provide additional context and details about your question (optional)..."
                disabled={loading}
                rows={8}
                className="w-full px-4 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Include relevant information, what you've tried, and what the expected outcome is (optional)
              </p>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
                Tags (comma-separated)
              </label>
              <Input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., calculus, derivatives, integration"
                disabled={isPending || isUploading}
              />
              <p className="text-xs text-muted-foreground mt-2">Add tags to help others find your question</p>
            </div>

            <div>
              <Label htmlFor="image" className="block text-sm font-medium text-foreground mb-2">
                Image (Optional)
              </Label>
              <div className="space-y-2">
                {!imagePreview ? (
                  <label
                    htmlFor="image"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload image (JPG/PNG, max 5MB)</span>
                    </div>
                    <input
                      id="image"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isPending || isUploading}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={removeImage}
                      className="absolute top-2 right-2"
                      disabled={isPending || isUploading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Upload an image to help illustrate your question</p>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              <Button type="submit" disabled={isPending || isUploading}>
                {isPending || isUploading ? (isUploading ? "Uploading..." : "Posting...") : "Post Question"}
              </Button>
              <Link href="/dashboard/questions">
                <Button variant="outline" disabled={isPending || isUploading}>Cancel</Button>
              </Link>
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}
