"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SignUpSuccessPage() {
  const [email, setEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState("")
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email")

  // Get email from URL params or try to get from session
  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Try to get email from session
      const supabase = createClient()
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) {
          setEmail(data.user.email)
        }
      })
    }
  }, [emailParam])

  const handleResendEmail = async () => {
    if (!email) {
      setResendError("Email address is required")
      return
    }

    setResending(true)
    setResendError("")
    setResendSuccess(false)

    try {
      const supabase = createClient()
      const redirectUrl = `${window.location.origin}/auth/callback`
      
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) throw error

      setResendSuccess(true)
    } catch (err) {
      setResendError(err instanceof Error ? err.message : "Failed to resend email")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
            <p className="text-sm text-muted-foreground mt-2">
              We've sent you a confirmation link. Please click it to verify your email and activate your account.
            </p>
            {email && (
              <p className="text-xs text-muted-foreground mt-1">
                Email sent to: <span className="font-mono">{email}</span>
              </p>
            )}
          </div>

          {resendSuccess && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Confirmation email has been resent! Please check your inbox.
              </AlertDescription>
            </Alert>
          )}

          {resendError && (
            <Alert className="bg-destructive/10 border-destructive/20">
              <AlertDescription className="text-destructive text-sm">
                {resendError}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {email && (
              <Button
                onClick={handleResendEmail}
                disabled={resending}
                variant="outline"
                className="w-full"
              >
                {resending ? "Sending..." : "Resend Confirmation Email"}
              </Button>
            )}

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Didn't receive the email?</p>
              <ul className="list-disc list-inside space-y-1 text-left">
                <li>Check your spam/junk folder</li>
                <li>Make sure your email address is correct</li>
                <li>Wait a few minutes and try resending</li>
              </ul>
            </div>

            <Link href="/auth/login" className="block">
              <Button variant="outline" className="w-full bg-transparent">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
