"use client";

import { cn } from "@heroui/react";
import React from "react";

const SIZES = {
  sm: "size-6 text-[11px] rounded-lg",
  md: "size-8 text-xs rounded-xl",
  lg: "size-10 text-sm rounded-xl",
} as const;

type Props = {
  children: React.ReactNode;
  /** `solid` uses the brand gradient; `soft` the tinted chip. */
  variant?: "solid" | "soft" | "muted";
  size?: keyof typeof SIZES;
  className?: string;
};

/** A drawn / staked lottery number. */
export function NumberBall({
  children,
  variant = "soft",
  size = "md",
  className,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold tabular-nums",
        SIZES[size],
        variant === "solid" && "bg-brand-gradient text-white",
        variant === "soft" && "bg-primary-soft text-primary-strong",
        variant === "muted" && "bg-subtle text-muted-foreground",
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
