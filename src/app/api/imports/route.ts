import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    {
      error:
        "Import CSV belum diimplementasikan penuh pada iterasi ini, tetapi schema dan entry point API sudah disiapkan.",
    },
    { status: 501 },
  );
}
