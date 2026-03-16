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
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-5 lg:flex-row lg:px-6">
        <aside className="border-border/70 bg-card/80 shadow-primary/5 h-fit overflow-hidden rounded-[1.75rem] border backdrop-blur lg:sticky lg:top-6 lg:w-72">
          <div className="border-border/70 border-b px-5 py-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-2xl tracking-tight">Saku AI</div>
                <p className="text-muted-foreground mt-1 text-sm">
                  Asisten keuangan mahasiswa
                </p>
              </div>
              <Badge variant={mode === "live" ? "default" : "secondary"}>
                {mode === "live" ? "Live" : "Demo"}
              </Badge>
            </div>
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>Halo, {userName}</span>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <UserButton />
              </div>
            </div>
          </div>

          <nav className="flex gap-2 overflow-x-auto px-4 py-4 lg:flex-col lg:overflow-visible">
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
                    "hover:bg-accent/80 flex min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-border/70 border-t px-5 py-4">
            <p className="font-medium">Ritme hemat minggu ini</p>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
              Catat transaksi harian, cek budget nongkrong, lalu tanya Saku AI
              sebelum akhir minggu.
            </p>
          </div>
        </aside>

        <main className="flex-1">
          <header className="mb-6 flex flex-col gap-4 rounded-[1.75rem] border border-border/70 bg-card/70 px-5 py-5 shadow-sm backdrop-blur sm:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
                  {title}
                </h1>
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
                  {subtitle}
                </p>
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>
          </header>

          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
