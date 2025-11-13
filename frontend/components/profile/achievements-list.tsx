"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AchievementsListProps {
  karmaPoints: number
  questionsCount: number
  answersCount: number
  acceptedAnswers: number
}

export function AchievementsList({
  karmaPoints,
  questionsCount,
  answersCount,
  acceptedAnswers,
}: AchievementsListProps) {
  const achievements = [
    {
      id: "first_question",
      title: "First Question Posted",
      description: "Asked your first question",
      unlocked: questionsCount > 0,
      icon: "🎯",
    },
    {
      id: "first_answer",
      title: "First Answer Given",
      description: "Answered your first question",
      unlocked: answersCount > 0,
      icon: "💬",
    },
    {
      id: "karma_100",
      title: "100+ Karma",
      description: "Reached 100 karma points",
      unlocked: karmaPoints >= 100,
      icon: "⭐",
    },
    {
      id: "top_answer",
      title: "Top Answer Accepted",
      description: "Had an answer accepted",
      unlocked: acceptedAnswers > 0,
      icon: "✅",
    },
    {
      id: "karma_500",
      title: "500+ Karma",
      description: "Reached 500 karma points",
      unlocked: karmaPoints >= 500,
      icon: "🌟",
    },
    {
      id: "helpful",
      title: "Helpful Contributor",
      description: "Answered 10+ questions",
      unlocked: answersCount >= 10,
      icon: "🏆",
    },
  ]

  const unlockedCount = achievements.filter((a) => a.unlocked).length

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-foreground">Achievements</h2>
        <Badge variant="secondary">{unlockedCount} / {achievements.length} Unlocked</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`p-4 border rounded-lg transition-all ${
              achievement.unlocked
                ? "border-primary/30 bg-primary/5"
                : "border-border/50 bg-muted/20 opacity-60"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{achievement.icon}</span>
              <div className="flex-1">
                <h3
                  className={`font-semibold ${
                    achievement.unlocked ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {achievement.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
              </div>
              {achievement.unlocked && (
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">✓</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

