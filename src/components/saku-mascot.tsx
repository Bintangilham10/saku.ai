"use client";

import React from "react";
import { cn } from "@/lib/utils";

type SakuMascotProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "wave" | "happy" | "thinking";
};

export function SakuMascot({
  className,
  size = "md",
  variant = "wave",
}: SakuMascotProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-16 h-16",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center select-none shrink-0",
        sizeClasses[size],
        className,
      )}
      aria-label="Saku Buddy Mascot"
    >
      {/* Wallet Body */}
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        {/* Main Wallet Pocket Shape */}
        <rect
          x="6"
          y="14"
          width="52"
          height="42"
          rx="12"
          fill="var(--primary)"
          className="transition-colors"
        />
        {/* Wallet Flap / Pocket Detail */}
        <path
          d="M6 26C6 19.3726 11.3726 14 18 14H46C52.6274 14 58 19.3726 58 26V30H6V26Z"
          fill="color-mix(in oklab, var(--primary) 82%, white)"
        />
        {/* Pocket Stitching Line */}
        <rect
          x="10"
          y="18"
          width="44"
          height="34"
          rx="8"
          stroke="color-mix(in oklab, var(--primary) 60%, white)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          fill="none"
          opacity="0.6"
        />

        {/* Cute Coin inside pocket */}
        <circle
          cx="44"
          cy="38"
          r="6"
          fill="var(--accent)"
          stroke="color-mix(in oklab, var(--accent) 70%, black)"
          strokeWidth="1.5"
        />
        <path
          d="M44 35V41M42 37H46"
          stroke="color-mix(in oklab, var(--accent) 70%, black)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Mascot Face */}
        <g style={{ transformOrigin: "26px 34px" }}>
          {/* Left Eye */}
          <circle cx="21" cy="34" r="2.5" fill="var(--primary-foreground)" />
          {/* Right Eye */}
          <circle cx="31" cy="34" r="2.5" fill="var(--primary-foreground)" />
        </g>

        {/* Cheeks */}
        <ellipse cx="17" cy="38" rx="2.5" ry="1.5" fill="#FF8A8A" opacity="0.75" />
        <ellipse cx="35" cy="38" rx="2.5" ry="1.5" fill="#FF8A8A" opacity="0.75" />

        {/* Mouth */}
        {variant === "thinking" ? (
          <circle cx="26" cy="38" r="2" fill="var(--primary-foreground)" />
        ) : (
          <path
            d="M22 37C22 39.5 24 40.5 26 40.5C28 40.5 30 39.5 30 37"
            stroke="var(--primary-foreground)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* Waving Little Hand (if wave variant) */}
      {variant === "wave" && (
        <div className="absolute -right-1.5 -bottom-0.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C10 2 8 4 8 7C8 9 9 11 11 12C9 13 6 15 6 18C6 20 8 22 10 22C12 22 14 20 15 18C15 15 14 13 13 12C15 11 16 9 16 7C16 4 14 2 12 2Z"
              fill="#FFC872"
              stroke="#D99B3E"
              strokeWidth="1.5"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
