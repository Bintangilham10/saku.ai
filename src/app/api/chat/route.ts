import { anthropic } from "@ai-sdk/anthropic"
import { openai } from "@ai-sdk/openai"
import { auth } from "@clerk/nextjs/server"
import { streamText } from "ai"

import { consumeAiRateLimit, hasAiConsent } from "@/lib/ai-access"
import {
  AI_MAX_OUTPUT_TOKENS,
  AI_REQUEST_TIMEOUT_MS,
  ChatRequestError,
  parseChatRequest,
} from "@/lib/ai-security"
import { getSakuDataset } from "@/lib/saku-data"
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/server-config"

function resolveModel() {
  if (process.env.OPENAI_API_KEY) {
    return openai("gpt-4o-mini")
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic("claude-haiku-4-5")
  }

  return null
}

export async function POST(req: Request) {
  if (!isClerkConfigured() || !isSupabaseConfigured()) {
    return Response.json(
      { error: "Chat AI tidak tersedia dalam mode demo." },
      { status: 503 }
    )
  }

  const { userId } = await auth()

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const model = resolveModel()

  if (!model) {
    return Response.json(
      {
        error: "Tambahkan OPENAI_API_KEY atau ANTHROPIC_API_KEY agar chat AI aktif.",
      },
      { status: 503 }
    )
  }

  try {
    const { messages } = await parseChatRequest(req)
    const consentGranted = await hasAiConsent(userId)

    if (!consentGranted) {
      return Response.json(
        { error: "Persetujuan AI diperlukan sebelum data dikirim ke provider." },
        { status: 403 }
      )
    }

    const rateLimit = await consumeAiRateLimit()

    if (!rateLimit.allowed) {
      return Response.json(
        { error: "Batas chat AI tercapai. Coba lagi sebentar." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      )
    }

    const dataset = await getSakuDataset()

    const result = streamText({
      abortSignal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
      maxTokens: AI_MAX_OUTPUT_TOKENS,
      model,
      system: [
        "Kamu adalah Saku AI, asisten keuangan mahasiswa.",
        "Gunakan bahasa Indonesia yang santai, jelas, dan tidak menggurui.",
        "Selalu berikan jawaban yang konkret dan actionable.",
        "Jika user meminta saran, prioritaskan 3 langkah hemat yang realistis.",
        "Jangan mengklaim kepastian untuk masa depan dan hindari saran investasi profesional.",
        "Gunakan konteks ringkasan keuangan berikut sebagai dasar jawaban:",
        dataset.aiSummary,
      ].join("\n\n"),
      messages,
      temperature: 0.5,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    if (error instanceof ChatRequestError) {
      return Response.json({ error: error.message }, { status: error.status })
    }

    console.error("Chat API error:", error)
    return Response.json(
      {
        error: "Gagal memproses chat. Periksa konfigurasi AI dan data summary.",
      },
      { status: 500 }
    )
  }
}
