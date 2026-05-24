import Link from "next/link";
import { Download, MessageSquareText, Upload } from "lucide-react";

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
import { formatCurrency, formatShortDate } from "@/lib/format";
import { getSakuDataset } from "@/lib/saku-data";

export default async function TransactionsPage() {
  const dataset = await getSakuDataset();

  return (
    <SakuShell
      actions={
        <>
          <Button variant="outline">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/chat">
              <MessageSquareText className="h-4 w-4" />
              Chat AI
            </Link>
          </Button>
        </>
      }
      mode={dataset.mode}
      subtitle="Tambah, import, dan cek aktivitas uangmu."
      title="Transaksi"
      userName={dataset.userName}
    >
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <QuickAddTransaction
          accounts={dataset.accounts}
          canPersist={dataset.canPersist}
          categories={dataset.categories}
        />

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Ringkasan</CardTitle>
            <CardDescription>
              {dataset.mode === "live" ? "Data live" : "Mode demo"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: "Total", value: `${dataset.transactions.length} transaksi` },
              { label: "Masuk", value: formatCurrency(dataset.summary.monthlyIncome) },
              { label: "Keluar", value: formatCurrency(dataset.summary.monthlyExpenses) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-md border border-border/60 bg-background/60 p-4"
              >
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-semibold tabular-nums">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70">
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>{dataset.transactions.length} transaksi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dataset.transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="grid gap-3 rounded-md border border-border/60 bg-background/60 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">
                    {transaction.merchant ?? transaction.description ?? "Transaksi"}
                  </p>
                  <Badge variant="outline">
                    {transaction.categoryName ?? "Tanpa kategori"}
                  </Badge>
                  <Badge variant="secondary">{transaction.accountName ?? "Tanpa akun"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatShortDate(transaction.date)}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p
                  className={
                    transaction.type === "credit"
                      ? "font-semibold text-primary"
                      : "font-semibold"
                  }
                >
                  {transaction.type === "credit" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>
                <p className="text-sm text-muted-foreground">{transaction.status}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </SakuShell>
  );
}
