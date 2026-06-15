import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  isAfter,
  parseISO,
  subDays,
} from "date-fns";

import type { Transaction } from "@/lib/saku-types";
import {
  matchesRecurringCandidate,
  projectedRecurringSpend,
} from "@/lib/ml/recurring-utils";
import {
  clamp,
  exponentialSmoothing,
  mean,
  stdDev,
} from "@/lib/ml/stats";
import type {
  ForecastMode,
  ForecastResult,
  RecurringCandidate,
} from "@/lib/ml/types";

const COLD_START_DAYS_THRESHOLD = 14;
const RICH_DATA_DAYS_THRESHOLD = 90;
const HISTORY_WINDOW_DAYS = 30;
const SMOOTHING_ALPHA = 0.3;
const COLD_START_UNCERTAINTY_RATIO = 0.5;
const STANDARD_UNCERTAINTY_MULTIPLIER = 1.5;

function totalsByDate(transactions: Transaction[]) {
  const debitsByDay = new Map<string, number>();

  for (const transaction of transactions) {
    if (transaction.type !== "debit") {
      continue;
    }

    const current = debitsByDay.get(transaction.date) ?? 0;
    debitsByDay.set(transaction.date, current + transaction.amount);
  }

  return debitsByDay;
}

function dailySeriesForWindow(
  transactions: Transaction[],
  windowDays: number,
  reference: Date,
) {
  const debitsByDay = totalsByDate(transactions);
  const series: number[] = [];

  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const day = format(subDays(reference, offset), "yyyy-MM-dd");
    series.push(debitsByDay.get(day) ?? 0);
  }

  return series;
}

function computeCurrentBalance(transactions: Transaction[], asOf: Date) {
  return transactions.reduce((balance, transaction) => {
    if (isAfter(parseISO(transaction.date), asOf)) {
      return balance;
    }

    return transaction.type === "credit"
      ? balance + transaction.amount
      : balance - transaction.amount;
  }, 0);
}

function dataSpanDays(transactions: Transaction[], asOf: Date) {
  if (transactions.length === 0) {
    return 0;
  }

  const sorted = [...transactions].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const earliest = parseISO(sorted[0].date);

  return Math.max(0, differenceInCalendarDays(asOf, earliest));
}

function selectMode(spanDays: number, recurringDetected: boolean): ForecastMode {
  if (spanDays < COLD_START_DAYS_THRESHOLD) {
    return "cold-start";
  }

  if (spanDays >= RICH_DATA_DAYS_THRESHOLD && recurringDetected) {
    return "rich";
  }

  return "standard";
}

export function forecastEndOfMonth(
  transactions: Transaction[],
  recurring: RecurringCandidate[] = [],
  reference: Date = new Date(),
): ForecastResult {
  const horizon = endOfMonth(reference);
  const daysRemaining = Math.max(
    0,
    differenceInCalendarDays(horizon, reference),
  );
  const currentBalance = computeCurrentBalance(transactions, reference);
  const spanDays = dataSpanDays(transactions, reference);
  const mode = selectMode(spanDays, recurring.length > 0);

  const projectedRecurring = projectedRecurringSpend(recurring, reference, horizon);

  if (mode === "cold-start") {
    const series = dailySeriesForWindow(
      transactions,
      Math.max(spanDays, 1),
      reference,
    );
    const dailyAvg = series.length > 0 ? mean(series) : 0;
    const projectedVariable = dailyAvg * daysRemaining;
    const predicted = currentBalance - projectedVariable - projectedRecurring;
    const uncertainty = Math.abs(projectedVariable) * COLD_START_UNCERTAINTY_RATIO;

    return {
      predictedBalance: Math.round(predicted),
      lower: Math.round(predicted - uncertainty),
      upper: Math.round(predicted + uncertainty),
      asOf: format(reference, "yyyy-MM-dd"),
      horizonDate: format(horizon, "yyyy-MM-dd"),
      daysRemaining,
      mode,
      breakdown: {
        currentBalance: Math.round(currentBalance),
        projectedVariableSpend: Math.round(projectedVariable),
        projectedRecurringSpend: Math.round(projectedRecurring),
        projectedIncome: 0,
      },
    };
  }

  const window = Math.min(HISTORY_WINDOW_DAYS, spanDays);
  const variableTransactions = transactions.filter(
    (transaction) =>
      transaction.type === "debit" &&
      !recurring.some((candidate) =>
        matchesRecurringCandidate(transaction, candidate),
      ),
  );

  const series = dailySeriesForWindow(variableTransactions, window, reference);
  const smoothedDaily = exponentialSmoothing(series, SMOOTHING_ALPHA);
  const projectedVariable = smoothedDaily * daysRemaining;

  const predicted = currentBalance - projectedVariable - projectedRecurring;
  const dailyStd = stdDev(series);
  const uncertainty = clamp(
    dailyStd * STANDARD_UNCERTAINTY_MULTIPLIER * Math.sqrt(Math.max(daysRemaining, 1)),
    Math.abs(projectedVariable) * 0.1,
    Math.abs(projectedVariable) * (mode === "rich" ? 0.4 : 0.7),
  );

  return {
    predictedBalance: Math.round(predicted),
    lower: Math.round(predicted - uncertainty),
    upper: Math.round(predicted + uncertainty),
    asOf: format(reference, "yyyy-MM-dd"),
    horizonDate: format(horizon, "yyyy-MM-dd"),
    daysRemaining,
    mode,
    breakdown: {
      currentBalance: Math.round(currentBalance),
      projectedVariableSpend: Math.round(projectedVariable),
      projectedRecurringSpend: Math.round(projectedRecurring),
      projectedIncome: 0,
    },
  };
}
