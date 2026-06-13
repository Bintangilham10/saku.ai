import { Landmark, Wallet } from "lucide-react"

import { SakuShell } from "@/components/saku-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatShortDate } from "@/lib/format"
import { getSakuDataset } from "@/lib/saku-data"

export default async function AccountsPage() {
  const dataset = await getSakuDataset()
  const balanceByAccount = new Map<string, number>()

  dataset.transactions.forEach((transaction) => {
    if (!transaction.accountId) {
      return
    }

    const current = balanceByAccount.get(transaction.accountId) ?? 0
    balanceByAccount.set(
      transaction.accountId,
      current + (transaction.type === "credit" ? transaction.amount : -transaction.amount)
    )
  })

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
                  <p className="text-muted-foreground text-sm">Saldo</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatCurrency(balanceByAccount.get(account.id) ?? 0)}
                  </p>
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
