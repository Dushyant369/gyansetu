import { DashboardHeader } from "@/components/dashboard-header"
import { CoursesSkeleton } from "@/components/skeletons/courses-skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <CoursesSkeleton />
      </main>
    </div>
  )
}

