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
import { SakuMascot } from "@/components/saku-mascot";
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
  const hasClerk = mode === "live";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Mobile Sticky Header */}
      <div className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <SakuMascot size="sm" variant="happy" />
              <div className="font-display text-xl font-bold tracking-tight text-foreground">Saku.ai</div>
              <Badge className="h-5 px-2.5 text-[10px] font-semibold rounded-full tracking-wide uppercase" variant={mode === "live" ? "default" : "secondary"}>
                {mode === "live" ? "Live" : "Demo"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {hasClerk ? (
              <UserButton />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/80 bg-card text-xs font-bold shadow-2xs">
                {userName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-4 grid max-w-7xl gap-6 overflow-hidden py-4 lg:mx-auto lg:grid-cols-[240px_minmax(0,1fr)] lg:px-6 lg:py-6">
        {/* Desktop Sidebar */}
        <aside className="hidden h-fit overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm lg:sticky lg:top-6 lg:block">
          <div className="border-b border-border/70 px-5 py-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <SakuMascot size="md" variant="wave" />
                <div className="font-display text-2xl font-bold tracking-tight text-foreground">Saku.ai</div>
              </div>
              <Badge className="h-5 px-2.5 text-[10px] font-semibold rounded-full tracking-wide uppercase shadow-none" variant={mode === "live" ? "default" : "secondary"}>
                {mode === "live" ? "Live" : "Demo"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground pt-1">
              <span className="truncate font-medium text-foreground/90">{userName}</span>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                {hasClerk ? (
                  <UserButton />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/80 bg-secondary text-xs font-bold text-secondary-foreground">
                    {userName.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <nav className="grid gap-1.5 p-3">
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
                    "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm transition-all duration-200 font-medium",
                    active
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs scale-[1.01]"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-200", active ? "scale-110" : "")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="w-full min-w-0 overflow-hidden">
          {/* Mobile Horizontal Nav */}
          <nav className="-mx-1 mb-5 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
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
                    "flex min-w-fit items-center gap-2 rounded-xl border px-3.5 py-2 text-sm transition-all duration-200 font-medium",
                    active
                      ? "border-primary bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "border-border/80 bg-card text-muted-foreground hover:bg-secondary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-border/60 pb-4">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
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

          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
