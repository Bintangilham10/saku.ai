import { Landmark, Wallet } from "lucide-react";

import { SakuShell } from "@/components/saku-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { getSakuDataset } from "@/lib/saku-data";

export default async function AccountsPage() {
  const dataset = await getSakuDataset();
  const balanceByAccount = new Map<string, number>();

  dataset.transactions.forEach((transaction) => {
    if (!transaction.accountId) {
      return;
    }

    const current = balanceByAccount.get(transaction.accountId) ?? 0;
    balanceByAccount.set(
      transaction.accountId,
      current + (transaction.type === "credit" ? transaction.amount : -transaction.amount),
    );
  });

  return (
    <SakuShell
      mode={dataset.mode}
      subtitle="Saldo per dompet, bank, e-wallet, dan tabungan."
      title="Akun"
      userName={dataset.userName}
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {dataset.accounts.map((account) => {
          const transactions = dataset.transactions.filter(
            (transaction) => transaction.accountId === account.id,
          );
          const lastUsed = transactions[0]?.date ?? null;
          const icon =
            account.type === "bank" || account.type === "tabungan" ? Landmark : Wallet;
          const Icon = icon;

          return (
            <Card key={account.id} className="border-border/70">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-3 text-lg">{account.name}</CardTitle>
                <CardDescription>
                  {account.type}
                  {account.institution ? ` - ${account.institution}` : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-sm">Estimasi saldo</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatCurrency(balanceByAccount.get(account.id) ?? 0)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-border/60 bg-background/60 p-3">
                    <p className="text-muted-foreground">Aktivitas</p>
                    <p className="mt-1 font-medium">{transactions.length} transaksi</p>
                  </div>
                  <div className="rounded-md border border-border/60 bg-background/60 p-3">
                    <p className="text-muted-foreground">Terakhir dipakai</p>
                    <p className="mt-1 font-medium">
                      {lastUsed ? formatShortDate(lastUsed) : "Belum ada"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </SakuShell>
  );
}
