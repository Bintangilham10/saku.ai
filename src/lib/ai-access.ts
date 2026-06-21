import { createSupabaseServerClient } from "@/lib/supabase"
import {
  AI_RATE_LIMIT_REQUESTS,
  AI_RATE_LIMIT_WINDOW_SECONDS,
} from "@/lib/ai-security"

type RateLimitResult = {
  allowed: boolean
  retry_after_seconds: number
}

async function requireSupabaseClient() {
  const client = await createSupabaseServerClient()

  if (!client) {
    throw new Error("Supabase client tidak tersedia.")
  }

  return client
}

export async function hasAiConsent(clerkUserId: string) {
  const client = await requireSupabaseClient()
  const result = await client
    .from("app_users")
    .select("settings")
    .eq("clerk_id", clerkUserId)
    .maybeSingle()

  if (result.error) {
    throw result.error
  }

  const settings = result.data?.settings

  return Boolean(
    settings &&
      typeof settings === "object" &&
      "aiConsent" in settings &&
      settings.aiConsent === true
  )
}

export async function setAiConsent(consent: boolean) {
  const client = await requireSupabaseClient()
  const result = await client.rpc("set_ai_consent", { consent })

  if (result.error) {
    throw result.error
  }

  return result.data === true
}

export async function consumeAiRateLimit() {
  const client = await requireSupabaseClient()
  const result = await client.rpc("consume_ai_rate_limit", {
    request_limit: AI_RATE_LIMIT_REQUESTS,
    window_seconds: AI_RATE_LIMIT_WINDOW_SECONDS,
  })

  if (result.error) {
    throw result.error
  }

  const rateLimit = (result.data?.[0] ?? null) as RateLimitResult | null

  if (!rateLimit) {
    throw new Error("AI rate limiter tidak mengembalikan hasil.")
  }

  return {
    allowed: rateLimit.allowed,
    retryAfterSeconds: rateLimit.retry_after_seconds,
  }
}
