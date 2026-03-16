import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { SignInButton } from "@clerk/nextjs";
import {
  ArrowRight,
  Bot,
  CircleDollarSign,
  PiggyBank,
  ReceiptText,
  TrendingDown,
} from "lucide-react";

import { DashboardCharts } from "@/components/dashboard-charts";
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
    <Card className="rounded-[1.5rem] border-border/70">
      <CardHeader className="pb-3">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{hint}</p>
      </CardContent>
    </Card>
  );
}

function SignedOutLanding() {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 shadow-lg backdrop-blur">
          <div className="grid gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-12">
            <div className="space-y-6">
              <Badge variant="secondary">MVP Mahasiswa</Badge>
              <div className="space-y-4">
                <h1 className="font-display max-w-3xl text-4xl leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  Satu dashboard buat catat uang saku, jaga budget, dan tanya AI.
                </h1>
                <p className="text-muted-foreground max-w-2xl text-base leading-relaxed sm:text-lg">
                  Saku AI menggabungkan pencatatan transaksi, budget tracker,
                  goals, dan chat assistant supaya mahasiswa bisa ambil keputusan
                  finansial yang lebih cepat dan masuk akal.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <SignInButton mode="modal">
                  <Button className="h-11 px-6">
                    Mulai sekarang
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </SignInButton>
                <Button asChild className="h-11 px-6" variant="outline">
                  <Link href="#fitur">Lihat fitur inti</Link>
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    title: "Transaksi cepat",
                    text: "Tambah pemasukan dan pengeluaran dalam beberapa klik.",
                    icon: ReceiptText,
                  },
                  {
                    title: "Budget mahasiswa",
                    text: "Pantau kos, makan, transport, dan nongkrong per bulan.",
                    icon: PiggyBank,
                  },
                  {
                    title: "Saran AI",
                    text: "Tanya strategi hemat dengan konteks data keuanganmu.",
                    icon: Bot,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <Card
                      key={item.title}
                      className="rounded-[1.5rem] border-border/70 bg-background/60"
                    >
                      <CardHeader className="gap-3">
                        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-2xl">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <CardDescription className="mt-1 text-sm">
                            {item.text}
                          </CardDescription>
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Card className="rounded-[1.75rem] border-border/70 bg-background/65">
              <CardHeader>
                <CardTitle>Gambaran MVP</CardTitle>
                <CardDescription>
                  Scope mengikuti `tech_doc.md` untuk dashboard finansial mahasiswa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    label: "Catat transaksi manual + siap untuk import CSV",
                    value: "01",
                  },
                  {
                    label: "Pantau saldo, tren bulanan, dan progres budget",
                    value: "02",
                  },
                  {
                    label: "Kelola akun, recurring cost, dan target tabungan",
                    value: "03",
                  },
                  {
                    label: "Chat AI berbasis ringkasan keuangan pengguna",
                    value: "04",
                  },
                ].map((item) => (
                  <div
                    key={item.value}
                    className="flex items-start gap-4 rounded-[1.25rem] border border-border/60 bg-card/80 px-4 py-4"
                  >
                    <div className="text-primary font-display text-2xl">
                      {item.value}
                    </div>
                    <p className="text-sm leading-relaxed">{item.label}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" id="fitur">
          {[
            {
              title: "Saldo terpusat",
              text: "Gabungkan uang saku, freelance, dan tabungan dalam satu layar.",
              icon: CircleDollarSign,
            },
            {
              title: "Alert budget",
              text: "Dapat notifikasi ketika kategori menyentuh 90% limit.",
              icon: TrendingDown,
            },
            {
              title: "Kategori khas mahasiswa",
              text: "Kos, makan, akademik, transport, dan nongkrong siap pakai.",
              icon: ReceiptText,
            },
            {
              title: "Goal tracker",
              text: "Pantau progres target seperti beli laptop atau dana darurat.",
              icon: PiggyBank,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="rounded-[1.5rem] border-border/70">
                <CardHeader>
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-2xl">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="mt-4 text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.text}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return <SignedOutLanding />;
  }

  const dataset = await getSakuDataset();

  return (
    <SakuShell
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/transactions">Lihat transaksi</Link>
          </Button>
          <Button asChild>
            <Link href="/chat">Buka chat AI</Link>
          </Button>
        </>
      }
      mode={dataset.mode}
      subtitle="Pantau arus kas, cek budget kritis, dan catat transaksi baru tanpa pindah context."
      title="Dashboard Keuangan"
      userName={dataset.userName}
    >
      <div className="grid gap-4 xl:grid-cols-4">
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
      </div>

      {dataset.alerts.length ? (
        <Card className="rounded-[1.5rem] border-border/70">
          <CardHeader>
            <CardTitle>Alert Budget</CardTitle>
            <CardDescription>
              Kategori berikut sudah mendekati atau melewati limit bulanan.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {dataset.alerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-[1.25rem] border border-border/60 bg-background/60 p-4"
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
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
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

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <QuickAddTransaction
          accounts={dataset.accounts}
          canPersist={dataset.canPersist}
          categories={dataset.categories}
        />

        <Card className="rounded-[1.5rem] border-border/70">
          <CardHeader>
            <CardTitle>Transaksi Terbaru</CardTitle>
            <CardDescription>
              Ringkasan aktivitas finansial yang paling baru masuk.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dataset.recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-[1.25rem] border border-border/60 bg-background/60 px-4 py-3"
              >
                <div>
                  <p className="font-medium">
                    {transaction.merchant ?? transaction.description ?? "Transaksi"}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {transaction.categoryName ?? "Tanpa kategori"} -{" "}
                    {transaction.accountName ?? "Tanpa akun"} -{" "}
                    {formatShortDate(transaction.date)}
                  </p>
                </div>
                <p
                  className={
                    transaction.type === "credit"
                      ? "font-medium text-primary"
                      : "font-medium text-foreground"
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
