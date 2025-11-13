import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Zap, BookOpen, TrendingUp, MessageSquare, Mail, Github } from "lucide-react"

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">G</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">GyanSetu</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Real-Time Academic Q&A</span>
          </div>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground text-balance animate-slide-up">
            Connect, Learn, and Grow Together
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-balance animate-slide-up">
            GyanSetu is your comprehensive academic Q&A platform where students, mentors, and educators collaborate in
            real-time to solve academic challenges.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 animate-scale-in">
            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                Get Started
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <h3 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">Why Choose GyanSetu?</h3>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Everything you need for collaborative learning in one platform
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 p-6 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground text-lg">Real-time Collaboration</h4>
              <p className="text-muted-foreground">
                Get instant answers from mentors and peers with live notifications and real-time updates.
              </p>
            </div>

            <div className="space-y-4 p-6 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground text-lg">Organized by Courses</h4>
              <p className="text-muted-foreground">
                Structured discussions for each course with relevant tags, topics, and semester organization.
              </p>
            </div>

            <div className="space-y-4 p-6 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02]">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-foreground text-lg">Karma System</h4>
              <p className="text-muted-foreground">
                Build your reputation by contributing quality answers. Earn karma for upvotes and accepted answers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* About */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">About GyanSetu</h4>
              <p className="text-sm text-muted-foreground">
                A modern academic Q&A platform designed to connect students, mentors, and educators in real-time.
                Built to foster collaborative learning and knowledge sharing.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-up" className="text-muted-foreground hover:text-foreground transition-colors">
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors">
                    Browse Courses
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Contact</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:support@gyansetu.com" className="hover:text-foreground transition-colors">
                    support@gyansetu.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  <a
                    href="https://github.com/gyansetu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Built with ❤️ by <span className="font-medium text-foreground">GyanSetu Team</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">&copy; 2025 GyanSetu. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
