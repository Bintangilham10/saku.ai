export type DataMode = "demo" | "live";

export type AccountType = "dompet" | "bank" | "ewallet" | "tabungan";
export type TransactionType = "debit" | "credit";
export type TransactionStatus = "pending" | "cleared";
export type BudgetPeriod = "bulanan" | "mingguan";

export type AppUserProfile = {
  id: string;
  clerkId: string;
  email: string | null;
  displayName: string | null;
  preferredCurrency: string;
  timezone: string;
};

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  institution: string | null;
  createdAt?: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
};

export type Transaction = {
  id: string;
  userId?: string;
  accountId: string | null;
  amount: number;
  currency: string;
  type: TransactionType;
  categoryId: string | null;
  merchant: string | null;
  description: string | null;
  date: string;
  status: TransactionStatus;
  imported: boolean;
  tags: string[];
  accountName?: string | null;
  categoryName?: string | null;
  categoryColor?: string | null;
};

export type Budget = {
  id: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  period: BudgetPeriod;
  limitAmount: number;
  spentAmount: number;
  progress: number;
  status: "safe" | "warning" | "danger";
  startDate: string | null;
  endDate: string | null;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  targetDate: string | null;
  note: string | null;
};

export type RecurringItem = {
  id: string;
  label: string;
  amount: number;
  categoryName: string;
  nextOccurrence: string | null;
};

export type DashboardSummary = {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  budgetUsage: number;
  transactionCount: number;
};

export type BudgetAlert = {
  id: string;
  categoryName: string;
  limitAmount: number;
  spentAmount: number;
  progress: number;
  severity: "warning" | "danger";
  message: string;
};

export type MonthlyTrend = {
  month: string;
  income: number;
  expenses: number;
  balance: number;
};

export type CategoryBreakdown = {
  name: string;
  amount: number;
  share: number;
  color: string;
};

export type SakuDataset = {
  mode: DataMode;
  canPersist: boolean;
  userName: string;
  periodLabel: string;
  summary: DashboardSummary;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  recentTransactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  alerts: BudgetAlert[];
  monthlyTrend: MonthlyTrend[];
  categoryBreakdown: CategoryBreakdown[];
  recurringItems: RecurringItem[];
  aiSummary: string;
};

export type TransactionInput = {
  accountId: string | null;
  amount: number;
  currency?: string;
  type: TransactionType;
  categoryId: string | null;
  merchant: string | null;
  description: string | null;
  date: string;
  status?: TransactionStatus;
  imported?: boolean;
  tags?: string[];
};
