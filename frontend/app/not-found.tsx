import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-4xl font-bold text-foreground">404 – Page Not Found</h1>
      <p className="text-muted-foreground max-w-md">
        The page you're looking for doesn't exist or may have been moved. Check the URL or return to the dashboard to
        continue exploring GyanSetu.
      </p>
      <Link href="/dashboard">
        <Button className="gap-2 mt-4">
          <Home className="w-4 h-4" />
          Go to Dashboard
        </Button>
      </Link>
    </div>
  )
}

