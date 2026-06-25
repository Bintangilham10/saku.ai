import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"

import { createTransaction, listTransactions } from "@/lib/saku-data"
import { isClerkConfigured, isSupabaseConfigured } from "@/lib/server-config"

function demoModeResponse() {
  return NextResponse.json(
    { error: "Transaction API tidak tersedia dalam mode demo." },
    { status: 503 }
  )
}

const transactionSchema = z.object({
  accountId: z.string().min(1).nullable().optional(),
  amount: z.coerce.number().positive(),
  categoryId: z.string().min(1).nullable().optional(),
  currency: z.string().length(3).optional(),
  date: z.string().min(1),
  description: z.string().nullable().optional(),
  imported: z.boolean().optional(),
  merchant: z.string().nullable().optional(),
  status: z.enum(["pending", "cleared"]).optional(),
  tags: z.array(z.string()).optional(),
  type: z.enum(["debit", "credit"]),
})

export async function GET(request: Request) {
  if (!isClerkConfigured() || !isSupabaseConfigured()) {
    return demoModeResponse()
  }

  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const payload = await listTransactions({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined,
  })

  return NextResponse.json(payload)
}

export async function POST(request: Request) {
  try {
    if (!isClerkConfigured() || !isSupabaseConfigured()) {
      return demoModeResponse()
    }

    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = transactionSchema.parse(body)
    const rawIdempotencyKey = request.headers.get("Idempotency-Key")?.trim()
    const idempotencyKey = rawIdempotencyKey || null
    const result = await createTransaction({
      accountId: parsed.accountId ?? null,
      amount: parsed.amount,
      categoryId: parsed.categoryId ?? null,
      currency: parsed.currency,
      date: parsed.date,
      description: parsed.description ?? null,
      externalId: idempotencyKey,
      imported: parsed.imported,
      merchant: parsed.merchant ?? null,
      status: parsed.status,
      tags: parsed.tags,
      type: parsed.type,
    })

    return NextResponse.json(
      { data: result.transaction },
      { status: result.created ? 201 : 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 })
    }

    const message = error instanceof Error ? error.message : "Gagal menyimpan transaksi."

    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (message.includes("Invalid")) {
      return NextResponse.json({ error: "Payload tidak valid." }, { status: 400 })
    }

    if (message.includes("belum dikonfigurasi")) {
      return NextResponse.json(
        { error: "Transaction API tidak tersedia." },
        { status: 503 }
      )
    }

    console.error("Create transaction error:", error)
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    )
  }
}
