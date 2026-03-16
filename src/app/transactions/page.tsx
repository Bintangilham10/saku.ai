import Link from "next/link";
import { Download, Upload } from "lucide-react";

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
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/chat">Tanya AI</Link>
          </Button>
        </>
      }
      mode={dataset.mode}
      subtitle="Semua transaksi tersusun berdasarkan tanggal, kategori, dan akun agar mudah dilacak."
      title="Transactions"
      userName={dataset.userName}
    >
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <QuickAddTransaction
          accounts={dataset.accounts}
          canPersist={dataset.canPersist}
          categories={dataset.categories}
        />

        <Card className="rounded-[1.5rem] border-border/70">
          <CardHeader>
            <CardTitle>Catatan MVP</CardTitle>
            <CardDescription>
              Struktur API dan schema sudah siap untuk extend ke import CSV dan
              inline edit berikutnya.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Endpoint `GET/POST /api/transactions` sudah tersedia untuk list dan
              penambahan transaksi baru.
            </p>
            <p>
              Budget, chart, dan chat AI membaca sumber data yang sama agar
              insight tetap konsisten.
            </p>
            <p>
              Saat mode demo aktif, UI tetap bisa dipreview walau database live
              belum terhubung.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.5rem] border-border/70">
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>
            {dataset.transactions.length} transaksi tersedia dalam daftar saat ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dataset.transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex flex-col gap-3 rounded-[1.25rem] border border-border/60 bg-background/60 px-4 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">
                    {transaction.merchant ?? transaction.description ?? "Transaksi"}
                  </p>
                  <Badge variant="outline">
                    {transaction.categoryName ?? "Tanpa kategori"}
                  </Badge>
                  <Badge variant="secondary">{transaction.accountName ?? "Tanpa akun"}</Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  {formatShortDate(transaction.date)} -{" "}
                  {transaction.description ?? "Tidak ada catatan tambahan"}
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
                <p className="text-muted-foreground text-sm">
                  Status {transaction.status}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </SakuShell>
  );
}
