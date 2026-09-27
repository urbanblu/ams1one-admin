"use client";

import { cn } from "@heroui/react";
import React from "react";

type Segment<T extends string> = {
  key: T;
  label: string;
  icon?: React.ReactNode;
};

type Props<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  /** Stretch each segment to equal width. */
  fullWidth?: boolean;
};

/**
 * Toggle group: a bordered track on the chrome fill, with the selected item
 * lifted onto white and given its own border. No brand fill — selection is
 * shown by surface, the way the rest of the console shows state.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className,
  fullWidth,
}: Props<T>) {
  return (
    <div
      className={cn(
        "inline-flex gap-0.5 rounded-md border border-border bg-surface-100 p-0.5",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {segments.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={cn(
            "flex h-7 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 text-xs transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500",
            "[&>svg]:size-3.5",
            fullWidth && "flex-1",
            value === key
              ? "border border-border bg-surface font-medium text-foreground"
              : "border border-transparent text-foreground-light hover:text-foreground",
          )}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );
}

export default SegmentedControl;
