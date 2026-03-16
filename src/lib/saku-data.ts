import { auth, currentUser } from "@clerk/nextjs/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  endOfMonth,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";

import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  hasSupabaseServiceRole,
  isSupabaseConfigured,
} from "@/lib/supabase";
import {
  demoAccounts,
  demoBudgets,
  demoCategories,
  demoGoals,
  demoRecurringItems,
  demoTransactions,
} from "@/lib/saku-demo";
import type {
  Account,
  AppUserProfile,
  Budget,
  BudgetAlert,
  Category,
  CategoryBreakdown,
  Goal,
  MonthlyTrend,
  RecurringItem,
  SakuDataset,
  Transaction,
  TransactionInput,
} from "@/lib/saku-types";

type SupabaseLikeClient = SupabaseClient;

const defaultCategories = [
  { name: "Uang Saku", color: "#157f5b" },
  { name: "Freelance", color: "#1d7874" },
  { name: "Kos", color: "#8c5e34" },
  { name: "Makan", color: "#f59e0b" },
  { name: "Nongkrong", color: "#e76f51" },
  { name: "Transport", color: "#3b82f6" },
  { name: "Akademik", color: "#6366f1" },
  { name: "Tabungan", color: "#16a34a" },
] as const;

const defaultAccounts = [
  { name: "Dompet Harian", type: "dompet", currency: "IDR", institution: null },
  { name: "Bank Kampus", type: "bank", currency: "IDR", institution: "BCA" },
  { name: "GoPay", type: "ewallet", currency: "IDR", institution: "Gojek" },
] as const;

const defaultBudgets = [
  { categoryName: "Makan", limitAmount: 900000 },
  { categoryName: "Nongkrong", limitAmount: 350000 },
  { categoryName: "Transport", limitAmount: 300000 },
  { categoryName: "Akademik", limitAmount: 400000 },
] as const;

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function getUserLabel(name: string | null | undefined) {
  return name?.trim() || "Mahasiswa";
}

function getMonthBounds(reference = new Date()) {
  return {
    start: startOfMonth(reference),
    end: endOfMonth(reference),
  };
}

function enrichTransactions(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
) {
  const accountMap = new Map(accounts.map((account) => [account.id, account]));
  const categoryMap = new Map(
    categories.map((category) => [category.id, category]),
  );

  return transactions
    .map((transaction) => {
      const account = transaction.accountId
        ? accountMap.get(transaction.accountId)
        : null;
      const category = transaction.categoryId
        ? categoryMap.get(transaction.categoryId)
        : null;

      return {
        ...transaction,
        accountName: account?.name ?? null,
        categoryName: category?.name ?? transaction.categoryName ?? null,
        categoryColor: category?.color ?? transaction.categoryColor ?? "#94a3b8",
      };
    })
    .sort((left, right) => right.date.localeCompare(left.date));
}

function buildBudgets(
  budgets: Array<{
    id: string;
    categoryId: string | null;
    limitAmount: number;
    period: "bulanan" | "mingguan";
    startDate: string | null;
    endDate: string | null;
  }>,
  categories: Category[],
  transactions: Transaction[],
) {
  const now = new Date();

  return budgets.map<Budget>((budget) => {
    const category = categories.find((item) => item.id === budget.categoryId);
    const spentAmount = transactions
      .filter((transaction) => {
        if (transaction.type !== "debit") {
          return false;
        }

        if (!budget.categoryId || transaction.categoryId !== budget.categoryId) {
          return false;
        }

        return isSameMonth(parseISO(transaction.date), now);
      })
      .reduce((total, item) => total + item.amount, 0);

    const progress = budget.limitAmount
      ? clamp(spentAmount / budget.limitAmount, 0, 2)
      : 0;

    return {
      id: budget.id,
      categoryId: budget.categoryId,
      categoryName: category?.name ?? "Tanpa kategori",
      categoryColor: category?.color ?? "#94a3b8",
      period: budget.period,
      limitAmount: budget.limitAmount,
      spentAmount,
      progress,
      status:
        progress >= 1
          ? "danger"
          : progress >= 0.9
            ? "warning"
            : "safe",
      startDate: budget.startDate,
      endDate: budget.endDate,
    };
  });
}

function buildAlerts(budgets: Budget[]): BudgetAlert[] {
  return budgets
    .filter((budget) => budget.progress >= 0.9)
    .map((budget) => ({
      id: budget.id,
      categoryName: budget.categoryName,
      limitAmount: budget.limitAmount,
      spentAmount: budget.spentAmount,
      progress: budget.progress,
      severity: budget.progress >= 1 ? "danger" : "warning",
      message:
        budget.progress >= 1
          ? `${budget.categoryName} sudah melewati limit bulan ini.`
          : `${budget.categoryName} sudah menyentuh 90% budget bulan ini.`,
    }));
}

function buildMonthlyTrend(transactions: Transaction[]): MonthlyTrend[] {
  const months = Array.from({ length: 6 }, (_, index) =>
    startOfMonth(subMonths(new Date(), 5 - index)),
  );

  return months.map((monthDate) => {
    const monthTransactions = transactions.filter((transaction) =>
      isSameMonth(parseISO(transaction.date), monthDate),
    );
    const income = monthTransactions
      .filter((transaction) => transaction.type === "credit")
      .reduce((total, item) => total + item.amount, 0);
    const expenses = monthTransactions
      .filter((transaction) => transaction.type === "debit")
      .reduce((total, item) => total + item.amount, 0);

    return {
      month: format(monthDate, "MMM"),
      income,
      expenses,
      balance: income - expenses,
    };
  });
}

function buildCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const now = new Date();
  const currentMonthDebits = transactions.filter(
    (transaction) =>
      transaction.type === "debit" && isSameMonth(parseISO(transaction.date), now),
  );
  const total = currentMonthDebits.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );

  const grouped = currentMonthDebits.reduce<Record<string, CategoryBreakdown>>(
    (accumulator, transaction) => {
      const key = transaction.categoryName ?? "Lainnya";
      const current = accumulator[key] ?? {
        name: key,
        amount: 0,
        share: 0,
        color: transaction.categoryColor ?? "#94a3b8",
      };
      current.amount += transaction.amount;
      accumulator[key] = current;
      return accumulator;
    },
    {},
  );

  return Object.values(grouped)
    .map((item) => ({
      ...item,
      share: total ? item.amount / total : 0,
    }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);
}

function buildSummary(transactions: Transaction[], budgets: Budget[]) {
  const { start, end } = getMonthBounds();
  const currentMonthTransactions = transactions.filter((transaction) => {
    const date = parseISO(transaction.date);
    return date >= start && date <= end;
  });

  const monthlyIncome = currentMonthTransactions
    .filter((transaction) => transaction.type === "credit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyExpenses = currentMonthTransactions
    .filter((transaction) => transaction.type === "debit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalIncome = transactions
    .filter((transaction) => transaction.type === "credit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "debit")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.limitAmount, 0);
  const totalBudgetSpent = budgets.reduce(
    (sum, budget) => sum + budget.spentAmount,
    0,
  );

  return {
    balance: totalIncome - totalExpenses,
    monthlyIncome,
    monthlyExpenses,
    savingsRate:
      monthlyIncome > 0 ? clamp((monthlyIncome - monthlyExpenses) / monthlyIncome) : 0,
    budgetUsage: totalBudget > 0 ? clamp(totalBudgetSpent / totalBudget, 0, 2) : 0,
    transactionCount: currentMonthTransactions.length,
  };
}

function buildAiSummary(
  summary: SakuDataset["summary"],
  budgets: Budget[],
  categoryBreakdown: CategoryBreakdown[],
  goals: Goal[],
  recurringItems: RecurringItem[],
) {
  const topCategories = categoryBreakdown
    .slice(0, 3)
    .map((item) => `${item.name} (Rp ${item.amount.toLocaleString("id-ID")})`)
    .join(", ");

  const recurring = recurringItems
    .slice(0, 3)
    .map((item) => `${item.label} Rp ${item.amount.toLocaleString("id-ID")}`)
    .join(", ");

  const activeGoal = goals[0];
  const warningBudget = budgets.find((budget) => budget.progress >= 0.9);

  return [
    `User summary (${format(new Date(), "MMMM yyyy")}):`,
    `Total Pemasukan/Uang Saku: Rp ${summary.monthlyIncome.toLocaleString("id-ID")}`,
    `Total Pengeluaran Saat Ini: Rp ${summary.monthlyExpenses.toLocaleString("id-ID")}`,
    `Top 3 Pengeluaran: ${topCategories || "Belum ada pengeluaran dominan"}`,
    `Langganan Rutin: ${recurring || "Belum ada recurring rule"}`,
    activeGoal
      ? `Target Tabungan: ${activeGoal.name} Rp ${activeGoal.targetAmount.toLocaleString("id-ID")} (Saat ini Rp ${activeGoal.currentAmount.toLocaleString("id-ID")})`
      : "Target Tabungan: Belum ada target aktif",
    warningBudget
      ? `Alert Budget: ${warningBudget.categoryName} sudah ${Math.round(warningBudget.progress * 100)}% dari limit.`
      : "Alert Budget: Tidak ada budget kritis saat ini.",
  ].join("\n");
}

function buildDataset(params: {
  mode: "demo" | "live";
  canPersist: boolean;
  userName: string;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Array<{
    id: string;
    categoryId: string | null;
    limitAmount: number;
    period: "bulanan" | "mingguan";
    startDate: string | null;
    endDate: string | null;
  }>;
  goals: Goal[];
  recurringItems: RecurringItem[];
}): SakuDataset {
  const transactions = enrichTransactions(
    params.transactions,
    params.accounts,
    params.categories,
  );
  const budgets = buildBudgets(params.budgets, params.categories, transactions);
  const summary = buildSummary(transactions, budgets);
  const categoryBreakdown = buildCategoryBreakdown(transactions);
  const monthlyTrend = buildMonthlyTrend(transactions);
  const alerts = buildAlerts(budgets);
  const goals = params.goals.map((goal) => ({
    ...goal,
    progress:
      goal.targetAmount > 0 ? clamp(goal.currentAmount / goal.targetAmount) : 0,
  }));

  const aiSummary = buildAiSummary(
    summary,
    budgets,
    categoryBreakdown,
    goals,
    params.recurringItems,
  );

  return {
    mode: params.mode,
    canPersist: params.canPersist,
    userName: params.userName,
    periodLabel: format(new Date(), "MMMM yyyy"),
    summary,
    accounts: params.accounts,
    categories: params.categories,
    transactions,
    recentTransactions: transactions.slice(0, 6),
    budgets,
    goals,
    alerts,
    monthlyTrend,
    categoryBreakdown,
    recurringItems: params.recurringItems,
    aiSummary,
  };
}

function getDemoDataset(userName = "Mahasiswa"): SakuDataset {
  return buildDataset({
    mode: "demo",
    canPersist: false,
    userName,
    accounts: demoAccounts,
    categories: demoCategories,
    transactions: demoTransactions,
    budgets: demoBudgets.map((budget) => ({
      id: budget.id,
      categoryId: budget.categoryId,
      period: budget.period,
      limitAmount: budget.limitAmount,
      startDate: budget.startDate,
      endDate: budget.endDate,
    })),
    goals: demoGoals,
    recurringItems: demoRecurringItems,
  });
}

async function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (hasSupabaseServiceRole()) {
    return createSupabaseAdminClient();
  }

  return createSupabaseServerClient();
}

async function ensureAppUser(
  client: SupabaseLikeClient,
  profile: Pick<AppUserProfile, "clerkId" | "email" | "displayName">,
) {
  const existing = await client
    .from("app_users")
    .select("id, clerk_id, email, display_name, preferred_currency, timezone")
    .eq("clerk_id", profile.clerkId)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data) {
    return {
      id: existing.data.id,
      clerkId: existing.data.clerk_id,
      email: existing.data.email,
      displayName: existing.data.display_name,
      preferredCurrency: existing.data.preferred_currency ?? "IDR",
      timezone: existing.data.timezone ?? "Asia/Jakarta",
    } satisfies AppUserProfile;
  }

  const inserted = await client
    .from("app_users")
    .insert({
      clerk_id: profile.clerkId,
      email: profile.email,
      display_name: profile.displayName,
      preferred_currency: "IDR",
      timezone: "Asia/Jakarta",
    })
    .select("id, clerk_id, email, display_name, preferred_currency, timezone")
    .single();

  if (inserted.error) {
    throw inserted.error;
  }

  return {
    id: inserted.data.id,
    clerkId: inserted.data.clerk_id,
    email: inserted.data.email,
    displayName: inserted.data.display_name,
    preferredCurrency: inserted.data.preferred_currency ?? "IDR",
    timezone: inserted.data.timezone ?? "Asia/Jakarta",
  } satisfies AppUserProfile;
}

async function ensureSeedData(client: SupabaseLikeClient, appUserId: string) {
  const existingCategories = await client
    .from("categories")
    .select("id")
    .eq("user_id", appUserId)
    .limit(1);

  if (existingCategories.error) {
    throw existingCategories.error;
  }

  if (!existingCategories.data?.length) {
    const insertedCategories = await client
      .from("categories")
      .insert(
        defaultCategories.map((category) => ({
          user_id: appUserId,
          name: category.name,
          color: category.color,
          auto_rules: {},
        })),
      )
      .select("id, name");

    if (insertedCategories.error) {
      throw insertedCategories.error;
    }

    const categoryIdByName = new Map(
      (insertedCategories.data ?? []).map((category) => [category.name, category.id]),
    );

    const accountsResult = await client.from("accounts").insert(
      defaultAccounts.map((account) => ({
        user_id: appUserId,
        name: account.name,
        type: account.type,
        currency: account.currency,
        institution: account.institution,
        metadata: {},
      })),
    );

    if (accountsResult.error) {
      throw accountsResult.error;
    }

    const budgetsResult = await client.from("budgets").insert(
      defaultBudgets
        .map((budget) => ({
          user_id: appUserId,
          category_id: categoryIdByName.get(budget.categoryName) ?? null,
          period: "bulanan",
          limit_amount: budget.limitAmount,
          start_date: format(startOfMonth(new Date()), "yyyy-MM-dd"),
          end_date: format(endOfMonth(new Date()), "yyyy-MM-dd"),
          metadata: {},
        }))
        .filter((budget) => Boolean(budget.category_id)),
    );

    if (budgetsResult.error) {
      throw budgetsResult.error;
    }
  }
}

async function fetchAccounts(client: SupabaseLikeClient, appUserId: string) {
  const result = await client
    .from("accounts")
    .select("id, name, type, currency, institution, created_at")
    .eq("user_id", appUserId)
    .order("created_at", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map<Account>((account) => ({
    id: account.id,
    name: account.name,
    type: account.type as Account["type"],
    currency: account.currency ?? "IDR",
    institution: account.institution,
    createdAt: account.created_at,
  }));
}

async function fetchCategories(client: SupabaseLikeClient, appUserId: string) {
  const result = await client
    .from("categories")
    .select("id, name, color, parent_id")
    .eq("user_id", appUserId)
    .order("name", { ascending: true });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map<Category>((category) => ({
    id: category.id,
    name: category.name,
    color: category.color ?? "#94a3b8",
    parentId: category.parent_id,
  }));
}

async function fetchTransactions(client: SupabaseLikeClient, appUserId: string) {
  const result = await client
    .from("transactions")
    .select(
      "id, user_id, account_id, amount, currency, type, category_id, merchant, description, date, status, imported, tags, created_at",
    )
    .eq("user_id", appUserId)
    .order("date", { ascending: false })
    .limit(100);

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map<Transaction>((transaction) => ({
    id: transaction.id,
    userId: transaction.user_id,
    accountId: transaction.account_id,
    amount: toNumber(transaction.amount),
    currency: transaction.currency ?? "IDR",
    type: transaction.type as Transaction["type"],
    categoryId: transaction.category_id,
    merchant: transaction.merchant,
    description: transaction.description,
    date: transaction.date,
    status: (transaction.status ?? "cleared") as Transaction["status"],
    imported: Boolean(transaction.imported),
    tags: transaction.tags ?? [],
  }));
}

async function fetchBudgets(client: SupabaseLikeClient, appUserId: string) {
  const result = await client
    .from("budgets")
    .select("id, category_id, period, limit_amount, start_date, end_date")
    .eq("user_id", appUserId)
    .order("created_at", { ascending: false });

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map((budget) => ({
    id: budget.id,
    categoryId: budget.category_id,
    period: (budget.period ?? "bulanan") as Budget["period"],
    limitAmount: toNumber(budget.limit_amount),
    startDate: budget.start_date,
    endDate: budget.end_date,
  }));
}

async function fetchGoals(client: SupabaseLikeClient, appUserId: string) {
  const result = await client
    .from("goals")
    .select("id, name, target_amount, current_amount, target_date, note")
    .eq("user_id", appUserId)
    .order("created_at", { ascending: false });

  if (result.error) {
    if (result.error.code === "PGRST205") {
      return [];
    }

    throw result.error;
  }

  return (result.data ?? []).map<Goal>((goal) => ({
    id: goal.id,
    name: goal.name,
    targetAmount: toNumber(goal.target_amount),
    currentAmount: toNumber(goal.current_amount),
    progress: 0,
    targetDate: goal.target_date,
    note: goal.note,
  }));
}

async function fetchRecurringItems(client: SupabaseLikeClient, appUserId: string) {
  const result = await client
    .from("recurring_rules")
    .select(
      "id, amount, next_occurrence, categories(name), metadata, category_id",
    )
    .eq("user_id", appUserId)
    .eq("active", true)
    .order("next_occurrence", { ascending: true })
    .limit(5);

  if (result.error) {
    throw result.error;
  }

  return (result.data ?? []).map<RecurringItem>((rule) => ({
    id: rule.id,
    label:
      typeof rule.metadata === "object" &&
      rule.metadata &&
      "label" in rule.metadata &&
      typeof rule.metadata.label === "string"
        ? rule.metadata.label
        : "Recurring item",
    amount: toNumber(rule.amount),
    categoryName:
      rule.categories && typeof rule.categories === "object" && "name" in rule.categories
        ? String(rule.categories.name)
        : "Lainnya",
    nextOccurrence: rule.next_occurrence,
  }));
}

export async function getSakuDataset(): Promise<SakuDataset> {
  const signedInUser = await currentUser();
  const fallbackName = getUserLabel(signedInUser?.firstName);
  const { userId } = await auth();

  if (!userId) {
    return getDemoDataset(fallbackName);
  }

  const client = await getSupabaseClient();

  if (!client) {
    return getDemoDataset(fallbackName);
  }

  try {
    const appUser = await ensureAppUser(client, {
      clerkId: userId,
      email: signedInUser?.primaryEmailAddress?.emailAddress ?? null,
      displayName:
        signedInUser?.fullName ??
        signedInUser?.firstName ??
        signedInUser?.username ??
        fallbackName,
    });

    await ensureSeedData(client, appUser.id);

    const [accounts, categories, transactions, budgets, goals, recurringItems] =
      await Promise.all([
        fetchAccounts(client, appUser.id),
        fetchCategories(client, appUser.id),
        fetchTransactions(client, appUser.id),
        fetchBudgets(client, appUser.id),
        fetchGoals(client, appUser.id),
        fetchRecurringItems(client, appUser.id),
      ]);

    return buildDataset({
      mode: "live",
      canPersist: true,
      userName: getUserLabel(appUser.displayName),
      accounts,
      categories,
      transactions,
      budgets,
      goals,
      recurringItems,
    });
  } catch (error) {
    console.error("Falling back to demo dataset:", error);
    return getDemoDataset(fallbackName);
  }
}

export async function getDashboardSummaryPayload() {
  const dataset = await getSakuDataset();

  return {
    mode: dataset.mode,
    canPersist: dataset.canPersist,
    periodLabel: dataset.periodLabel,
    summary: dataset.summary,
    alerts: dataset.alerts,
    budgets: dataset.budgets,
    categoryBreakdown: dataset.categoryBreakdown,
    monthlyTrend: dataset.monthlyTrend,
  };
}

async function getAuthenticatedAppUser(client: SupabaseLikeClient) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const clerkUser = await currentUser();

  return ensureAppUser(client, {
    clerkId: userId,
    email: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
    displayName:
      clerkUser?.fullName ??
      clerkUser?.firstName ??
      clerkUser?.username ??
      "Mahasiswa",
  });
}

async function validateOwnedReference(
  client: SupabaseLikeClient,
  table: "accounts" | "categories",
  id: string | null,
  appUserId: string,
) {
  if (!id) {
    return null;
  }

  const result = await client
    .from(table)
    .select("id")
    .eq("id", id)
    .eq("user_id", appUserId)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  if (!result.data) {
    throw new Error(`Invalid ${table.slice(0, -1)} reference`);
  }

  return result.data.id;
}

export async function listTransactions(options?: {
  from?: string | null;
  to?: string | null;
  limit?: number;
}) {
  const dataset = await getSakuDataset();
  let transactions = dataset.transactions;

  if (options?.from) {
    transactions = transactions.filter(
      (transaction) => transaction.date >= options.from!,
    );
  }

  if (options?.to) {
    transactions = transactions.filter(
      (transaction) => transaction.date <= options.to!,
    );
  }

  if (options?.limit) {
    transactions = transactions.slice(0, options.limit);
  }

  return {
    mode: dataset.mode,
    canPersist: dataset.canPersist,
    data: transactions,
  };
}

export async function createTransaction(input: TransactionInput) {
  const client = await getSupabaseClient();

  if (!client) {
    throw new Error("Supabase belum dikonfigurasi.");
  }

  const appUser = await getAuthenticatedAppUser(client);

  await ensureSeedData(client, appUser.id);

  const accountId = await validateOwnedReference(
    client,
    "accounts",
    input.accountId,
    appUser.id,
  );
  const categoryId = await validateOwnedReference(
    client,
    "categories",
    input.categoryId,
    appUser.id,
  );

  const inserted = await client
    .from("transactions")
    .insert({
      user_id: appUser.id,
      account_id: accountId,
      amount: input.amount,
      currency: input.currency ?? "IDR",
      type: input.type,
      category_id: categoryId,
      merchant: input.merchant,
      description: input.description,
      date: input.date,
      status: input.status ?? "cleared",
      imported: input.imported ?? false,
      tags: input.tags ?? [],
      metadata: {},
    })
    .select(
      "id, user_id, account_id, amount, currency, type, category_id, merchant, description, date, status, imported, tags",
    )
    .single();

  if (inserted.error) {
    throw inserted.error;
  }

  return {
    id: inserted.data.id,
    userId: inserted.data.user_id,
    accountId: inserted.data.account_id,
    amount: toNumber(inserted.data.amount),
    currency: inserted.data.currency ?? "IDR",
    type: inserted.data.type as Transaction["type"],
    categoryId: inserted.data.category_id,
    merchant: inserted.data.merchant,
    description: inserted.data.description,
    date: inserted.data.date,
    status: (inserted.data.status ?? "cleared") as Transaction["status"],
    imported: Boolean(inserted.data.imported),
    tags: inserted.data.tags ?? [],
  } satisfies Transaction;
}
