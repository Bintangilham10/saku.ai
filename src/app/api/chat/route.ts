import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { auth } from "@clerk/nextjs/server";
import { streamText } from "ai";

import { getSakuDataset } from "@/lib/saku-data";

function resolveModel() {
  if (process.env.OPENAI_API_KEY) {
    return openai("gpt-4o-mini");
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic("claude-3-5-haiku-latest");
  }

  return null;
}

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const model = resolveModel();

  if (!model) {
    return Response.json(
      {
        error:
          "Tambahkan OPENAI_API_KEY atau ANTHROPIC_API_KEY agar chat AI aktif.",
      },
      { status: 503 },
    );
  }

  try {
    const { messages, summary } = await req.json();
    const dataset = await getSakuDataset();
    const safeSummary =
      typeof summary === "string" && summary.trim().length > 0
        ? summary
        : dataset.aiSummary;

    const result = streamText({
      model,
      system: [
        "Kamu adalah Saku AI, asisten keuangan mahasiswa.",
        "Gunakan bahasa Indonesia yang santai, jelas, dan tidak menggurui.",
        "Selalu berikan jawaban yang konkret dan actionable.",
        "Jika user meminta saran, prioritaskan 3 langkah hemat yang realistis.",
        "Jangan mengklaim kepastian untuk masa depan dan hindari saran investasi profesional.",
        "Gunakan konteks ringkasan keuangan berikut sebagai dasar jawaban:",
        safeSummary,
      ].join("\n\n"),
      messages: Array.isArray(messages) ? messages : [],
      temperature: 0.5,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      {
        error: "Gagal memproses chat. Periksa konfigurasi AI dan data summary.",
      },
      { status: 500 },
    );
  }
}
