"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Account, Category, TransactionType } from "@/lib/saku-types";
import { cn } from "@/lib/utils";

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
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
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
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="pb-0">
        <CardTitle>Tambah Transaksi</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2 text-sm">
              <span>Tipe</span>
              <div className="grid grid-cols-2 rounded-md border border-input bg-muted p-1">
                {[
                  { value: "debit", label: "Keluar" },
                  { value: "credit", label: "Masuk" },
                ].map((item) => (
                  <button
                    key={item.value}
                    className={cn(
                      "h-8 rounded-sm text-sm font-medium transition-colors",
                      type === item.value
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    type="button"
                    onClick={() => setType(item.value as TransactionType)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
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

          <div className="grid gap-3 sm:grid-cols-2">
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
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span>Kategori</span>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
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
              placeholder="Opsional"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          {status ? (
            <p className="text-sm text-muted-foreground">{status}</p>
          ) : null}

          <Button className="w-full sm:w-fit" disabled={submitting || !amount} type="submit">
            <Plus className="h-4 w-4" />
            {submitting ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
