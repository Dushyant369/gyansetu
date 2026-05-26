import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/require-user"
import { requireContentManager } from "@/lib/auth/require-content-manager"
import { NextResponse } from "next/server"

export async function GET() {
  const auth = await requireUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: polls, error } = await supabase
    .from("polls")
    .select("*, poll_options(*), profiles!created_by(display_name)")
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch polls" }, { status: 500 })
  }

  const pollIds = (polls ?? []).map((p) => p.id)
  const { data: votes } = pollIds.length
    ? await supabase.from("poll_votes").select("poll_id, option_id, user_id").in("poll_id", pollIds)
    : { data: [] }

  const enriched = (polls ?? []).map((poll) => {
    const options = (poll.poll_options as { id: string; label: string }[]) ?? []
    const pollVotes = votes?.filter((v) => v.poll_id === poll.id) ?? []
    const total = pollVotes.length
    const userVote = pollVotes.find((v) => v.user_id === auth.user!.id)?.option_id ?? null
    const results = options.map((opt) => {
      const count = pollVotes.filter((v) => v.option_id === opt.id).length
      return {
        ...opt,
        votes: count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }
    })
    return { ...poll, options: results, totalVotes: total, userVoteOptionId: userVote }
  })

  return NextResponse.json({ polls: enriched })
}

export async function POST(request: Request) {
  const auth = await requireContentManager()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  let body: { question?: string; options?: string[]; course_id?: string; expires_at?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const question = body.question?.trim()
  const options = (body.options ?? []).map((o) => o.trim()).filter(Boolean)

  if (!question || options.length < 2) {
    return NextResponse.json({ error: "Question and at least 2 options required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      question,
      course_id: body.course_id ?? null,
      expires_at: body.expires_at ? new Date(body.expires_at).toISOString() : null,
      created_by: auth.user!.id,
    })
    .select("*")
    .single()

  if (pollError || !poll) {
    return NextResponse.json({ error: pollError?.message ?? "Failed to create poll" }, { status: 500 })
  }

  const optionRows = options.map((label, i) => ({
    poll_id: poll.id,
    label,
    sort_order: i,
  }))

  const { error: optError } = await supabase.from("poll_options").insert(optionRows)
  if (optError) {
    await supabase.from("polls").delete().eq("id", poll.id)
    return NextResponse.json({ error: optError.message }, { status: 500 })
  }

  return NextResponse.json({ poll }, { status: 201 })
}
