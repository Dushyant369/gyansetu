import { Badge } from "@/components/ui/badge"
import { Star, Award, Trophy } from "lucide-react"

interface KarmaBadgesProps {
  karmaPoints: number
}

export function KarmaBadges({ karmaPoints }: KarmaBadgesProps) {
  const badges = []

  if (karmaPoints >= 1000) {
    badges.push({
      name: "Expert Mentor",
      icon: <Trophy className="w-4 h-4" />,
      color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
    })
  } else if (karmaPoints >= 500) {
    badges.push({
      name: "Active Contributor",
      icon: <Award className="w-4 h-4" />,
      color: "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30",
    })
  } else if (karmaPoints >= 100) {
    badges.push({
      name: "Rising Star",
      icon: <Star className="w-4 h-4" />,
      color: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
    })
  }

  if (badges.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge, index) => (
        <Badge key={index} className={`${badge.color} gap-1`}>
          {badge.icon}
          {badge.name}
        </Badge>
      ))}
    </div>
  )
}

