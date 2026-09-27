"use client";

import { cn } from "@heroui/react";
import React from "react";

const SIZES = {
  sm: "size-6 text-xs",
  md: "size-7 text-xs",
  lg: "size-9 text-sm",
} as const;

type Props = {
  children: React.ReactNode;
  /** `solid` is the drawn number; `soft` a staked one; `muted` an unremarkable one. */
  variant?: "solid" | "soft" | "muted" | "onBrand";
  size?: keyof typeof SIZES;
  className?: string;
};

/**
 * A drawn / staked lottery number. Mono, bordered and square — a value chip,
 * not a ball. It is the clearest place in the app for the identifier treatment.
 */
export function NumberBall({
  children,
  variant = "soft",
  size = "md",
  className,
}: Props) {
  return (
    <span
      className={cn(
        "font-ident inline-flex shrink-0 items-center justify-center rounded-md border font-medium tabular-nums",
        SIZES[size],
        variant === "solid" && "border-brand-800 bg-brand-700 text-white",
        variant === "soft" && "border-brand-300 bg-brand-100 text-brand-800",
        variant === "muted" &&
          "border-border bg-surface-100 text-foreground-light",
        // For numbers sitting on the dark hero panel.
        variant === "onBrand" && "border-white/20 bg-white/10 text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function NumberBallRow({
  values,
  variant,
  size,
  className,
}: {
  values: (string | number)[];
  variant?: Props["variant"];
  size?: Props["size"];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {values.map((v, i) => (
        <NumberBall key={`${v}-${i}`} variant={variant} size={size}>
          {v}
        </NumberBall>
      ))}
    </div>
  );
}

export default NumberBall;
