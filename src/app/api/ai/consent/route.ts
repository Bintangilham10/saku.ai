import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"

import { hasAiConsent, setAiConsent } from "@/lib/ai-access"
import {
  getConfiguredAiProvider,
  isClerkConfigured,
  isSupabaseConfigured,
} from "@/lib/server-config"

const consentSchema = z.object({
  consent: z.boolean(),
})

function unavailableResponse() {
  return NextResponse.json(
    { error: "AI consent tidak tersedia dalam mode demo." },
    { status: 503 }
  )
}

function disclosure() {
  return {
    provider: getConfiguredAiProvider(),
    dataShared: "Ringkasan kategori dan agregat finansial tanpa merchant atau nama target.",
    retention:
      "Saku AI tidak menyimpan percakapan. Provider dapat memproses data sesuai kebijakan retensinya.",
  }
}

export async function GET() {
  if (!isClerkConfigured() || !isSupabaseConfigured()) {
    return unavailableResponse()
  }

  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    consent: await hasAiConsent(userId),
    disclosure: disclosure(),
  })
}

export async function POST(request: Request) {
  if (!isClerkConfigured() || !isSupabaseConfigured()) {
    return unavailableResponse()
  }

  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = consentSchema.safeParse(await request.json())

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload consent tidak valid." }, { status: 400 })
  }

  const updated = await setAiConsent(parsed.data.consent)

  if (!updated) {
    return NextResponse.json({ error: "Profil user belum tersedia." }, { status: 409 })
  }

  return NextResponse.json({ consent: parsed.data.consent, disclosure: disclosure() })
}
