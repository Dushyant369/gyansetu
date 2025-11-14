import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function MyCoursesSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

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
              {i % 2 === 0 && (
                <div className="pt-2 border-t border-border">
                  <Skeleton className="h-4 w-24" />
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

