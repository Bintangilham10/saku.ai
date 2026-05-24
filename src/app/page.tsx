import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import {
  ArrowRight,
  Bot,
  PiggyBank,
  ReceiptText,
} from "lucide-react";

import { DashboardCharts } from "@/components/dashboard-charts";
import { ForecastCard } from "@/components/forecast-card";
import { QuickAddTransaction } from "@/components/quick-add-transaction";
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
import { formatCurrency, formatPercent, formatShortDate } from "@/lib/format";
import { getSakuDataset } from "@/lib/saku-data";

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function SignedOutLanding({ authEnabled }: { authEnabled: boolean }) {
  const highlights = [
    { title: "Transaksi", icon: ReceiptText },
    { title: "Budget", icon: PiggyBank },
    { title: "Chat AI", icon: Bot },
  ];

  return (
    <div className="min-h-screen py-4">
      <section className="relative mx-4 flex min-h-[calc(100vh-2rem)] max-w-6xl items-center overflow-hidden rounded-lg border border-border/70 bg-card shadow-sm sm:mx-6 lg:mx-auto">
        <div className="absolute inset-0 hidden p-4 opacity-70 sm:block lg:p-6">
          <div className="grid h-full gap-4 lg:grid-cols-[220px_1fr]">
            <div className="rounded-lg border border-border/70 bg-background/80 p-4">
              <div className="font-display text-2xl">Saku AI</div>
              <div className="mt-6 space-y-2">
                {["Dashboard", "Transaksi", "Budget", "Chat AI"].map((item, index) => (
                  <div
                    key={item}
                    className={
                      index === 0
                        ? "rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                        : "rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
                    }
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-border/70 bg-background/80 p-4">
              <div className="grid gap-3 md:grid-cols-3">
                {["Rp 1,8 jt", "Rp 3,2 jt", "42%"].map((item) => (
                  <div key={item} className="rounded-md border border-border/60 bg-card p-4">
                    <div className="h-2 w-16 rounded bg-muted" />
                    <div className="mt-4 text-xl font-semibold">{item}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex h-48 items-end gap-3 rounded-md border border-border/60 bg-card p-4">
                {[38, 58, 44, 76, 52, 88].map((height, index) => (
                  <div
                    key={height}
                    className={index % 2 ? "w-full rounded bg-chart-2" : "w-full rounded bg-chart-1"}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-border/60 bg-card p-4" />
                <div className="rounded-md border border-border/60 bg-card p-4" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-background/85" />

        <div className="relative w-full min-w-0 max-w-xl px-6 py-10 sm:px-10">
          <Badge variant="secondary">MVP Mahasiswa</Badge>
          <h1 className="font-display mt-5 text-4xl leading-tight sm:text-5xl">
            Saku AI
          </h1>
          <p className="mt-4 max-w-xs text-base text-muted-foreground sm:max-w-lg sm:text-lg">
            Dashboard ringkas untuk catat uang saku, pantau budget, dan ngobrol
            dengan AI finansial.
          </p>

          <div className="mt-6 grid max-w-xs gap-3 sm:flex sm:max-w-none">
            {authEnabled ? (
              <SignInButton mode="modal">
                <Button className="h-11 w-full px-6 sm:w-auto">
                  Mulai sekarang
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </SignInButton>
            ) : (
              <Button asChild className="h-11 w-full px-6 sm:w-auto">
                <Link href="/transactions">
                  Lihat demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild className="h-11 w-full px-6 sm:w-auto" variant="outline">
              <Link href="/chat">Coba chat</Link>
            </Button>
          </div>

          <div className="mt-8 grid max-w-xs gap-2 sm:max-w-none sm:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-center gap-2 rounded-md border border-border/70 bg-card/85 px-3 py-2 text-sm"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default async function Home() {
  const authEnabled = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
  const { userId } = authEnabled ? await auth() : { userId: null };

  if (!userId) {
    return <SignedOutLanding authEnabled={authEnabled} />;
  }

  const dataset = await getSakuDataset();

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
      subtitle="Arus kas, budget, dan transaksi terbaru dalam satu layar."
      title="Dashboard Keuangan"
      userName={dataset.userName}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <SummaryCard
          hint={`Periode aktif ${dataset.periodLabel}`}
          label="Saldo bersih"
          value={formatCurrency(dataset.summary.balance)}
        />
        <SummaryCard
          hint={`${dataset.summary.transactionCount} transaksi bulan ini`}
          label="Pemasukan bulan ini"
          value={formatCurrency(dataset.summary.monthlyIncome)}
        />
        <SummaryCard
          hint="Total pengeluaran bulan berjalan"
          label="Pengeluaran bulan ini"
          value={formatCurrency(dataset.summary.monthlyExpenses)}
        />
        <SummaryCard
          hint="Semakin tinggi, semakin banyak sisa dana"
          label="Savings rate"
          value={formatPercent(dataset.summary.savingsRate)}
        />
        <ForecastCard forecast={dataset.forecast} />
      </div>

      {dataset.alerts.length ? (
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Alert Budget</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {dataset.alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-md border border-border/60 bg-background/60 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-medium">{alert.categoryName}</p>
                  <Badge
                    variant={alert.severity === "danger" ? "destructive" : "secondary"}
                  >
                    {Math.round(alert.progress * 100)}%
                  </Badge>
                </div>
                <Progress value={Math.min(alert.progress * 100, 100)} />
                <p className="mt-3 text-sm text-muted-foreground">
                  {alert.message}
                </p>
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

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataset.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col gap-2 rounded-md border border-border/60 bg-background/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {transaction.merchant ?? transaction.description ?? "Transaksi"}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {transaction.categoryName ?? "Tanpa kategori"} -{" "}
                    {transaction.accountName ?? "Tanpa akun"} -{" "}
                    {formatShortDate(transaction.date)}
                  </p>
                </div>
                <p
                  className={
                    transaction.type === "credit"
                      ? "shrink-0 font-medium text-primary"
                      : "shrink-0 font-medium text-foreground"
                  }
                >
                  {transaction.type === "credit" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SakuShell>
  );
}
