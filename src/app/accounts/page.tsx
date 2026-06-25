import { Landmark, Wallet } from "lucide-react"
import { parseISO } from "date-fns"

import { SakuShell } from "@/components/saku-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatShortDate } from "@/lib/format"
import { formatMinor, sumMinor } from "@/lib/money"
import { getSakuDataset } from "@/lib/saku-data"
import type { Transaction } from "@/lib/saku-types"

function signedAmountMinor(transaction: Transaction) {
  const amountMinor = BigInt(transaction.amount_minor)
  return transaction.type === "credit" ? amountMinor : -amountMinor
}

function isSettledTransaction(transaction: Transaction, now = new Date()) {
  return transaction.status !== "pending" && parseISO(transaction.date) <= now
}

export default async function AccountsPage() {
  const dataset = await getSakuDataset()
  const now = new Date()

  return (
    <SakuShell
      mode={dataset.mode}
      subtitle="Saldo per akun."
      title="Akun"
      userName={dataset.userName}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {dataset.accounts.map((account) => {
          const transactions = dataset.transactions.filter(
            (transaction) => transaction.accountId === account.id
          )
          const settledTransactions = transactions.filter((transaction) =>
            isSettledTransaction(transaction, now)
          )
          const availableMinor = sumMinor(settledTransactions.map(signedAmountMinor))
          const projectedMinor = sumMinor(transactions.map(signedAmountMinor))
          const pendingCount = transactions.length - settledTransactions.length
          const lastUsed = transactions[0]?.date ?? null
          const icon = account.type === "bank" || account.type === "tabungan" ? Landmark : Wallet
          const Icon = icon

          return (
            <Card key={account.id} className="border-border/60 bg-card/80">
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {account.type}
                      {account.institution ? ` - ${account.institution}` : ""}
                    </CardDescription>
                  </div>
                  <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-md">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatMinor(availableMinor, account.currency)}
                  </p>
                  <p className="text-muted-foreground text-sm">Tersedia</p>
                  {pendingCount > 0 ? (
                    <p className="text-muted-foreground mt-1 text-sm">
                      +{pendingCount} pending/terjadwal - Proyeksi:{" "}
                      {formatMinor(projectedMinor, account.currency)}
                    </p>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="border-border/60 bg-background/50 rounded-md border p-3">
                    <p className="text-muted-foreground">Aktivitas</p>
                    <p className="mt-1 font-medium">{transactions.length} transaksi</p>
                  </div>
                  <div className="border-border/60 bg-background/50 rounded-md border p-3">
                    <p className="text-muted-foreground">Terakhir</p>
                    <p className="mt-1 font-medium">
                      {lastUsed ? formatShortDate(lastUsed) : "Belum ada"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </SakuShell>
  )
}
