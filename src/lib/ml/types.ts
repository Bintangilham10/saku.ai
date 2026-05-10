export type RecurringCandidate = {
  key: string;
  merchantNormalized: string;
  merchantSample: string;
  categoryId: string | null;
  categoryName: string | null;
  amount: number;
  intervalDays: number;
  occurrences: number;
  lastDate: string;
  nextOccurrence: string;
  confidence: number;
  cadence: "weekly" | "biweekly" | "monthly" | "irregular";
};

export type ForecastMode = "cold-start" | "standard" | "rich";

export type ForecastResult = {
  predictedBalance: number;
  lower: number;
  upper: number;
  asOf: string;
  horizonDate: string;
  daysRemaining: number;
  mode: ForecastMode;
  breakdown: {
    currentBalance: number;
    projectedVariableSpend: number;
    projectedRecurringSpend: number;
    projectedIncome: number;
  };
};
