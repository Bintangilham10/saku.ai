import Link from "next/link";

import { SakuShell } from "@/components/saku-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import { getSakuDataset } from "@/lib/saku-data";

export default async function BudgetsPage() {
  const dataset = await getSakuDataset();

  return (
    <SakuShell
      actions={
        <Button asChild>
          <Link href="/chat">Minta saran budget</Link>
        </Button>
      }
      mode={dataset.mode}
      subtitle="Pantau limit pengeluaran kategori mahasiswa dan lihat mana yang butuh intervensi lebih cepat."
      title="Budgets"
      userName={dataset.userName}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        {dataset.budgets.map((budget) => (
          <Card key={budget.id} className="rounded-[1.5rem] border-border/70">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>{budget.categoryName}</CardTitle>
                  <CardDescription>
                    Limit {formatCurrency(budget.limitAmount)} per {budget.period}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    budget.status === "danger"
                      ? "destructive"
                      : budget.status === "warning"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {Math.round(budget.progress * 100)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={Math.min(budget.progress * 100, 100)} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Terpakai</span>
                <span className="font-medium">{formatCurrency(budget.spentAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sisa budget</span>
                <span className="font-medium">
                  {formatCurrency(Math.max(budget.limitAmount - budget.spentAmount, 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[1.5rem] border-border/70">
        <CardHeader>
          <CardTitle>Alert & Rekomendasi</CardTitle>
          <CardDescription>
            Budget yang paling butuh perhatian sebelum akhir periode.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dataset.alerts.length ? (
            dataset.alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-[1.25rem] border border-border/60 bg-background/60 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{alert.categoryName}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {alert.message}
                    </p>
                  </div>
                  <Badge
                    variant={alert.severity === "danger" ? "destructive" : "secondary"}
                  >
                    {Math.round(alert.progress * 100)}%
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">
              Semua budget masih dalam zona aman bulan ini.
            </p>
          )}
        </CardContent>
      </Card>
    </SakuShell>
  );
}
