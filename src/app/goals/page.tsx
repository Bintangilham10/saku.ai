import { CalendarDays, Repeat, Sparkles } from "lucide-react";

import { SakuShell } from "@/components/saku-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { getSakuDataset } from "@/lib/saku-data";

export default async function GoalsPage() {
  const dataset = await getSakuDataset();

  return (
    <SakuShell
      mode={dataset.mode}
      subtitle="Target tabungan dan biaya rutin."
      title="Target"
      userName={dataset.userName}
    >
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {dataset.goals.map((goal) => (
            <Card key={goal.id} className="border-border/70">
              <CardHeader>
                <CardTitle>{goal.name}</CardTitle>
                <CardDescription>
                  Target {formatCurrency(goal.targetAmount)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={goal.progress * 100} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-border/60 bg-background/60 p-3">
                    <p className="text-muted-foreground text-sm">Terkumpul</p>
                    <p className="mt-1 font-medium tabular-nums">
                      {formatCurrency(goal.currentAmount)}
                    </p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/60 p-3">
                    <p className="text-muted-foreground text-sm">Target date</p>
                    <p className="mt-1 font-medium">
                      {goal.targetDate ? formatShortDate(goal.targetDate) : "Belum diatur"}
                    </p>
                  </div>
                </div>
                {goal.note ? (
                  <p className="text-sm text-muted-foreground">
                    {goal.note}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Biaya Rutin</CardTitle>
            <CardDescription>Biaya rutin terdekat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataset.recurringItems.map((item) => (
              <div
                key={item.id}
                className="rounded-md border border-border/60 bg-background/60 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.categoryName}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    Berikutnya{" "}
                    {item.nextOccurrence ? formatShortDate(item.nextOccurrence) : "belum diatur"}
                  </span>
                </div>
              </div>
            ))}

            <div className="rounded-md border border-dashed border-border/70 bg-background/40 px-4 py-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <Repeat className="h-4 w-4" />
                Recurring rule otomatis
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary h-4 w-4" />
            <CardTitle>Recurring Otomatis</CardTitle>
          </div>
          <CardDescription>Pola dari riwayat transaksi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dataset.detectedRecurring.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Belum ada pola recurring yang cukup kuat. Catat lebih banyak
              transaksi agar pola terdeteksi.
            </p>
          ) : (
            dataset.detectedRecurring.map((item) => (
              <div
                key={item.key}
                className="rounded-md border border-border/60 bg-background/60 px-4 py-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.merchantSample}</p>
                      <Badge variant="secondary">Auto-detected</Badge>
                      <Badge variant="outline">{item.cadence}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.categoryName ?? "Tanpa kategori"} -{" "}
                      {item.occurrences} kejadian, interval ~{item.intervalDays}{" "}
                      hari
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">
                    {formatCurrency(item.amount)}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    Berikutnya {formatShortDate(item.nextOccurrence)} - akurasi{" "}
                    {Math.round(item.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </SakuShell>
  );
}
