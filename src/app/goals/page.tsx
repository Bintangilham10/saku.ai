import { CalendarDays, Repeat } from "lucide-react";

import { SakuShell } from "@/components/saku-shell";
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
      subtitle="Target tabungan dan pengeluaran rutin diletakkan berdampingan agar planning bulanan lebih realistis."
      title="Goals"
      userName={dataset.userName}
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {dataset.goals.map((goal) => (
            <Card key={goal.id} className="rounded-[1.5rem] border-border/70">
              <CardHeader>
                <CardTitle>{goal.name}</CardTitle>
                <CardDescription>
                  Target {formatCurrency(goal.targetAmount)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={goal.progress * 100} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                    <p className="text-muted-foreground text-sm">Terkumpul</p>
                    <p className="mt-1 font-medium">
                      {formatCurrency(goal.currentAmount)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                    <p className="text-muted-foreground text-sm">Target date</p>
                    <p className="mt-1 font-medium">
                      {goal.targetDate ? formatShortDate(goal.targetDate) : "Belum diatur"}
                    </p>
                  </div>
                </div>
                {goal.note ? (
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {goal.note}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-[1.5rem] border-border/70">
          <CardHeader>
            <CardTitle>Recurring Cost</CardTitle>
            <CardDescription>
              Pengeluaran berulang yang perlu diperhitungkan dalam strategi menabung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataset.recurringItems.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.25rem] border border-border/60 bg-background/60 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {item.categoryName}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.amount)}</p>
                </div>
                <div className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    Berikutnya{" "}
                    {item.nextOccurrence ? formatShortDate(item.nextOccurrence) : "belum diatur"}
                  </span>
                </div>
              </div>
            ))}

            <div className="rounded-[1.25rem] border border-dashed border-border/70 bg-background/40 px-4 py-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <Repeat className="h-4 w-4" />
                Ruang pengembangan phase 2
              </div>
              Tambahkan recurring rules otomatis untuk kos, UKT, langganan, atau
              cicilan kecil agar forecast akhir bulan makin akurat.
            </div>
          </CardContent>
        </Card>
      </div>
    </SakuShell>
  );
}
