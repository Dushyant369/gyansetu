"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; displayName?: string }>({})
  const router = useRouter()
  const { toast } = useToast()

  const studentPattern = /^[0-9]{9}@gkv\.ac\.in$/i
  const teacherPattern = /^[a-zA-Z.]+@gkv\.ac\.in$/i
  const invalidEmailMessage =
    "Only GKV-registered email addresses are allowed. Please use your official college email."

  const isCollegeEmail = (value: string) => {
    const normalized = value.trim().toLowerCase()
    return studentPattern.test(normalized) || teacherPattern.test(normalized)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    const errors: typeof fieldErrors = {}

    if (!displayName.trim()) {
      errors.displayName = "Full name is required."
    }

    if (!isCollegeEmail(email)) {
      errors.email = invalidEmailMessage
    }

    const passwordStrength =
      password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password)
    if (!passwordStrength) {
      errors.password = "Password must be at least 8 characters and include letters and numbers."
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast({
        title: "Unable to sign up",
        description:
          errors.email || errors.password || errors.displayName || "Please correct the highlighted fields.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const supabase = createClient()
      // Use environment variable if available, otherwise fall back to window.location.origin
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectUrl = `${appUrl}/auth/callback`

      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName,
          },
        },
      })

      if (authError) throw authError

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          // User is already confirmed, redirect to dashboard
          router.push("/dashboard")
        } else {
          // Email confirmation required - pass email to success page
          router.push(`/auth/sign-up-success?email=${encodeURIComponent(normalizedEmail)}`)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">GyanSetu</h1>
            <p className="text-sm text-muted-foreground mt-2">Join the Academic Community</p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <Input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => {
                  if (fieldErrors.displayName) {
                    setFieldErrors((prev) => ({ ...prev, displayName: undefined }))
                  }
                  setDisplayName(e.target.value)
                }}
                placeholder="John Doe"
                required
                disabled={loading}
                className={cn(
                  fieldErrors.displayName && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                )}
                aria-invalid={!!fieldErrors.displayName}
              />
              {fieldErrors.displayName && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.displayName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }))
                  }
                  setEmail(e.target.value)
                }}
                placeholder="you@example.com"
                required
                disabled={loading}
                className={cn(
                  fieldErrors.email && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                )}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }))
                  }
                  setPassword(e.target.value)
                }}
                placeholder="••••••••"
                required
                disabled={loading}
                className={cn(
                  fieldErrors.password && "border-red-500 focus-visible:ring-red-500 focus-visible:border-red-500"
                )}
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>}
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
