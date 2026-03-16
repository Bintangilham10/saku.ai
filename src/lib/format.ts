import { format } from "date-fns";

const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const compactIdrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number) {
  return idrFormatter.format(value);
}

export function formatCompactCurrency(value: number) {
  return compactIdrFormatter.format(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function formatShortDate(value: Date | string) {
  return format(new Date(value), "dd MMM");
}

export function formatMonthLabel(value: Date | string) {
  return format(new Date(value), "MMM");
}

export function formatMonthHeading(value: Date | string) {
  return format(new Date(value), "MMMM yyyy");
}
