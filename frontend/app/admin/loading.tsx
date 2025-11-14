import { DashboardHeader } from "@/components/dashboard-header"
import { AdminDashboardSkeleton } from "@/components/skeletons/admin-skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader showAdminLink={true} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <AdminDashboardSkeleton />
      </main>
    </div>
  )
}

