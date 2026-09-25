"use client";

import { cn } from "@heroui/react";
import React from "react";
import { Skeleton } from "./skeleton";

export type MetricTone = "brand" | "warning" | "success" | "info" | "neutral";

const CHIPS: Record<MetricTone, string> = {
  brand: "bg-primary-soft text-primary",
  warning: "bg-amber-50 text-amber-500",
  success: "bg-emerald-50 text-emerald-500",
  info: "bg-blue-50 text-blue-500",
  neutral: "bg-subtle text-zinc-400",
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
  tone = "brand",
  rows,
  footer,
  isLoading,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface",
        className,
      )}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {title}
          </p>
          {icon && (
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-xl [&>svg]:size-4",
                CHIPS[tone],
              )}
            >
              {icon}
            </span>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="mt-3 h-7 w-32" />
        ) : (
          <p className="mt-2 truncate text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </p>
        )}
      </div>

      {footer && (
        <div className="mt-auto border-t border-border-subtle px-5 py-3">
          {footer}
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="mt-auto flex flex-col divide-y divide-border-subtle border-t border-border-subtle">
          {rows.map(({ label, value: rowValue }) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 px-5 py-2.5"
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-semibold tabular-nums text-foreground">
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
