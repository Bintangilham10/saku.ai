import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createTransaction, listTransactions } from "@/lib/saku-data";

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
});

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const payload = await listTransactions({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    limit: searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : undefined,
  });

  return NextResponse.json(payload);
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = transactionSchema.parse(body);
    const transaction = await createTransaction({
      accountId: parsed.accountId ?? null,
      amount: parsed.amount,
      categoryId: parsed.categoryId ?? null,
      currency: parsed.currency,
      date: parsed.date,
      description: parsed.description ?? null,
      imported: parsed.imported,
      merchant: parsed.merchant ?? null,
      status: parsed.status,
      tags: parsed.tags,
      type: parsed.type,
    });

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Payload tidak valid." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Gagal menyimpan transaksi.";
    const status =
      message === "Unauthorized"
        ? 401
        : message.includes("Invalid")
          ? 400
          : message.includes("belum dikonfigurasi")
            ? 503
            : 500;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
