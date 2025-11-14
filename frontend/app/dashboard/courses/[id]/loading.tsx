import { DashboardHeader } from "@/components/dashboard-header"
import { QuestionsListSkeleton } from "@/components/skeletons/questions-skeleton"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          <Card className="p-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </Card>
          <div>
            <Skeleton className="h-7 w-32 mb-6" />
            <QuestionsListSkeleton />
          </div>
        </div>
      </main>
    </div>
  )
}

