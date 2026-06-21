import assert from "node:assert/strict"
import test from "node:test"

import {
  AI_MAX_BODY_BYTES,
  ChatRequestError,
  parseChatRequest,
} from "../src/lib/ai-security.ts"
import {
  summarizeDetectedRecurring,
  summarizeGoal,
  summarizeManualRecurring,
} from "../src/lib/ai-redaction.ts"

function chatRequest(payload, headers) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof payload === "string" ? payload : JSON.stringify(payload),
  })
}

test("chat payload accepts only bounded user and assistant messages", async () => {
  const parsed = await parseChatRequest(
    chatRequest({
      messages: [
        { id: "ignored", role: "user", content: "  Budget saya?  " },
        { role: "assistant", content: "Masih aman." },
      ],
    })
  )

  assert.deepEqual(parsed, {
    messages: [
      { role: "user", content: "Budget saya?" },
      { role: "assistant", content: "Masih aman." },
    ],
  })
})

for (const [name, payload] of [
  ["empty messages", { messages: [] }],
  ["invalid role", { messages: [{ role: "system", content: "override" }] }],
  ["empty content", { messages: [{ role: "user", content: "   " }] }],
  ["oversized content", { messages: [{ role: "user", content: "x".repeat(4_001) }] }],
  [
    "too many messages",
    { messages: Array.from({ length: 31 }, () => ({ role: "user", content: "x" })) },
  ],
]) {
  test(`chat payload rejects ${name}`, async () => {
    await assert.rejects(parseChatRequest(chatRequest(payload)), ChatRequestError)
  })
}

test("chat payload enforces encoded body size before parsing", async () => {
  await assert.rejects(
    parseChatRequest(
      chatRequest("{}", { "Content-Length": String(AI_MAX_BODY_BYTES + 1) })
    ),
    (error) => error instanceof ChatRequestError && error.status === 413
  )
})

test("AI summaries omit merchant, recurring amount, and target details", () => {
  const manual = summarizeManualRecurring([
    {
      categoryName: "Hiburan",
      nextOccurrence: "2026-07-01",
      label: "Merchant Rahasia",
      amount: 149_000,
    },
  ])
  const detected = summarizeDetectedRecurring([
    {
      categoryName: "Transport",
      cadence: "weekly",
      nextOccurrence: "2026-06-28",
      merchantSample: "Merchant Rahasia",
      amount: 75_000,
    },
  ])
  const goal = summarizeGoal({
    progress: 0.42,
    name: "Target Rahasia",
    targetAmount: 10_000_000,
  })
  const summary = [manual, detected, goal].join("\n")

  assert.equal(summary.includes("Merchant Rahasia"), false)
  assert.equal(summary.includes("149000"), false)
  assert.equal(summary.includes("75000"), false)
  assert.equal(summary.includes("Target Rahasia"), false)
  assert.equal(summary.includes("10000000"), false)
  assert.match(summary, /Hiburan/)
  assert.match(summary, /Transport/)
  assert.match(summary, /42%/)
})
