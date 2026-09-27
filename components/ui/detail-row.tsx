"use client";

import { cn } from "@heroui/react";
import React from "react";

type Props = {
  icon?: React.ReactNode;
  /** Escape hatch for an icon that carries meaning by colour. */
  iconClassName?: string;
  label: React.ReactNode;
  /** Trailing figure. Omit for label-only rows. */
  value?: React.ReactNode;
  valueClassName?: string;
  className?: string;
};

/**
 * Label + optional trailing figure. The icon is a bare 14px glyph in the muted
 * colour; a row inside a panel body never carries a tinted chip.
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
      <div className="flex min-w-0 items-center gap-2">
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
        <span className="truncate text-xs text-foreground-light">{label}</span>
      </div>
      {value !== undefined && value !== null && value !== "" && (
        <span
          className={cn(
            "shrink-0 text-xs font-medium tabular-nums text-foreground",
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
