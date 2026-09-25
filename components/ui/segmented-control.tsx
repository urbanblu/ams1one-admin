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
        "inline-flex bg-surface rounded-2xl p-1.5 gap-1 border border-border-subtle",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {segments.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            "flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[0.8rem] font-medium transition-all cursor-pointer whitespace-nowrap",
            "[&>svg]:size-3.5",
            fullWidth && "flex-1",
            value === key
              ? "bg-brand-gradient text-white"
              : "text-muted-foreground hover:text-foreground",
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
