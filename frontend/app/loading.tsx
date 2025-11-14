import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <DashboardSkeleton />
      </div>
    </div>
  )
}

