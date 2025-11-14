import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function QuestionsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex gap-4 pt-3 border-t border-border">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex gap-2 pt-2">
              {[1, 2, 3].map((tag) => (
                <Skeleton key={tag} className="h-5 w-16 rounded-full" />
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export function QuestionDetailSkeleton() {
  return (
    <div className="space-y-8">
      {/* Question Card */}
      <Card className="p-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-6 w-20 rounded-full" />
                ))}
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="flex justify-between items-center pt-6 border-t border-border">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </Card>

      {/* Answers Section */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-32" />
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-32" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Answer Form */}
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-10 w-24" />
      </Card>
    </div>
  )
}

