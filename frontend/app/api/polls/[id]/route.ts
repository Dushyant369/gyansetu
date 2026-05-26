import { createClient } from "@/lib/supabase/server"
import { requireContentManager } from "@/lib/auth/require-content-manager"
import { NextResponse } from "next/server"

type RouteContext = { params: Promise<{ id: string }> }

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireContentManager()
  if (auth.error) {
    return NextResponse.json({ error: auth.error.message }, { status: auth.error.status })
  }

  const { id } = await context.params
  const supabase = await createClient()
  const { error } = await supabase.from("polls").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
