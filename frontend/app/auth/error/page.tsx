"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <svg className="h-6 w-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Authentication Error</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Something went wrong during the authentication process. Please try again.
            </p>
          </div>

          <div className="space-y-2">
            <Link href="/auth/login" className="block">
              <Button className="w-full">Back to Login</Button>
            </Link>
            <Link href="/auth/sign-up" className="block">
              <Button variant="outline" className="w-full bg-transparent">
                Create New Account
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
