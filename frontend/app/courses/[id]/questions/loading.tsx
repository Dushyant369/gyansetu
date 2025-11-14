import { DashboardHeader } from "@/components/dashboard-header"
import { QuestionsListSkeleton } from "@/components/skeletons/questions-skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Questions</h2>
          </div>
          <QuestionsListSkeleton />
        </div>
      </main>
    </div>
  )
}

