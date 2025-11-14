import { DashboardHeader } from "@/components/dashboard-header"
import { QuestionDetailSkeleton } from "@/components/skeletons/questions-skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <QuestionDetailSkeleton />
      </main>
    </div>
  )
}

