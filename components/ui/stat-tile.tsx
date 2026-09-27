"use client";

import { cn } from "@heroui/react";
import React from "react";

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  /** Small caption under the value — a unit, a count, a delta. */
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  /** Escape hatch for an icon that carries meaning by colour. */
  iconClassName?: string;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
};

/**
 * Compact KPI tile. Sentence-case label in the secondary text colour, figure
 * at `font-medium` — the size carries the emphasis, not the weight.
 */
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
        "w-full overflow-hidden rounded-lg border border-border bg-surface px-4 py-3.5 text-left",
        onClick &&
          "cursor-pointer transition-colors hover:border-border-stronger hover:bg-surface-100",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 flex-1 truncate text-xs text-foreground-light">
          {label}
        </p>
        {icon && (
          <span
            className={cn(
              "flex shrink-0 items-center justify-center [&>svg]:size-3.5",
              iconClassName ?? "text-foreground-muted",
            )}
          >
            {icon}
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="mt-2 h-6 w-24 animate-pulse rounded bg-surface-200" />
      ) : (
        <p className="mt-1.5 truncate text-xl font-medium tracking-tight tabular-nums text-foreground">
          {value}
        </p>
      )}
      {hint && (
        <p className="mt-1 truncate text-xs text-foreground-lighter">{hint}</p>
      )}
    </Wrapper>
  );
}

export default StatTile;
