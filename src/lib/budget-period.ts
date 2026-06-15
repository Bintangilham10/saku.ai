import {
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { BudgetPeriod } from "@/lib/saku-types";

type BudgetPeriodInput = {
  period: BudgetPeriod;
  startDate: string | null;
  endDate: string | null;
};

const DATE_FORMAT = "yyyy-MM-dd";
const MONDAY = 1;

function periodBounds(period: BudgetPeriod, reference: Date) {
  if (period === "mingguan") {
    return {
      start: startOfWeek(reference, { weekStartsOn: MONDAY }),
      end: endOfWeek(reference, { weekStartsOn: MONDAY }),
    };
  }

  return {
    start: startOfMonth(reference),
    end: endOfMonth(reference),
  };
}

export function resolveBudgetDateRange(
  budget: BudgetPeriodInput,
  reference = new Date(),
) {
  const anchor = budget.startDate
    ? parseISO(budget.startDate)
    : budget.endDate
      ? parseISO(budget.endDate)
      : reference;
  const defaults = periodBounds(budget.period, anchor);

  return {
    startDate: budget.startDate ?? format(defaults.start, DATE_FORMAT),
    endDate: budget.endDate ?? format(defaults.end, DATE_FORMAT),
  };
}

export function isDateWithinBudgetRange(
  date: string,
  range: ReturnType<typeof resolveBudgetDateRange>,
) {
  return date >= range.startDate && date <= range.endDate;
}
