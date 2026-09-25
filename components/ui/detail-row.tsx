"use client";

import { cn } from "@heroui/react";
import React from "react";

type Props = {
  icon?: React.ReactNode;
  /** Tailwind classes for the chip, e.g. "bg-amber-50 text-amber-500". */
  iconClassName?: string;
  label: React.ReactNode;
  /** Trailing figure. Omit for label-only rows. */
  value?: React.ReactNode;
  valueClassName?: string;
  className?: string;
};

/**
 * Label + optional trailing figure, with the small icon chip.
 *
 * `size-7 rounded-lg` with a `size-3.5` glyph is the step down from the
 * card-header chip (`size-9 rounded-xl` / `size-4`), for rows inside a card
 * body rather than a card header.
 */
export function DetailRow({
  icon,
  iconClassName,
  label,
  value,
  valueClassName,
  className,
}: Props) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg [&>svg]:size-3.5",
              iconClassName ?? "bg-subtle text-zinc-400",
            )}
          >
            {icon}
          </span>
        )}
        <span className="truncate text-xs text-muted-foreground">{label}</span>
      </div>
      {value !== undefined && value !== null && value !== "" && (
        <span
          className={cn(
            "shrink-0 text-xs font-semibold tabular-nums text-foreground",
            valueClassName,
          )}
        >
          {value}
        </span>
      )}
    </div>
  );
}

export default DetailRow;
