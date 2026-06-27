import Link from "next/link"
import type { ReactNode } from "react"
import { auth } from "@clerk/nextjs/server"
import { Bot, ReceiptText, ShieldCheck } from "lucide-react"

import { DashboardCharts } from "@/components/dashboard-charts"
import { ForecastCard } from "@/components/forecast-card"
import { PocketLanding } from "@/components/landing/pocket-landing"
import { QuickAddTransaction } from "@/components/quick-add-transaction"
import { SakuMascot } from "@/components/saku-mascot"
import { SakuShell } from "@/components/saku-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { formatPercent, formatShortDate } from "@/lib/format"
import { formatMinor } from "@/lib/money"
import { getSakuDataset } from "@/lib/saku-data"
import { isClerkConfigured } from "@/lib/server-config"
import type { MoneyTotal } from "@/lib/saku-types"

function MoneyTotalLines({ totals }: { totals: MoneyTotal[] }) {
  if (!totals.length) {
    return <span className="font-sans font-bold tabular-nums">Rp 0</span>
  }

  return (
    <span className="space-y-1 font-sans font-bold tabular-nums">
      {totals.map((item) => (
        <span key={item.currency} className="block tabular-nums">
          {item.formatted}
        </span>
      ))}
    </span>
  )
}

function formatMoneyTotalsInline(totals: MoneyTotal[]) {
  return totals.length ? totals.map((item) => item.formatted).join(", ") : "Rp 0"
}

function SummaryCard({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <div className="pocket-card transition-all duration-200 hover:-translate-y-1 hover:border-[#109868]/40">
      <div className="flex items-center justify-between border-b border-[#e3d6c6] pb-3 mb-3">
        <span className="text-xs font-black tracking-wider uppercase text-[#85756e]">
          {label}
        </span>
      </div>
      <div className="text-2xl sm:text-3xl font-black tracking-tight text-[#3b2d28] dark:text-foreground tabular-nums leading-tight">
        {value}
      </div>
      <p className="mt-2 text-xs text-[#85756e] truncate font-bold">{hint}</p>
    </div>
  )
}

/* ==========================================================================
   AUTHENTICATED DASHBOARD (For logged-in users)
   Signed-out visitors get the animated <PocketLanding /> showcase instead.
   ========================================================================== */
export default async function Home() {
  const authEnabled = isClerkConfigured()
  const { userId } = authEnabled ? await auth() : { userId: null }

  if (!userId) {
    return <PocketLanding authEnabled={authEnabled} />
  }

  const dataset = await getSakuDataset()

  return (
    <SakuShell
      actions={
        <>
          <Button asChild variant="outline" className="rounded-xl font-bold border-[#e3d6c6] hover:bg-[#fcf9f2]">
            <Link href="/transactions">
              <ReceiptText className="h-4 w-4 mr-1.5 text-[#109868]" />
              Catat Transaksi
            </Link>
          </Button>
          <Button asChild className="rounded-xl font-bold shadow-xs bg-[#109868] text-white">
            <Link href="/chat">
              <Bot className="h-4 w-4 mr-1.5" />
              Tanya Saku.ai
            </Link>
          </Button>
        </>
      }
      mode={dataset.mode}
      subtitle="Ringkasan pintar saku harian Anda bulan ini."
      title="Ekosistem Dompet Sakumu"
      userName={dataset.userName}
    >
      {/* Mascot welcome banner */}
      <div className="flex items-center justify-between rounded-3xl border-2 border-[#109868]/30 bg-[#109868]/5 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <SakuMascot size="lg" variant="happy" />
          <div>
            <h2 className="text-lg font-black text-[#3b2d28] dark:text-foreground">
              Halo, {dataset.userName}! Saku Anda Dalam Kondisi Sehat.
            </h2>
            <p className="text-xs sm:text-sm text-[#85756e] mt-1 font-bold leading-relaxed">
              Pantau terus pengeluaranmu hari ini agar budget tetap aman.
            </p>
          </div>
        </div>
        <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex rounded-xl font-bold text-xs shrink-0 border-[#e3d6c6]">
          <Link href="/budgets">Lihat Insight</Link>
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
        <SummaryCard
          hint={
            dataset.summary.pendingCount > 0
              ? `+${dataset.summary.pendingCount} terjadwal - Proyeksi: ${formatMoneyTotalsInline(dataset.summary.projectedBalances)}`
              : dataset.periodLabel
          }
          label="Saldo Tersedia"
          value={<MoneyTotalLines totals={dataset.summary.availableBalances} />}
        />
        <SummaryCard
          hint={`${dataset.summary.transactionCount} catatan transaksi`}
          label="Masuk Bulan Ini"
          value={<MoneyTotalLines totals={dataset.summary.monthlyIncomeByCurrency} />}
        />
        <SummaryCard
          hint={dataset.periodLabel}
          label="Keluar Bulan Ini"
          value={<MoneyTotalLines totals={dataset.summary.monthlyExpensesByCurrency} />}
        />
        <SummaryCard
          hint="Rasio tabungan IDR"
          label="Tingkat Tabungan"
          value={formatPercent(dataset.summary.savingsRate)}
        />
        <ForecastCard forecast={dataset.forecast} />
      </div>

      {dataset.alerts.length ? (
        <div className="pocket-card p-6">
          <div className="pb-3 border-b border-[#e3d6c6] mb-5 flex items-center justify-between">
            <span className="font-black text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#109868]" /> Pantauan Kantong Budget
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {dataset.alerts.map((alert) => (
              <div
                key={alert.id}
                className="border-2 border-[#e3d6c6] bg-[var(--saku-paper)] rounded-2xl p-4 transition-all"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-bold text-sm">{alert.categoryName}</p>
                  <Badge variant={alert.severity === "danger" ? "destructive" : "secondary"} className="text-xs rounded-full px-2.5 font-black">
                    {Math.round(alert.progress * 100)}%
                  </Badge>
                </div>
                <Progress value={Math.min(alert.progress * 100, 100)} className="h-2.5 rounded-full" />
                <p className="text-[#85756e] mt-2 text-xs font-bold">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <DashboardCharts
        categoryBreakdown={dataset.categoryBreakdown}
        monthlyTrend={dataset.monthlyTrend}
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <QuickAddTransaction
          accounts={dataset.accounts}
          canPersist={dataset.canPersist}
          categories={dataset.categories}
        />

        <div className="pocket-card p-6">
          <div className="pb-3 border-b border-[#e3d6c6] mb-5 flex items-center justify-between">
            <span className="font-black text-lg flex items-center gap-2">
              <ReceiptText className="w-5 h-5 text-[#109868]" /> Catatan Jajan Terakhir
            </span>
            <Link href="/transactions" className="text-xs font-black text-[#109868] hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-3">
            {dataset.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border-2 border-[#e3d6c6] bg-[var(--saku-paper)] flex flex-col gap-2 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-sm text-foreground">
                    {transaction.merchant ?? transaction.description ?? "Transaksi"}
                  </p>
                  <p className="text-[#85756e] truncate text-xs mt-0.5 font-bold">
                    {transaction.categoryName ?? "Tanpa kategori"} •{" "}
                    {transaction.accountName ?? "Tanpa akun"} • {formatShortDate(transaction.date)}
                  </p>
                </div>
                <p
                  className={
                    transaction.type === "credit"
                      ? "text-[#109868] shrink-0 font-black text-sm tabular-nums"
                      : "text-foreground shrink-0 font-bold text-sm tabular-nums"
                  }
                >
                  {transaction.type === "credit" ? "+" : "-"}
                  {formatMinor(BigInt(transaction.amount_minor), transaction.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SakuShell>
  )
}
