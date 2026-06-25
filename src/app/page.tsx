import Link from "next/link"
import type { ReactNode } from "react"
import { auth } from "@clerk/nextjs/server"
import { SignInButton } from "@clerk/nextjs"
import { ArrowRight, Bot, PiggyBank, ReceiptText } from "lucide-react"

import { DashboardCharts } from "@/components/dashboard-charts"
import { ForecastCard } from "@/components/forecast-card"
import { QuickAddTransaction } from "@/components/quick-add-transaction"
import { SakuShell } from "@/components/saku-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { formatPercent, formatShortDate } from "@/lib/format"
import { formatMinor } from "@/lib/money"
import { getSakuDataset } from "@/lib/saku-data"
import { isClerkConfigured } from "@/lib/server-config"
import type { MoneyTotal } from "@/lib/saku-types"

function MoneyTotalLines({ totals }: { totals: MoneyTotal[] }) {
  if (!totals.length) {
    return <span>{formatMinor(BigInt(0))}</span>
  }

  return (
    <span className="space-y-1">
      {totals.map((item) => (
        <span key={item.currency} className="block">
          {item.formatted}
        </span>
      ))}
    </span>
  )
}

function formatMoneyTotalsInline(totals: MoneyTotal[]) {
  return totals.length ? totals.map((item) => item.formatted).join(", ") : formatMinor(BigInt(0))
}

function SummaryCard({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="gap-2 pb-0">
        <CardDescription className="text-xs font-medium tracking-[0.08em] uppercase">
          {label}
        </CardDescription>
        <CardTitle className="text-2xl leading-tight font-semibold tabular-nums">
          {value}
        </CardTitle>
        <p className="text-muted-foreground truncate text-xs">{hint}</p>
      </CardHeader>
    </Card>
  )
}

function SignedOutLanding({ authEnabled }: { authEnabled: boolean }) {
  const highlights = [
    { title: "Transaksi", icon: ReceiptText },
    { title: "Budget", icon: PiggyBank },
    { title: "Chat AI", icon: Bot },
  ]

  return (
    <div className="min-h-screen py-4">
      <section className="border-border/60 bg-card/80 relative mx-4 flex min-h-[calc(100svh-2rem)] max-w-6xl items-center overflow-hidden rounded-md border sm:mx-6 lg:mx-auto">
        <div className="absolute inset-0 hidden p-4 opacity-80 sm:block lg:p-6">
          <div className="grid h-full gap-4 lg:grid-cols-[220px_1fr]">
            <div className="border-border/60 bg-background/80 rounded-md border p-4">
              <div className="font-display text-xl font-semibold">Saku AI</div>
              <div className="mt-6 space-y-2">
                {["Dashboard", "Transaksi", "Budget", "Chat AI"].map((item, index) => (
                  <div
                    key={item}
                    className={
                      index === 0
                        ? "bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm"
                        : "text-muted-foreground rounded-md px-3 py-2 text-sm"
                    }
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-border/60 bg-background/80 rounded-md border p-4">
              <div className="grid gap-3 md:grid-cols-3">
                {["Rp 1,8 jt", "Rp 3,2 jt", "42%"].map((item) => (
                  <div key={item} className="border-border/60 bg-card/90 rounded-md border p-4">
                    <div className="bg-muted h-2 w-16 rounded" />
                    <div className="mt-4 text-xl font-semibold">{item}</div>
                  </div>
                ))}
              </div>
              <div className="border-border/60 bg-card/90 mt-4 flex h-48 items-end gap-3 rounded-md border p-4">
                {[38, 58, 44, 76, 52, 88].map((height, index) => (
                  <div
                    key={height}
                    className={
                      index % 2 ? "bg-chart-2 w-full rounded" : "bg-chart-1 w-full rounded"
                    }
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="border-border/60 bg-card/90 rounded-md border p-4" />
                <div className="border-border/60 bg-card/90 rounded-md border p-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-background/86 absolute inset-0" />

        <div className="relative w-full max-w-xl min-w-0 px-6 py-10 sm:px-10">
          <h1 className="font-display text-4xl leading-tight font-semibold sm:text-5xl">Saku AI</h1>
          <p className="text-muted-foreground mt-4 max-w-sm text-base sm:text-lg">
            Dashboard uang saku yang ringkas, rapi, dan siap dipakai.
          </p>

          <div className="mt-6 grid max-w-xs gap-3 sm:flex sm:max-w-none">
            {authEnabled ? (
              <SignInButton mode="modal">
                <Button className="h-11 w-full px-6 sm:w-auto">
                  Masuk
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </SignInButton>
            ) : (
              <Button asChild className="h-11 w-full px-6 sm:w-auto">
                <Link href="/transactions">
                  Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild className="h-11 w-full px-6 sm:w-auto" variant="outline">
              <Link href="/chat">Chat</Link>
            </Button>
          </div>

          <div className="mt-8 grid max-w-xs gap-2 sm:max-w-none sm:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="border-border/60 bg-card/85 flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <Icon className="text-primary h-4 w-4" />
                  <span>{item.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default async function Home() {
  const authEnabled = isClerkConfigured()
  const { userId } = authEnabled ? await auth() : { userId: null }

  if (!userId) {
    return <SignedOutLanding authEnabled={authEnabled} />
  }

  const dataset = await getSakuDataset()

  return (
    <SakuShell
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/transactions">
              <ReceiptText className="h-4 w-4" />
              Transaksi
            </Link>
          </Button>
          <Button asChild>
            <Link href="/chat">
              <Bot className="h-4 w-4" />
              Chat AI
            </Link>
          </Button>
        </>
      }
      mode={dataset.mode}
      subtitle="Ringkasan arus kas bulan ini."
      title="Dashboard"
      userName={dataset.userName}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <SummaryCard
          hint={
            dataset.summary.pendingCount > 0
              ? `+${dataset.summary.pendingCount} pending/terjadwal - Proyeksi: ${formatMoneyTotalsInline(dataset.summary.projectedBalances)}`
              : dataset.periodLabel
          }
          label="Saldo Tersedia"
          value={<MoneyTotalLines totals={dataset.summary.availableBalances} />}
        />
        <SummaryCard
          hint={`${dataset.summary.transactionCount} transaksi`}
          label="Masuk"
          value={<MoneyTotalLines totals={dataset.summary.monthlyIncomeByCurrency} />}
        />
        <SummaryCard
          hint="Bulan ini"
          label="Keluar"
          value={<MoneyTotalLines totals={dataset.summary.monthlyExpensesByCurrency} />}
        />
        <SummaryCard
          hint="IDR bulan ini"
          label="Savings"
          value={formatPercent(dataset.summary.savingsRate)}
        />
        <ForecastCard forecast={dataset.forecast} />
      </div>

      {dataset.alerts.length ? (
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-0">
            <CardTitle>Budget</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {dataset.alerts.map((alert) => (
              <div
                key={alert.id}
                className="border-border/60 bg-background/50 rounded-md border p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium">{alert.categoryName}</p>
                  <Badge variant={alert.severity === "danger" ? "destructive" : "secondary"}>
                    {Math.round(alert.progress * 100)}%
                  </Badge>
                </div>
                <Progress value={Math.min(alert.progress * 100, 100)} />
                <p className="text-muted-foreground mt-3 text-sm">{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <DashboardCharts
        categoryBreakdown={dataset.categoryBreakdown}
        monthlyTrend={dataset.monthlyTrend}
      />

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <QuickAddTransaction
          accounts={dataset.accounts}
          canPersist={dataset.canPersist}
          categories={dataset.categories}
        />

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-0">
            <CardTitle>Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dataset.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border-border/60 bg-background/50 flex flex-col gap-2 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {transaction.merchant ?? transaction.description ?? "Transaksi"}
                  </p>
                  <p className="text-muted-foreground truncate text-sm">
                    {transaction.categoryName ?? "Tanpa kategori"} -{" "}
                    {transaction.accountName ?? "Tanpa akun"} - {formatShortDate(transaction.date)}
                  </p>
                </div>
                <p
                  className={
                    transaction.type === "credit"
                      ? "text-primary shrink-0 font-medium"
                      : "text-foreground shrink-0 font-medium"
                  }
                >
                  {transaction.type === "credit" ? "+" : "-"}
                  {formatMinor(BigInt(transaction.amount_minor), transaction.currency)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SakuShell>
  )
}
