"use client";

import { cn } from "@heroui/react";
import React from "react";

/**
 * The violet gradient panel used at the top of primary screens: soft blurred
 * highlights plus a faint dot grid over the brand gradient.
 */
export function HeroPanel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-brand-gradient p-6",
        className,
      )}
      {...rest}
    >
      <div className="pointer-events-none absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.06]" />
      <div className="relative">{children}</div>
    </div>
  );
}

type HeroStatProps = {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
};

/** A single figure inside a HeroPanel. */
export function HeroStat({
  label,
  value,
  unit,
  icon,
  isLoading,
  className,
}: HeroStatProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className="text-white/50 [&>svg]:size-3.5">{icon}</span>}
        <p className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">
          {label}
        </p>
      </div>
      {isLoading ? (
        <div className="h-7 w-28 bg-white/20 rounded-lg animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-white tracking-tight tabular-nums leading-none">
          {value}
        </p>
      )}
      {unit && <p className="text-[10px] text-white/40 mt-1.5">{unit}</p>}
    </div>
  );
}

export default HeroPanel;
