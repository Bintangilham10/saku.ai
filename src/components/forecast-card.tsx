import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { ForecastResult } from "@/lib/ml/types";

const modeLabels: Record<ForecastResult["mode"], string> = {
  "cold-start": "Cold start",
  standard: "Standar",
  rich: "Akurasi tinggi",
};

const modeHints: Record<ForecastResult["mode"], string> = {
  "cold-start": "Data masih sedikit, rentang prediksi lebar.",
  standard: "Estimasi dari pengeluaran 30 hari terakhir.",
  rich: "Recurring sudah terpisah dari pengeluaran variabel.",
};

type ForecastCardProps = {
  forecast: ForecastResult;
};

export function ForecastCard({ forecast }: ForecastCardProps) {
  const status =
    forecast.predictedBalance < 0
      ? "danger"
      : forecast.predictedBalance < 200000
        ? "warning"
        : "safe";

  const statusBadge =
    status === "danger"
      ? { label: "Defisit", variant: "destructive" as const }
      : status === "warning"
        ? { label: "Tipis", variant: "secondary" as const }
        : { label: "Aman", variant: "outline" as const };

  return (
    <Card className="rounded-[1.5rem] border-border/70">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary h-4 w-4" />
            <CardDescription>Proyeksi Akhir Bulan</CardDescription>
          </div>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
        <CardTitle className="text-2xl">
          {formatCurrency(forecast.predictedBalance)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="text-muted-foreground">
          Rentang {formatCurrency(forecast.lower)} -{" "}
          {formatCurrency(forecast.upper)}
        </p>
        <p className="text-muted-foreground text-xs">
          {modeLabels[forecast.mode]} - {forecast.daysRemaining} hari menuju{" "}
          {formatShortDate(forecast.horizonDate)}.
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {modeHints[forecast.mode]}
        </p>
      </CardContent>
    </Card>
  );
}
