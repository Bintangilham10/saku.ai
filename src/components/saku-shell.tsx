"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  MessageSquareText,
  PiggyBank,
  ReceiptText,
  Target,
  WalletCards,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ReceiptText },
  { href: "/accounts", label: "Akun", icon: WalletCards },
  { href: "/budgets", label: "Budget", icon: PiggyBank },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/chat", label: "Chat AI", icon: MessageSquareText },
];

const hasClerk = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type SakuShellProps = {
  title: string;
  subtitle: string;
  mode: "demo" | "live";
  userName: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function SakuShell({
  title,
  subtitle,
  mode,
  userName,
  children,
  actions,
}: SakuShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-display text-lg font-semibold">Saku AI</div>
              <Badge className="h-5 px-1.5 text-[10px]" variant={mode === "live" ? "default" : "secondary"}>
                {mode === "live" ? "Live" : "Demo"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {hasClerk ? (
              <UserButton />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card text-xs font-medium">
                {userName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-4 grid max-w-7xl gap-5 overflow-hidden py-4 lg:mx-auto lg:grid-cols-[228px_minmax(0,1fr)] lg:px-6 lg:py-5">
        <aside className="hidden h-fit overflow-hidden rounded-md border border-border/60 bg-card/80 backdrop-blur lg:sticky lg:top-5 lg:block">
          <div className="border-b border-border/60 px-4 py-4">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <div className="font-display text-xl font-semibold">Saku AI</div>
              </div>
              <Badge className="h-5 px-1.5 text-[10px]" variant={mode === "live" ? "default" : "secondary"}>
                {mode === "live" ? "Live" : "Demo"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span className="truncate">{userName}</span>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {hasClerk ? (
                  <UserButton />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-background text-xs font-medium">
                    {userName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <nav className="grid gap-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-muted",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="w-full min-w-0 overflow-hidden">
          <nav className="-mx-1 mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-w-fit items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-card/70 text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold sm:text-[28px]">
                {title}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                {subtitle}
              </p>
            </div>
            {actions ? (
              <div className="grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                {actions}
              </div>
            ) : null}
          </header>

          <div className="space-y-5">{children}</div>
        </main>
      </div>
    </div>
  );
}
