import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { ProfileEditForm } from "@/components/profile/profile-edit-form"
import { AchievementsList } from "@/components/profile/achievements-list"
import { KarmaBadges } from "@/components/profile/karma-badges"
import { BackButton } from "@/components/ui/back-button"
import { formatAbsoluteTime, formatRelativeTime } from "@/lib/date"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Fetch user's questions with course info
  const { data: userQuestions } = await supabase
    .from("questions")
    .select(
      `
      id, 
      title, 
      upvotes, 
      downvotes, 
      created_at,
      courses(name, code)
    `
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  // Fetch user's answers with question info
  const { data: userAnswers } = await supabase
    .from("answers")
    .select(
      `
      id, 
      upvotes, 
      downvotes, 
      is_accepted,
      created_at,
      questions(id, title, courses(name, code))
    `
    )
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  const karmaPoints = profile?.karma_points || 0
  const questionsCount = userQuestions?.length || 0
  const answersCount = userAnswers?.length || 0
  const acceptedAnswers = userAnswers?.filter((a: any) => a.is_accepted).length || 0

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <BackButton />
        </div>
        <div className="space-y-8">
          {/* Profile Header */}
          <Card className="p-8 bg-gradient-to-br from-card to-card/50">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar Section */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name || "User"}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-primary">
                      {(profile?.display_name || profile?.email || "U")[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{profile?.display_name || "User"}</h1>
                  <p className="text-muted-foreground mt-1">{profile?.email}</p>
                  {profile?.bio && <p className="text-foreground mt-2">{profile.bio}</p>}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-2xl font-bold text-primary">{karmaPoints}</p>
                    <p className="text-sm text-muted-foreground mt-1">Karma Points</p>
                  </div>

                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-2xl font-bold text-primary">{questionsCount}</p>
                    <p className="text-sm text-muted-foreground mt-1">Questions Asked</p>
                  </div>

                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-2xl font-bold text-primary">{answersCount}</p>
                    <p className="text-sm text-muted-foreground mt-1">Answers Given</p>
                  </div>

                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-2xl font-bold text-primary">{acceptedAnswers}</p>
                    <p className="text-sm text-muted-foreground mt-1">Accepted Answers</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    <Badge>{profile?.role || "student"}</Badge>
                    <Badge variant="secondary" title={formatAbsoluteTime(profile?.created_at)}>
                      Joined {formatRelativeTime(profile?.created_at)}
                    </Badge>
                  </div>
                  <KarmaBadges karmaPoints={karmaPoints} />
                </div>
              </div>
            </div>
          </Card>

          {/* Edit Profile */}
          <ProfileEditForm profile={profile} />

          {/* Achievements */}
          <AchievementsList
            karmaPoints={karmaPoints}
            questionsCount={questionsCount}
            answersCount={answersCount}
            acceptedAnswers={acceptedAnswers}
          />

          {/* Activity Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Questions Asked */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Questions Asked</h2>
              {userQuestions && userQuestions.length > 0 ? (
                <div className="space-y-3">
                  {userQuestions.slice(0, 10).map((question: any) => (
                    <Link
                      key={question.id}
                      href={`/question/${question.id}`}
                      className="block p-4 border border-border rounded-lg hover:bg-card/50 transition-colors"
                    >
                      <p className="font-medium text-foreground hover:text-primary line-clamp-1">
                        {question.title}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {question.courses && (
                          <Badge variant="outline" className="text-xs">
                            {question.courses.code}
                          </Badge>
                        )}
                        <span title={formatAbsoluteTime(question.created_at)}>
                          {formatRelativeTime(question.created_at)}
                        </span>
                        <span>• {question.upvotes - question.downvotes} votes</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">You haven't asked any questions yet</p>
              )}
            </Card>

            {/* Answers Given */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Answers Given</h2>
              {userAnswers && userAnswers.length > 0 ? (
                <div className="space-y-3">
                  {userAnswers.slice(0, 10).map((answer: any) => (
                    <Link
                      key={answer.id}
                      href={`/question/${answer.questions?.id}`}
                      className="block p-4 border border-border rounded-lg hover:bg-card/50 transition-colors"
                    >
                      <p className="font-medium text-foreground hover:text-primary line-clamp-1">
                        {answer.questions?.title || "Question"}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {answer.questions?.courses && (
                          <Badge variant="outline" className="text-xs">
                            {answer.questions.courses.code}
                          </Badge>
                        )}
                        {answer.is_accepted && (
                          <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 text-xs">
                            ✓ Accepted
                          </Badge>
                        )}
                        <span title={formatAbsoluteTime(answer.created_at)}>
                          {formatRelativeTime(answer.created_at)}
                        </span>
                        <span>• {answer.upvotes} upvotes</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">You haven't answered any questions yet</p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
