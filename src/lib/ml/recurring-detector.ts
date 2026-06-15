import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

import type { Transaction } from "@/lib/saku-types";
import { coefficientOfVariation, median } from "@/lib/ml/stats";
import type { RecurringCandidate } from "@/lib/ml/types";
import { bucketAmount, normalizeMerchant } from "@/lib/ml/recurring-utils";

const MIN_OCCURRENCES = 3;
const MIN_SPAN_DAYS = 45;

function classifyCadence(intervalDays: number): RecurringCandidate["cadence"] {
  if (intervalDays >= 6 && intervalDays <= 8) {
    return "weekly";
  }

  if (intervalDays >= 13 && intervalDays <= 16) {
    return "biweekly";
  }

  if (intervalDays >= 26 && intervalDays <= 33) {
    return "monthly";
  }

  return "irregular";
}

export function detectRecurringTransactions(transactions: Transaction[]): RecurringCandidate[] {
  const debits = transactions.filter(
    (transaction) => transaction.type === "debit" && transaction.merchant,
  );

  const groups = new Map<string, Transaction[]>();

  for (const transaction of debits) {
    const normalized = normalizeMerchant(transaction.merchant);

    if (!normalized) {
      continue;
    }

    const key = `${normalized}__${bucketAmount(transaction.amount)}`;
    const existing = groups.get(key) ?? [];
    existing.push(transaction);
    groups.set(key, existing);
  }

  const candidates: RecurringCandidate[] = [];

  for (const [key, items] of groups.entries()) {
    if (items.length < MIN_OCCURRENCES) {
      continue;
    }

    const sorted = [...items].sort((left, right) => left.date.localeCompare(right.date));
    const firstDate = parseISO(sorted[0].date);
    const lastDate = parseISO(sorted[sorted.length - 1].date);
    const spanDays = differenceInCalendarDays(lastDate, firstDate);

    if (spanDays < MIN_SPAN_DAYS) {
      continue;
    }

    const intervals: number[] = [];

    for (let index = 1; index < sorted.length; index += 1) {
      intervals.push(
        differenceInCalendarDays(
          parseISO(sorted[index].date),
          parseISO(sorted[index - 1].date),
        ),
      );
    }

    const intervalMedian = median(intervals);
    const cv = coefficientOfVariation(intervals);

    if (cv > 0.5) {
      continue;
    }

    const confidence = Math.max(0, Math.min(1, 1 - cv));
    const nextOccurrence = addDays(lastDate, Math.round(intervalMedian));
    const sample = sorted[sorted.length - 1];

    candidates.push({
      key,
      merchantNormalized: key.split("__")[0],
      merchantSample: sample.merchant ?? key,
      categoryId: sample.categoryId,
      categoryName: sample.categoryName ?? null,
      amount: bucketAmount(sample.amount),
      intervalDays: Math.round(intervalMedian),
      occurrences: sorted.length,
      lastDate: sample.date,
      nextOccurrence: format(nextOccurrence, "yyyy-MM-dd"),
      confidence: Number(confidence.toFixed(2)),
      cadence: classifyCadence(intervalMedian),
    });
  }

  return candidates.sort((left, right) => right.confidence - left.confidence);
}
