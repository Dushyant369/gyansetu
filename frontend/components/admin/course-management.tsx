"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { createCourse, updateCourse, deleteCourse } from "@/app/admin/actions"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"

interface AssignedAdmin {
  id: string
  display_name: string | null
  email: string
}

interface Course {
  id: string
  name: string
  code: string
  description: string | null
  semester: string | null
  assigned_to: string | null
  created_at: string
  assigned_admin?: AssignedAdmin | null
}

interface CourseManagementProps {
  courses?: Course[] // Optional, not used anymore but kept for backward compatibility
  adminUsers: Array<{ id: string; display_name: string | null; email: string }>
}

const COURSES_PER_PAGE = 10
const UNASSIGNED_VALUE = "none"

export function CourseManagement({ adminUsers }: CourseManagementProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [isPaginating, startPaginateTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [assignedTo, setAssignedTo] = useState<string>(UNASSIGNED_VALUE)
  const [editAssignedTo, setEditAssignedTo] = useState<string>(UNASSIGNED_VALUE)
  const { toast } = useToast()

  // Get search and page from URL params
  const searchTerm = searchParams.get("search") || ""
  const currentPage = Number(searchParams.get("page") || 1)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Build query with server-side filtering
        let query = supabase
          .from("courses")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })

        // Apply search filter if search term exists
        if (searchTerm.trim()) {
          query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%`)
        }

        // Apply pagination
        const offset = (currentPage - 1) * COURSES_PER_PAGE
        query = query.range(offset, offset + COURSES_PER_PAGE - 1)

        const { data, error, count } = await query

        if (error) {
          throw error
        }

        // Fetch assigned admin info for each course
        const coursesWithAdmins = await Promise.all(
          (data || []).map(async (course) => {
            if (course.assigned_to) {
              const { data: adminProfile } = await supabase
                .from("profiles")
                .select("id, display_name, email")
                .eq("id", course.assigned_to)
                .single()
              return { ...course, assigned_admin: adminProfile }
            }
            return { ...course, assigned_admin: null }
          })
        )

        setCourses(coursesWithAdmins)
        setTotalCount(count || 0)
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to fetch courses",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [searchTerm, currentPage, toast])

  const [totalCount, setTotalCount] = useState(0)
  const totalCourses = totalCount
  const totalPages = Math.max(1, Math.ceil(totalCourses / COURSES_PER_PAGE))

  const safePage = Math.min(currentPage, totalPages)
  const startEntry = totalCourses === 0 ? 0 : (safePage - 1) * COURSES_PER_PAGE + 1
  const endEntry = totalCourses === 0 ? 0 : Math.min(startEntry + COURSES_PER_PAGE - 1, totalCourses)

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const search = formData.get("search") as string
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    params.set("page", "1")
    router.push(`/admin?${params.toString()}#courses`)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams()
    if (searchTerm) params.set("search", searchTerm)
    params.set("page", newPage.toString())
    router.push(`/admin?${params.toString()}#courses`)
  }

  const handleCreateCourse = async (formData: FormData) => {
    setError("")
    setSuccess("")
    startTransition(async () => {
      try {
        await createCourse(formData)
        toast({
          title: "Success",
          description: "Course created successfully!",
        })
        setIsCreateDialogOpen(false)
        setAssignedTo(UNASSIGNED_VALUE)
        // Small delay to show success message, then refresh
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create course"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    })
  }

  const handleUpdateCourse = async (courseId: string, formData: FormData) => {
    setError("")
    setSuccess("")
    startTransition(async () => {
      try {
        await updateCourse(courseId, formData)
        toast({
          title: "Success",
          description: "Course updated successfully!",
        })
        setIsEditDialogOpen(false)
        setEditingCourse(null)
        setEditAssignedTo(UNASSIGNED_VALUE)
        // Small delay to show success message, then refresh
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to update course"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    })
  }

  const handleDeleteCourse = async (courseId: string) => {
    setError("")
    setSuccess("")
    startTransition(async () => {
      try {
        await deleteCourse(courseId)
        toast({
          title: "Success",
          description: "Course deleted successfully!",
        })
        // Small delay to show success message, then refresh
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to delete course"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    })
  }

  const openEditDialog = (course: Course) => {
    setEditingCourse(course)
    setEditAssignedTo(course.assigned_to || UNASSIGNED_VALUE)
    setIsEditDialogOpen(true)
  }

  const handleCreateSubmit = async (formData: FormData) => {
    if (assignedTo && assignedTo !== UNASSIGNED_VALUE) {
      formData.append("assigned_to", assignedTo)
    }
    await handleCreateCourse(formData)
  }

  const handleUpdateSubmit = async (courseId: string, formData: FormData) => {
    if (editAssignedTo && editAssignedTo !== UNASSIGNED_VALUE) {
      formData.append("assigned_to", editAssignedTo)
    } else {
      formData.append("assigned_to", "")
    }
    await handleUpdateCourse(courseId, formData)
  }

  return (
    <div className="space-y-6">
      {/* Create Course Section */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Create New Course</h3>
              <p className="text-sm text-muted-foreground">Add a new course to the platform</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Course</Button>
              </DialogTrigger>
              <DialogContent>
                <form action={handleCreateSubmit}>
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                    <DialogDescription>Fill in the course details below.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Course Name *</Label>
                      <Input id="name" name="name" placeholder="e.g., Data Structures and Algorithms" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="code">Course Code *</Label>
                      <Input id="code" name="code" placeholder="e.g., CS301" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Course description..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Input id="semester" name="semester" placeholder="e.g., Fall 2024" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assigned_to">Assign Admin (Optional)</Label>
                      <Select value={assignedTo} onValueChange={setAssignedTo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an admin to assign" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={UNASSIGNED_VALUE}>None</SelectItem>
                          {adminUsers.map((admin) => (
                            <SelectItem key={admin.id} value={admin.id}>
                              {admin.display_name || admin.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Assign an admin user to manage this course</p>
                    </div>
                  </div>
                  {error && (
                    <Alert className="mb-4 bg-destructive/10 border-destructive/20">
                      <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="mb-4 bg-green-50 border-green-200">
                      <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
                    </Alert>
                  )}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateDialogOpen(false)
                        setAssignedTo(UNASSIGNED_VALUE)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending ? "Creating..." : "Create Course"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Courses List */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">All Courses ({totalCourses})</h3>
            <p className="text-sm text-muted-foreground">Manage existing courses</p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <Input
              name="search"
              placeholder="Search courses by name or code..."
              defaultValue={searchTerm}
              className="md:max-w-sm"
            />
            <div className="text-sm text-muted-foreground">
              {totalCourses === 0
                ? "Showing 0 of 0 courses"
                : `Showing ${startEntry}-${endEntry} of ${totalCourses} course${totalCourses === 1 ? "" : "s"}`}
            </div>
          </form>

          {error && (
            <Alert className="bg-destructive/10 border-destructive/20">
              <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: COURSES_PER_PAGE }).map((_, index) => (
                <Card key={index} className="p-4 space-y-3">
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </Card>
              ))}
            </div>
          ) : totalCourses === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {searchTerm ? "No courses found matching your search." : "No courses yet. Create your first course above."}
            </p>
          ) : (
            <div className="space-y-4">
              {courses.map((course) => (
                <div key={course.id} className="flex justify-between items-start p-4 border border-border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-semibold text-foreground">{course.name}</h4>
                      <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">{course.code}</span>
                      {course.semester && (
                        <span className="text-xs text-muted-foreground">• {course.semester}</span>
                      )}
                      {course.assigned_admin && (
                        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">
                          Assigned to: {course.assigned_admin.display_name || course.assigned_admin.email}
                        </span>
                      )}
                    </div>
                    {course.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    )}
                    <p
                      className="text-xs text-muted-foreground"
                      title={formatAbsoluteTime(course.created_at)}
                    >
                      Created: {formatRelativeTime(course.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Dialog open={isEditDialogOpen && editingCourse?.id === course.id} onOpenChange={setIsEditDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(course)}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <form action={(formData) => handleUpdateSubmit(course.id, formData)}>
                          <DialogHeader>
                            <DialogTitle>Edit Course</DialogTitle>
                            <DialogDescription>Update the course details below.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="edit-name">Course Name *</Label>
                              <Input
                                id="edit-name"
                                name="name"
                                defaultValue={course.name}
                                placeholder="e.g., Data Structures and Algorithms"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-code">Course Code *</Label>
                              <Input id="edit-code" name="code" defaultValue={course.code} placeholder="e.g., CS301" required />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-description">Description</Label>
                              <Textarea
                                id="edit-description"
                                name="description"
                                defaultValue={course.description || ""}
                                placeholder="Course description..."
                                rows={4}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-semester">Semester</Label>
                              <Input
                                id="edit-semester"
                                name="semester"
                                defaultValue={course.semester || ""}
                                placeholder="e.g., Fall 2024"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="edit-assigned_to">Assign Admin (Optional)</Label>
                              <Select value={editAssignedTo} onValueChange={setEditAssignedTo}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an admin to assign" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={UNASSIGNED_VALUE}>None</SelectItem>
                                  {adminUsers.map((admin) => (
                                    <SelectItem key={admin.id} value={admin.id}>
                                      {admin.display_name || admin.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">Assign an admin user to manage this course</p>
                            </div>
                          </div>
                          {error && (
                            <Alert className="mb-4 bg-destructive/10 border-destructive/20">
                              <AlertDescription className="text-destructive text-sm">{error}</AlertDescription>
                            </Alert>
                          )}
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setIsEditDialogOpen(false)
                                setEditingCourse(null)
                                setEditAssignedTo(UNASSIGNED_VALUE)
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                              {isPending ? "Updating..." : "Update Course"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the course "{course.name}" ({course.code}). This action cannot
                            be undone and will also delete all questions associated with this course.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCourse(course.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isPending ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {startEntry}-{endEntry} of {totalCourses} course{totalCourses !== 1 ? "s" : ""}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    startPaginateTransition(() => {
                      handlePageChange(Math.max(1, safePage - 1))
                    })
                  }
                  disabled={safePage === 1 || isPaginating}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    startPaginateTransition(() => {
                      handlePageChange(Math.min(totalPages, safePage + 1))
                    })
                  }
                  disabled={safePage === totalPages || isPaginating}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

