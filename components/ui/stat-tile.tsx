"use client";

import { cn } from "@heroui/react";
import React from "react";

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  /** Small caption under the value — a unit, a count, a delta. */
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** Tailwind classes for the icon chip, e.g. "bg-amber-50 text-amber-500". */
  iconClassName?: string;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
};

/** White KPI tile: tiny muted label, big tight number, optional icon chip. */
export function StatTile({
  label,
  value,
  hint,
  icon,
  iconClassName,
  isLoading,
  className,
  onClick,
}: StatTileProps) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-border-subtle bg-surface px-5 py-4 text-left",
        onClick &&
          "cursor-pointer transition-all hover:bg-subtle active:scale-[0.98]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl [&>svg]:size-4",
              iconClassName ?? "bg-primary-soft text-primary",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="mt-2 h-6 w-24 animate-pulse rounded bg-subtle" />
      ) : (
        <p className="mt-1.5 truncate text-xl font-bold tracking-tight tabular-nums text-foreground">
          {value}
        </p>
      )}
      {hint && (
        <p className="mt-1 truncate text-[11px] text-muted-foreground">{hint}</p>
      )}
    </Wrapper>
  );
}

export default StatTile;
