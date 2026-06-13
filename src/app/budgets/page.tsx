import Link from "next/link"
import { MessageSquareText } from "lucide-react"

import { SakuShell } from "@/components/saku-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/format"
import { getSakuDataset } from "@/lib/saku-data"

export default async function BudgetsPage() {
  const dataset = await getSakuDataset()

  return (
    <SakuShell
      actions={
        <Button asChild>
          <Link href="/chat">
            <MessageSquareText className="h-4 w-4" />
            AI
          </Link>
        </Button>
      }
      mode={dataset.mode}
      subtitle="Limit per kategori."
      title="Budget"
      userName={dataset.userName}
    >
      <div className="grid gap-4 xl:grid-cols-2">
        {dataset.budgets.map((budget) => (
          <Card key={budget.id} className="border-border/60 bg-card/80">
            <CardHeader className="pb-0">
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
                <span className="font-medium tabular-nums">
                  {formatCurrency(budget.spentAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Sisa budget</span>
                <span className="font-medium tabular-nums">
                  {formatCurrency(Math.max(budget.limitAmount - budget.spentAmount, 0))}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-0">
          <CardTitle>Prioritas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {dataset.alerts.length ? (
            dataset.alerts.map((alert) => (
              <div
                key={alert.id}
                className="border-border/60 bg-background/50 rounded-md border px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{alert.categoryName}</p>
                    <p className="text-muted-foreground mt-1 text-sm">{alert.message}</p>
                  </div>
                  <Badge variant={alert.severity === "danger" ? "destructive" : "secondary"}>
                    {Math.round(alert.progress * 100)}%
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">Semua budget aman.</p>
          )}
        </CardContent>
      </Card>
    </SakuShell>
  )
}
