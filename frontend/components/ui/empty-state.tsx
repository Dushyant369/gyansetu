import { ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("p-12 text-center", className)}>
      <div className="flex flex-col items-center justify-center space-y-4">
        {icon && <div className="text-4xl opacity-50">{icon}</div>}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground max-w-md">{description}</p>}
        </div>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </Card>
  )
}

