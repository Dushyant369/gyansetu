"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export function BackButton() {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push("/dashboard")}
      className="bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white border-slate-600 hover:border-slate-500 dark:bg-slate-600 dark:hover:bg-slate-500 dark:active:bg-slate-400 dark:text-white dark:border-slate-500 dark:hover:border-slate-400 rounded-lg px-3 py-1 gap-2 transition-all shadow-sm hover:shadow-md"
    >
      <ArrowLeft className="w-4 h-4" />
      Go Back to Dashboard
    </Button>
  )
}
