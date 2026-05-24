"use client";

import { useChat } from "ai/react";
import { AlertCircle, Bot, Sparkles, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
  "Budget nongkrong masih aman?",
  "Ide hemat makan minggu ini.",
  "Simulasi nabung laptop bulan ini.",
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
    <div className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Saku AI Advisor
          </CardTitle>
          <CardDescription>Tanya kondisi budgetmu.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{error.message}</span>
              </div>
            </div>
          ) : null}

          <div className="min-h-[340px] space-y-4 rounded-md border border-border/60 bg-background/70 p-3 sm:min-h-[420px] sm:p-4">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Bot className="mb-4 h-12 w-12 text-primary" />
                <h3 className="text-lg font-semibold">Mulai ngobrol dengan Saku AI</h3>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                  Tanyakan budget, tabungan, atau rencana pengeluaran.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === "user"
                      ? "ml-auto max-w-[92%] rounded-md bg-primary px-4 py-3 text-primary-foreground sm:max-w-[85%]"
                      : "max-w-[94%] rounded-md border border-border/60 bg-card px-4 py-3 sm:max-w-[88%]"
                  }
                >
                  <div className="mb-2 flex items-center gap-2 text-xs font-medium opacity-80">
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
              <div className="max-w-[88%] rounded-md border border-border/60 bg-card px-4 py-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium opacity-80">
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
              placeholder="Tulis pertanyaan..."
              value={input}
              onChange={handleInputChange}
            />
            <Button className="h-11 px-6" disabled={chatLoading || !input.trim()} type="submit">
              {chatLoading ? "Memproses..." : "Kirim"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-5">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Konteks AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={mode === "live" ? "default" : "secondary"}>
              {mode === "live" ? "Data live" : "Mode demo"}
            </Badge>
            <details className="rounded-md border border-border/60 bg-background/70 px-4 py-3 text-sm">
              <summary className="cursor-pointer font-medium">Lihat ringkasan data</summary>
              <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-muted-foreground">
                {summary}
              </pre>
            </details>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Prompt Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {promptIdeas.map((idea) => (
              <div
                key={idea}
                className="rounded-md border border-border/60 bg-background/60 px-4 py-3 text-sm"
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
