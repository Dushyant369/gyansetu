import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export default async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const pathname = request.nextUrl.pathname

  // Skip middleware for public routes
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/" ||
    pathname.startsWith("/favicon")
  ) {
    return response
  }

  // Get user from session
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  // Get user and update session
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, redirect to login (except for public routes)
  if (!user) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
    return response
  }

  // Auto-assign SuperAdmin role if email matches
  if (user.email === "icygenius08@gmail.com") {
    try {
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (fetchError) {
        console.error("Error fetching profile for SuperAdmin check:", fetchError)
      }

      if (profile && profile.role !== "superadmin") {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ role: "superadmin" })
          .eq("id", user.id)

        if (updateError) {
          console.error("Error updating SuperAdmin role:", updateError)
        }
      }
    } catch (error) {
      console.error("Error ensuring SuperAdmin role:", error)
    }
  }

  // Get user role from profile
  let userRole = "student"
  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching user profile role:", profileError)
    }

    userRole = profile?.role || "student"
  } catch (error) {
    console.error("Unexpected error fetching user profile:", error)
    userRole = "student"
  }

  // Protect /admin routes - only admins and superadmins allowed
  if (pathname.startsWith("/admin")) {
    if (userRole !== "admin" && userRole !== "superadmin") {
      const dashboardUrl = new URL("/dashboard", request.url)
      dashboardUrl.searchParams.set("error", "unauthorized")
      dashboardUrl.searchParams.set("message", "You don't have permission to access this page. Admin access required.")
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Protect additional routes - students, admins, and superadmins allowed
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/courses") ||
    pathname.startsWith("/question") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/profile")
  ) {
    if (userRole !== "student" && userRole !== "admin" && userRole !== "superadmin") {
      const dashboardUrl = new URL("/dashboard", request.url)
      dashboardUrl.searchParams.set("error", "unauthorized")
      dashboardUrl.searchParams.set("message", "You don't have permission to access this page.")
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
}

