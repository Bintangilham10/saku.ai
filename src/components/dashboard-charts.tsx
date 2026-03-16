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
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <Card className="overflow-hidden rounded-[1.5rem] border-border/70">
        <CardHeader>
          <CardTitle>Tren 6 Bulan</CardTitle>
          <CardDescription>
            Bandingkan pemasukan dan pengeluaran per bulan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendConfig} className="h-[280px] w-full">
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

      <Card className="overflow-hidden rounded-[1.5rem] border-border/70">
        <CardHeader>
          <CardTitle>Top Kategori Bulan Ini</CardTitle>
          <CardDescription>
            Kategori yang paling banyak menguras saldo kamu saat ini.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] xl:grid-cols-1">
          <ChartContainer
            config={breakdownConfig}
            className="mx-auto h-[240px] w-full max-w-[280px]"
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
                className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {Math.round(item.share * 100)}% dari total bulanan
                    </p>
                  </div>
                </div>
                <p className="font-medium tabular-nums">
                  Rp {item.amount.toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
