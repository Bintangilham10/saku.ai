import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { getDashboardSummaryPayload } from "@/lib/saku-data"
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/server-config"

export async function GET() {
  if (!isClerkConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Dashboard API tidak tersedia dalam mode demo." },
      { status: 503 }
    )
  }

  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await getDashboardSummaryPayload()

  return NextResponse.json(payload)
}
