import { createClient } from "@/lib/supabase/server"
import { requireUser } from "@/lib/auth/require-user"
import { NextResponse } from "next/server"

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUser()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const { id: pollId } = await context.params
  let body: { option_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.option_id) {
    return NextResponse.json({ error: "option_id required" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: poll } = await supabase
    .from("polls")
    .select("expires_at, created_by")
    .eq("id", pollId)
    .single()
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 })
  }
  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    return NextResponse.json({ error: "Poll has expired" }, { status: 400 })
  }
  if (poll.created_by === auth.user!.id) {
    return NextResponse.json({ error: "You cannot vote in your own poll" }, { status: 403 })
  }

  const { data: option } = await supabase
    .from("poll_options")
    .select("id")
    .eq("id", body.option_id)
    .eq("poll_id", pollId)
    .maybeSingle()

  if (!option) {
    return NextResponse.json({ error: "Invalid option for this poll" }, { status: 400 })
  }

  const { error: deleteError } = await supabase
    .from("poll_votes")
    .delete()
    .eq("poll_id", pollId)
    .eq("user_id", auth.user!.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  const { error } = await supabase.from("poll_votes").insert({
    poll_id: pollId,
    option_id: body.option_id,
    user_id: auth.user!.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
