import Link from "next/link"
import type { ReactNode } from "react"
import { MessageSquareText } from "lucide-react"

import { QuickAddTransaction } from "@/components/quick-add-transaction"
import { SakuShell } from "@/components/saku-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatShortDate } from "@/lib/format"
import { formatMinor } from "@/lib/money"
import { getSakuDataset } from "@/lib/saku-data"
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

export default async function TransactionsPage() {
  const dataset = await getSakuDataset()
  const visibleTransactions = dataset.transactions.slice(0, 100)
  const summaryItems: Array<{ label: string; value: ReactNode }> = [
    { label: "Total", value: `${dataset.transactions.length} transaksi` },
    { label: "Masuk", value: <MoneyTotalLines totals={dataset.summary.monthlyIncomeByCurrency} /> },
    {
      label: "Keluar",
      value: <MoneyTotalLines totals={dataset.summary.monthlyExpensesByCurrency} />,
    },
  ]

  return (
    <SakuShell
      actions={
        <Button asChild>
          <Link href="/chat">
            <MessageSquareText className="h-4 w-4" />
            Chat AI
          </Link>
        </Button>
      }
      mode={dataset.mode}
      subtitle="Uang masuk dan keluar."
      title="Transaksi"
      userName={dataset.userName}
    >
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <QuickAddTransaction
          accounts={dataset.accounts}
          canPersist={dataset.canPersist}
          categories={dataset.categories}
        />

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-0">
            <CardTitle>Ringkasan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="border-border/60 bg-background/50 rounded-md border p-3"
              >
                <p className="text-muted-foreground text-sm">{item.label}</p>
                <p className="mt-1 font-semibold tabular-nums">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-0">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Riwayat</CardTitle>
            <Badge variant="outline">{dataset.transactions.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {visibleTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="border-border/60 bg-background/50 grid gap-3 rounded-md border px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">
                    {transaction.merchant ?? transaction.description ?? "Transaksi"}
                  </p>
                  <Badge variant="outline">{transaction.categoryName ?? "Tanpa kategori"}</Badge>
                  <Badge variant="secondary">{transaction.accountName ?? "Tanpa akun"}</Badge>
                </div>
                <p className="text-muted-foreground text-sm">{formatShortDate(transaction.date)}</p>
              </div>
              <div className="text-left md:text-right">
                <p
                  className={
                    transaction.type === "credit" ? "text-primary font-semibold" : "font-semibold"
                  }
                >
                  {transaction.type === "credit" ? "+" : "-"}
                  {formatMinor(BigInt(transaction.amount_minor), transaction.currency)}
                </p>
                <p className="text-muted-foreground text-sm">{transaction.status}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </SakuShell>
  )
}
