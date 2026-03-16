import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getDashboardSummaryPayload } from "@/lib/saku-data";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await getDashboardSummaryPayload();

  return NextResponse.json(payload);
}
