import type { MoneyTotal, TransactionType } from "@/lib/saku-types";

export type BalanceTransaction = {
  amount_minor: string | number | bigint;
  currency?: string | null;
  type: TransactionType;
  status?: string | null;
  date: string;
};

function toAmountMinor(value: string | number | bigint) {
  return typeof value === "bigint" ? value : BigInt(value);
}

function fromMinorAmount(minor: bigint, decimals = 2) {
  return Number(minor) / 10 ** decimals;
}

function formatMinorAmount(minor: bigint, currency = "IDR", decimals = 2) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency }).format(
    fromMinorAmount(minor, decimals),
  );
}

export function signedAmountMinor(transaction: BalanceTransaction) {
  const amountMinor = toAmountMinor(transaction.amount_minor);
  return transaction.type === "credit" ? amountMinor : -amountMinor;
}

export function sumByCurrency(
  transactions: BalanceTransaction[],
  getAmountMinor: (transaction: BalanceTransaction) => bigint,
): MoneyTotal[] {
  const totals = new Map<string, bigint>();

  for (const transaction of transactions) {
    const currency = transaction.currency ?? "IDR";
    totals.set(
      currency,
      (totals.get(currency) ?? BigInt(0)) + getAmountMinor(transaction),
    );
  }

  return [...totals.entries()]
    .map(([currency, amountMinor]) => ({
      currency,
      total: fromMinorAmount(amountMinor),
      amountMinor: amountMinor.toString(),
      formatted: formatMinorAmount(amountMinor, currency),
    }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

export function findCurrencyTotal(totals: MoneyTotal[], currency = "IDR") {
  return totals.find((item) => item.currency === currency)?.total ?? 0;
}

export function isSettledTransaction(
  transaction: BalanceTransaction,
  now = new Date(),
) {
  return transaction.status !== "pending" && new Date(transaction.date) <= now;
}

export function getMoneyTotalMinor(totals: MoneyTotal[], currency: string) {
  return totals.find((item) => item.currency === currency)?.amountMinor ?? "0";
}

export function buildBalanceSummary(
  transactions: BalanceTransaction[],
  now = new Date(),
) {
  const settledTransactions = transactions.filter((transaction) =>
    isSettledTransaction(transaction, now),
  );
  const availableBalances = sumByCurrency(settledTransactions, signedAmountMinor);
  const projectedBalances = sumByCurrency(transactions, signedAmountMinor);

  return {
    availableBalance: findCurrencyTotal(availableBalances),
    projectedBalance: findCurrencyTotal(projectedBalances),
    pendingCount: transactions.length - settledTransactions.length,
    availableBalances,
    projectedBalances,
  };
}
