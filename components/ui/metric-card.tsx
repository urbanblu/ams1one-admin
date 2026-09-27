"use client";

import { cn } from "@heroui/react";
import React from "react";
import { Skeleton } from "./skeleton";

export type MetricTone = "brand" | "warning" | "success" | "info" | "neutral";

/**
 * Icons are glyphs, not chips. Tone only reaches the glyph, and only where a
 * card is genuinely about a warning or a success — everything else stays in
 * the muted colour so a wall of KPI cards reads as one surface.
 */
const GLYPHS: Record<MetricTone, string> = {
  brand: "text-brand-500",
  warning: "text-amber-600",
  success: "text-emerald-600",
  info: "text-blue-600",
  neutral: "text-foreground-muted",
};

type Props = {
  title: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tone?: MetricTone;
  /** Breakdown rows rendered under the headline figure. */
  rows?: { label: string; value: React.ReactNode }[];
  /** Arbitrary content in the bottom rule, for cards that need more than rows. */
  footer?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
};

/** Headline figure with an optional breakdown — the app's primary KPI card. */
export function MetricCard({
  title,
  value,
  icon,
  tone = "neutral",
  rows,
  footer,
  isLoading,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border border-border bg-surface",
        className,
      )}
    >
      <div className="px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs text-foreground-light">
            {title}
          </p>
          {icon && (
            <span
              className={cn(
                "flex shrink-0 items-center justify-center [&>svg]:size-3.5",
                GLYPHS[tone],
              )}
            >
              {icon}
            </span>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="mt-2.5 h-7 w-32" />
        ) : (
          <p className="mt-1.5 truncate text-2xl font-medium tracking-tight tabular-nums text-foreground">
            {value}
          </p>
        )}
      </div>

      {footer && (
        <div className="mt-auto border-t border-border bg-surface-100 px-4 py-2.5">
          {footer}
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-auto flex flex-col divide-y divide-border border-t border-border bg-surface-100">
          {rows.map(({ label, value: rowValue }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 px-4 py-2"
            >
              <span className="text-xs text-foreground-light">{label}</span>
              <span className="text-xs font-medium tabular-nums text-foreground">
                {isLoading ? <Skeleton className="h-3 w-12" /> : rowValue}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MetricCard;
