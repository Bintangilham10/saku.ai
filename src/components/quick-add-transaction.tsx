"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Account, Category, TransactionType } from "@/lib/saku-types";

type QuickAddTransactionProps = {
  accounts: Account[];
  categories: Category[];
  canPersist: boolean;
};

const today = new Date().toISOString().slice(0, 10);

export function QuickAddTransaction({
  accounts,
  categories,
  canPersist,
}: QuickAddTransactionProps) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>("debit");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canPersist) {
      setStatus("Mode demo aktif. Hubungkan Supabase untuk menyimpan transaksi.");
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          amount: Number(amount),
          date,
          merchant: merchant || null,
          description: description || null,
          accountId: accountId || null,
          categoryId: categoryId || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Gagal menyimpan transaksi.");
      }

      setAmount("");
      setMerchant("");
      setDescription("");
      setStatus("Transaksi berhasil disimpan.");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Gagal menyimpan transaksi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="rounded-[1.5rem] border-border/70">
      <CardHeader>
        <CardTitle>Quick Add</CardTitle>
        <CardDescription>
          Catat transaksi harian tanpa keluar dari dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>Tipe</span>
              <select
                className="border-input bg-background h-10 rounded-md border px-3"
                value={type}
                onChange={(event) => setType(event.target.value as TransactionType)}
              >
                <option value="debit">Pengeluaran</option>
                <option value="credit">Pemasukan</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span>Nominal</span>
              <Input
                inputMode="numeric"
                min="0"
                placeholder="25000"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>Tanggal</span>
              <Input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              <span>Akun</span>
              <select
                className="border-input bg-background h-10 rounded-md border px-3"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>Kategori</span>
              <select
                className="border-input bg-background h-10 rounded-md border px-3"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              <span>Merchant</span>
              <Input
                placeholder="Warmindo / Gojek / Transfer"
                value={merchant}
                onChange={(event) => setMerchant(event.target.value)}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm">
            <span>Catatan</span>
            <Input
              placeholder="Contoh: makan malam habis kelas"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          {status ? (
            <p className="text-sm text-muted-foreground">{status}</p>
          ) : null}

          <Button disabled={submitting || !amount} type="submit">
            {submitting ? "Menyimpan..." : "Simpan transaksi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
