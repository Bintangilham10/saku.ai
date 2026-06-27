"use client";

import { useEffect, useRef } from "react";

/**
 * Custom cursor for the landing page: an instant emerald dot, a trailing ring
 * that grows over interactive elements, and a soft radial glow that lags
 * behind. Only enabled for fine pointers (mouse); hidden on touch. Restores the
 * native cursor on unmount, so it stays scoped to the signed-out landing.
 */
export default function CursorGlow() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const glow = glowRef.current;
    if (!dot || !ring || !glow) return;

    document.body.style.cursor = "none";

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...target };
    const glowPos = { ...target };
    const hoverSel = "a, button, [data-magnetic], [role='button']";

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      dot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    };
    const onOver = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.(hoverSel)) ring.classList.add("is-hover");
    };
    const onOut = (e: PointerEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest?.(hoverSel)) ring.classList.remove("is-hover");
    };
    const onDown = () => ring.classList.add("is-down");
    const onUp = () => ring.classList.remove("is-down");

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerover", onOver);
    window.addEventListener("pointerout", onOut);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);

    let raf = 0;
    const loop = () => {
      const e1 = reduce ? 1 : 0.2;
      const e2 = reduce ? 1 : 0.1;
      ringPos.x += (target.x - ringPos.x) * e1;
      ringPos.y += (target.y - ringPos.y) * e1;
      glowPos.x += (target.x - glowPos.x) * e2;
      glowPos.y += (target.y - glowPos.y) * e2;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      glow.style.transform = `translate3d(${glowPos.x}px, ${glowPos.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerout", onOut);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
    };
  }, []);

  return (
    <>
      <div ref={glowRef} className="saku-cursor-glow" aria-hidden />
      <div ref={ringRef} className="saku-cursor-ring" aria-hidden />
      <div ref={dotRef} className="saku-cursor-dot" aria-hidden />
    </>
  );
}
