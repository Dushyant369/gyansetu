import { Progress } from "@/components/ui/progress"

interface UploadProgressProps {
  label: string
  percent: number
}

export function UploadProgress({ label, percent }: UploadProgressProps) {
  if (percent <= 0 || percent >= 100) return null

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}… {percent}%</p>
      <Progress value={percent} className="h-2" />
    </div>
  )
}
