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
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary h-4 w-4" />
            <CardDescription className="text-xs font-medium uppercase tracking-[0.08em]">
              Proyeksi
            </CardDescription>
          </div>
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        </div>
        <CardTitle className="text-2xl font-semibold tabular-nums">
          {formatCurrency(forecast.predictedBalance)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p className="text-xs text-muted-foreground tabular-nums">
          Rentang {formatCurrency(forecast.lower)} -{" "}
          {formatCurrency(forecast.upper)}
        </p>
        <p className="text-xs text-muted-foreground">
          {modeLabels[forecast.mode]} - {forecast.daysRemaining} hari ke{" "}
          {formatShortDate(forecast.horizonDate)}
        </p>
      </CardContent>
    </Card>
  );
}
