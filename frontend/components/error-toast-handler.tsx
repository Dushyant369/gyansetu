"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function ErrorToastHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const toast = useToast()

  useEffect(() => {
    const error = searchParams.get("error")
    const message = searchParams.get("message")

    if (error && message) {
      toast.toast({
        title: "Access Denied",
        description: message,
        variant: "destructive",
      })

      // Clean up URL by removing error params
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete("error")
      newSearchParams.delete("message")
      const newUrl = newSearchParams.toString()
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname
      router.replace(newUrl, { scroll: false })
    }
  }, [searchParams, router, toast])

  return null
}

