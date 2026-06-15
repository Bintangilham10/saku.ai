import { addDays, isAfter, isBefore, parseISO, startOfDay } from "date-fns";

const AMOUNT_BUCKET_IDR = 5000;

type RecurringMatchInput = {
  merchantNormalized: string;
  amount: number;
};

type TransactionMatchInput = {
  merchant: string | null;
  amount: number;
};

type RecurringProjectionInput = {
  amount: number;
  confidence: number;
  intervalDays: number;
  nextOccurrence: string;
};

export function normalizeMerchant(raw: string | null) {
  if (!raw) {
    return "";
  }

  return raw
    .toLowerCase()
    .replace(/\d+/g, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function bucketAmount(amount: number) {
  return Math.round(amount / AMOUNT_BUCKET_IDR) * AMOUNT_BUCKET_IDR;
}

export function matchesRecurringCandidate(
  transaction: TransactionMatchInput,
  candidate: RecurringMatchInput,
) {
  return (
    normalizeMerchant(transaction.merchant) === candidate.merchantNormalized &&
    bucketAmount(transaction.amount) === candidate.amount
  );
}

export function projectedRecurringSpend(
  recurring: RecurringProjectionInput[],
  asOf: Date,
  horizon: Date,
) {
  const firstProjectionDay = startOfDay(asOf);

  return recurring.reduce((total, candidate) => {
    const intervalDays = Math.max(1, Math.round(candidate.intervalDays));
    let occurrence = parseISO(candidate.nextOccurrence);

    while (isBefore(occurrence, firstProjectionDay)) {
      occurrence = addDays(occurrence, intervalDays);
    }

    let projected = 0;

    while (!isAfter(occurrence, horizon)) {
      projected += candidate.amount * candidate.confidence;
      occurrence = addDays(occurrence, intervalDays);
    }

    return total + projected;
  }, 0);
}
