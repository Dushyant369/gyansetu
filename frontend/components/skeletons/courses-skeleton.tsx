import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function CoursesSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Search Bar */}
      <Skeleton className="h-10 w-full" />

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4">
              <div>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-16 w-full" />
              <div className="pt-4 border-t border-border">
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  )
}

