"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { animate } from "animejs";
import { gsap } from "gsap";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SakuMascot } from "@/components/saku-mascot";

import HeroMascot from "@/components/landing/hero-mascot";
import CursorGlow from "@/components/landing/cursor-glow";
import { FeatureCards } from "@/components/landing/feature-cards";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function HeroWords({ text, gradient }: { text: string; gradient?: boolean }) {
  return (
    <span className="hero-mask">
      {text.split(" ").map((word, i) => (
        <span
          key={`${word}-${i}`}
          data-hero-word
          className={`hero-word mr-[0.25em] ${gradient ? "text-gradient" : ""}`}
        >
          {word}
        </span>
      ))}
    </span>
  );
}

function LandingInner({ authEnabled }: { authEnabled: boolean }) {
  const root = useRef<HTMLElement>(null);

  // Entrance choreography (no scroll triggers — single screen).
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from("[data-hero-word]", {
        yPercent: 120,
        opacity: 0,
        duration: 0.9,
        stagger: 0.06,
      }).from(
        "[data-hero-fade]",
        { y: 24, opacity: 0, duration: 0.7, stagger: 0.1 },
        "-=0.5",
      );
    }, root);

    return () => ctx.revert();
  }, []);

  // anime.js magnetic buttons.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-magnetic]"),
    );
    const cleanups: Array<() => void> = [];
    els.forEach((el) => {
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        animate(el, {
          translateX: x * 0.25,
          translateY: y * 0.35,
          duration: 400,
          ease: "outQuad",
        });
      };
      const leave = () =>
        animate(el, {
          translateX: 0,
          translateY: 0,
          duration: 600,
          ease: "outElastic(1, .6)",
        });
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
      });
    });
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <main
      ref={root}
      className="grain relative min-h-[100svh] w-full overflow-hidden bg-[#070e1c] text-[#f8fafc] dark selection:bg-[#109868]/30"
    >
      <div className="aurora" aria-hidden />
      <CursorGlow />

      {/* ===================== NAV ===================== */}
      <nav className="absolute left-1/2 top-5 z-30 flex w-[min(94%,880px)] -translate-x-1/2 items-center justify-between rounded-full border border-[#1e293b] bg-[#0f172a]/90 px-3 py-2 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-2.5 pl-2">
          <SakuMascot size="sm" variant="happy" />
          <span className="text-lg font-black tracking-tight text-white">
            Saku<span className="text-[#109868]">.ai</span>
          </span>
        </div>
        <div className="hidden items-center gap-7 text-sm font-bold text-[#94a3b8] sm:flex">
          <Link href="/transactions" className="hover:text-white transition-colors">
            Transaksi
          </Link>
          <Link href="/budgets" className="hover:text-white transition-colors">
            Budget
          </Link>
          <Link href="/chat" className="hover:text-white transition-colors">
            Saku AI
          </Link>
        </div>
        {authEnabled ? (
          <SignInButton mode="modal">
            <Button className="h-10 rounded-full bg-[#3b2d28] px-5 text-sm font-black text-white hover:bg-[#3b2d28]/90">
              Masuk
            </Button>
          </SignInButton>
        ) : (
          <Button
            asChild
            className="h-10 rounded-full bg-[#3b2d28] px-5 text-sm font-black text-white hover:bg-[#3b2d28]/90"
          >
            <Link href="/transactions">Masuk</Link>
          </Button>
        )}
      </nav>

      {/* ===================== HERO (single screen) ===================== */}
      <div className="relative mx-auto grid min-h-[100svh] max-w-7xl grid-cols-1 items-center gap-4 px-4 pb-24 pt-24 lg:grid-cols-2 lg:gap-8 lg:pb-16 lg:pt-0">
        {/* Copy: top on mobile, right on desktop */}
        <div className="relative z-30 order-1 text-center lg:order-2 lg:text-left">
          <div
            data-hero-fade
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#109868]/15 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#109868]"
          >
            <Sparkles className="h-4 w-4" />
            <span>Robot Penjaga Brankas</span>
          </div>

          <h1 className="text-4xl font-black leading-[1.03] tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block text-white">
              <HeroWords text="Uang Sakumu" />
            </span>
            <span className="block">
              <HeroWords text="Hidup Di Sini." gradient />
            </span>
          </h1>

          <p
            data-hero-fade
            className="mx-auto mt-5 max-w-md text-sm font-bold leading-relaxed text-[#94a3b8] sm:text-lg lg:mx-0"
          >
            Catat jajan, kunci budget harian, dan ngobrol sama AI — dijaga si
            robot brankas yang setia, semuanya dalam satu layar.
          </p>

          <div
            data-hero-fade
            className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            {authEnabled ? (
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  data-magnetic
                  className="magnetic h-14 rounded-full bg-[#109868] px-8 text-base font-black text-white shadow-xl hover:bg-[#109868]/90"
                >
                  Mulai Jaga Uangmu <ArrowRight className="h-5 w-5" />
                </Button>
              </SignInButton>
            ) : (
              <Button
                asChild
                size="lg"
                data-magnetic
                className="magnetic h-14 rounded-full bg-[#109868] px-8 text-base font-black text-white shadow-xl hover:bg-[#109868]/90"
              >
                <Link href="/transactions">
                  Mulai Jaga Uangmu <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="outline"
              data-magnetic
              className="magnetic h-14 rounded-full border-2 border-[#334155] bg-transparent px-7 text-base font-bold text-white hover:bg-[#1e293b]/60"
            >
              <Link href="/chat">Tanya Saku AI</Link>
            </Button>
          </div>

        </div>

        {/* 3D cursor-following robot: bottom on mobile, left on desktop */}
        <div className="relative order-2 h-[40vh] min-h-[260px] lg:order-1 lg:h-[100svh]">
          <HeroMascot />
        </div>

        {/* Feature mini-cards: absolutely centred at the bottom of the hero */}
        <div
          data-hero-fade
          className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2"
        >
          <FeatureCards />
        </div>
      </div>
    </main>
  );
}

export function PocketLanding({ authEnabled }: { authEnabled: boolean }) {
  return <LandingInner authEnabled={authEnabled} />;
}

export default PocketLanding;
