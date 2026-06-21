import { z } from "zod"

export const AI_RATE_LIMIT_REQUESTS = 10
export const AI_RATE_LIMIT_WINDOW_SECONDS = 60
export const AI_MAX_OUTPUT_TOKENS = 800
export const AI_REQUEST_TIMEOUT_MS = 20_000
export const AI_MAX_BODY_BYTES = 128 * 1024

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4_000),
})

const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(30),
})

export type ValidatedChatMessage = z.infer<typeof chatMessageSchema>

export class ChatRequestError extends Error {
  readonly status: 400 | 413

  constructor(message: string, status: 400 | 413) {
    super(message)
    this.name = "ChatRequestError"
    this.status = status
  }
}

export async function parseChatRequest(request: Request) {
  const declaredLength = Number(request.headers.get("content-length"))

  if (Number.isFinite(declaredLength) && declaredLength > AI_MAX_BODY_BYTES) {
    throw new ChatRequestError("Payload chat terlalu besar.", 413)
  }

  const rawBody = await request.text()

  if (new TextEncoder().encode(rawBody).byteLength > AI_MAX_BODY_BYTES) {
    throw new ChatRequestError("Payload chat terlalu besar.", 413)
  }

  let payload: unknown

  try {
    payload = JSON.parse(rawBody)
  } catch {
    throw new ChatRequestError("Payload chat bukan JSON yang valid.", 400)
  }

  const parsed = chatRequestSchema.safeParse(payload)

  if (!parsed.success) {
    throw new ChatRequestError("Payload chat tidak valid.", 400)
  }

  return parsed.data
}
