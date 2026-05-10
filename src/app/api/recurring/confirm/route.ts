import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  hasSupabaseServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase";
import { getSakuDataset } from "@/lib/saku-data";

const confirmSchema = z.object({
  key: z.string().min(1),
});

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi." },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const { key } = confirmSchema.parse(body);

    const dataset = await getSakuDataset();
    const candidate = dataset.detectedRecurring.find(
      (item) => item.key === key,
    );

    if (!candidate) {
      return NextResponse.json(
        { error: "Recurring candidate tidak ditemukan." },
        { status: 404 },
      );
    }

    const client = hasSupabaseServiceRole()
      ? createSupabaseAdminClient()
      : await createSupabaseServerClient();

    if (!client) {
      return NextResponse.json(
        { error: "Supabase client gagal diinisialisasi." },
        { status: 503 },
      );
    }

    const appUser = await client
      .from("app_users")
      .select("id")
      .eq("clerk_id", userId)
      .maybeSingle();

    if (appUser.error || !appUser.data) {
      return NextResponse.json(
        { error: "Profil pengguna tidak ditemukan." },
        { status: 404 },
      );
    }

    const existing = await client
      .from("recurring_rules")
      .select("id")
      .eq("user_id", appUser.data.id)
      .eq("source_key", candidate.key)
      .maybeSingle();

    if (existing.data) {
      return NextResponse.json(
        { data: { id: existing.data.id, alreadyExists: true } },
        { status: 200 },
      );
    }

    const inserted = await client
      .from("recurring_rules")
      .insert({
        user_id: appUser.data.id,
        category_id: candidate.categoryId,
        amount: candidate.amount,
        currency: "IDR",
        next_occurrence: candidate.nextOccurrence,
        active: true,
        detected: true,
        confidence: candidate.confidence,
        source_key: candidate.key,
        metadata: {
          label: candidate.merchantSample,
          cadence: candidate.cadence,
          intervalDays: candidate.intervalDays,
          occurrences: candidate.occurrences,
        },
      })
      .select("id")
      .single();

    if (inserted.error) {
      throw inserted.error;
    }

    return NextResponse.json({ data: { id: inserted.data.id } }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Payload tidak valid." },
        { status: 400 },
      );
    }

    const message =
      error instanceof Error ? error.message : "Gagal konfirmasi recurring.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
