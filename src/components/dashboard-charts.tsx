"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { CategoryBreakdown, MonthlyTrend } from "@/lib/saku-types";

type DashboardChartsProps = {
  monthlyTrend: MonthlyTrend[];
  categoryBreakdown: CategoryBreakdown[];
};

const trendConfig = {
  income: {
    label: "Pemasukan",
    color: "var(--chart-2)",
  },
  expenses: {
    label: "Pengeluaran",
    color: "var(--chart-1)",
  },
};

export function DashboardCharts({
  monthlyTrend,
  categoryBreakdown,
}: DashboardChartsProps) {
  const breakdownConfig = Object.fromEntries(
    categoryBreakdown.map((item) => [
      item.name,
      {
        label: item.name,
        color: item.color,
      },
    ]),
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
      <Card className="overflow-hidden border-border/70">
        <CardHeader>
          <CardTitle>Tren 6 Bulan</CardTitle>
          <CardDescription>Pemasukan vs pengeluaran.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendConfig} className="h-[230px] w-full sm:h-[280px]">
            <BarChart data={monthlyTrend}>
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="month"
                tickLine={false}
                tickMargin={12}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="income"
                fill="var(--color-income)"
                radius={[12, 12, 0, 0]}
              />
              <Bar
                dataKey="expenses"
                fill="var(--color-expenses)"
                radius={[12, 12, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/70">
        <CardHeader>
          <CardTitle>Top Kategori Bulan Ini</CardTitle>
          <CardDescription>Pengeluaran terbesar.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] xl:grid-cols-1">
          <ChartContainer
            config={breakdownConfig}
            className="mx-auto h-[210px] w-full max-w-[260px] sm:h-[240px]"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={categoryBreakdown}
                dataKey="amount"
                innerRadius={58}
                nameKey="name"
                paddingAngle={4}
              >
                {categoryBreakdown.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          <div className="space-y-3">
            {categoryBreakdown.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between gap-3 rounded-md border border-border/60 bg-background/50 px-3 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {Math.round(item.share * 100)}% bulan ini
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-right text-sm font-medium tabular-nums">
                  {formatCurrency(item.amount)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
