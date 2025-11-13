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

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    const errors: typeof fieldErrors = {}

    if (!isCollegeEmail(email)) {
      errors.email = invalidEmailMessage
    }

    if (!password.trim()) {
      errors.password = "Password is required."
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast({
        title: "Unable to sign in",
        description: errors.email || errors.password || "Please correct the highlighted fields.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (authError) throw authError

      if (data.user) {
        router.push("/dashboard")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
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
            <p className="text-sm text-muted-foreground mt-2">Academic Q&A Platform</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
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
                  fieldErrors.email && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
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
                  fieldErrors.password && "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
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
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
