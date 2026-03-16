"use client";

import { useChat } from "ai/react";
import { AlertCircle, Bot, Sparkles, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DataMode } from "@/lib/saku-types";

type ChatProps = {
  summary: string;
  mode: DataMode;
};

const promptIdeas = [
  "Apakah budget nongkrongku masih aman sampai akhir minggu?",
  "Kasih 3 ide hemat makan tanpa bikin jadwal kuliah berantakan.",
  "Kalau aku mau nabung laptop, alokasi bulan ini paling realistis berapa?",
];

export default function Chat({ summary, mode }: ChatProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    isLoading: chatLoading,
  } = useChat({
    body: { summary },
    onError: (chatError) => {
      console.error("Chat error:", chatError);
    },
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
      <Card className="rounded-[1.5rem] border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Saku AI Advisor
          </CardTitle>
          <CardDescription>
            Chat dengan konteks ringkasan keuanganmu agar saran lebih spesifik.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error.message}</span>
              </div>
            </div>
          ) : null}

          <div className="min-h-[420px] space-y-4 rounded-[1.25rem] border border-border/60 bg-background/70 p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Bot className="mb-4 h-12 w-12 text-primary" />
                <h3 className="text-lg font-semibold">Mulai ngobrol dengan Saku AI</h3>
                <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
                  Tanyakan strategi hemat, cek ruang budget, atau minta simulasi
                  sederhana berdasarkan pengeluaranmu bulan ini.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[85%] rounded-[1.25rem] rounded-tr-md bg-primary px-4 py-3 text-primary-foreground"
                      : "max-w-[88%] rounded-[1.25rem] rounded-tl-md border border-border/60 bg-card px-4 py-3"
                  }
                >
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] opacity-80">
                    {message.role === "user" ? (
                      <User className="h-3.5 w-3.5" />
                    ) : (
                      <Bot className="h-3.5 w-3.5" />
                    )}
                    <span>{message.role === "user" ? "Kamu" : "Saku AI"}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </div>
                </div>
              ))
            )}

            {chatLoading ? (
              <div className="max-w-[88%] rounded-[1.25rem] rounded-tl-md border border-border/60 bg-card px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] opacity-80">
                  <Bot className="h-3.5 w-3.5" />
                  <span>Saku AI</span>
                </div>
                <div className="flex gap-1">
                  <span className="bg-muted-foreground/40 h-2 w-2 animate-bounce rounded-full" />
                  <span
                    className="bg-muted-foreground/40 h-2 w-2 animate-bounce rounded-full"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <span
                    className="bg-muted-foreground/40 h-2 w-2 animate-bounce rounded-full"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <Input
              className="h-11 flex-1"
              disabled={chatLoading}
              placeholder="Contoh: Apa uangku cukup sampai minggu depan?"
              value={input}
              onChange={handleInputChange}
            />
            <Button className="h-11 px-6" disabled={chatLoading || !input.trim()} type="submit">
              {chatLoading ? "Memproses..." : "Kirim"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-[1.5rem] border-border/70">
          <CardHeader>
            <CardTitle>Konteks yang Dipakai AI</CardTitle>
            <CardDescription>
              {mode === "live"
                ? "Ringkasan diambil dari data Supabase milikmu."
                : "Saat ini masih memakai mode demo karena data live belum tersedia."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-muted-foreground whitespace-pre-wrap rounded-[1.25rem] bg-background/70 p-4 text-sm leading-relaxed">
              {summary}
            </pre>
          </CardContent>
        </Card>

        <Card className="rounded-[1.5rem] border-border/70">
          <CardHeader>
            <CardTitle>Prompt Cepat</CardTitle>
            <CardDescription>
              Gunakan contoh ini untuk memulai percakapan yang spesifik.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {promptIdeas.map((idea) => (
              <div
                key={idea}
                className="rounded-[1.25rem] border border-border/60 bg-background/60 px-4 py-3 text-sm leading-relaxed"
              >
                {idea}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
