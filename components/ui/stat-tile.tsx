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
        "bg-surface border border-border-subtle rounded-2xl px-5 py-4 text-left w-full",
        onClick &&
          "cursor-pointer transition-all hover:bg-subtle/60 active:scale-[0.99]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider truncate">
            {label}
          </p>
          {isLoading ? (
            <div className="h-6 w-24 bg-subtle rounded animate-pulse mt-2" />
          ) : (
            <p className="text-xl font-bold text-foreground tracking-tight mt-1.5 truncate">
              {value}
            </p>
          )}
          {hint && (
            <p className="text-[11px] text-muted-foreground mt-1 truncate">
              {hint}
            </p>
          )}
        </div>
        {icon && (
          <span
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 [&>svg]:size-4",
              iconClassName ?? "bg-primary-soft text-primary",
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </Wrapper>
  );
}

export default StatTile;
