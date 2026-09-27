"use client";

import { cn } from "@heroui/react";
import React from "react";

type ToggleOption = {
  key: string;
  label: string;
  /**
   * The figure this option stands for — how many rows it covers, what they
   * are worth. A filter that shows it stops being a blind switch: you can
   * see what you are about to hide before you hide it.
   */
  hint?: React.ReactNode;
};

type Props = {
  options: ToggleOption[];
  /** Keys currently switched on. */
  selectedKeys: string[];
  onToggle: (key: string, next: boolean) => void;
  /** Names the group for assistive tech, e.g. "Filter by game type". */
  label: string;
  className?: string;
};

/**
 * Multi-select sibling of SegmentedControl — the same bordered track on the
 * chrome fill, with the same lifted-onto-white selected item, except every
 * option toggles independently. A segmented control can show state with
 * surface alone because exactly one item is ever lifted; a filter cannot, so
 * each option also carries a dot that fills when it is on.
 */
export function FilterToggleGroup({
  options,
  selectedKeys,
  onToggle,
  label,
  className,
}: Props) {
  const selected = React.useMemo(() => new Set(selectedKeys), [selectedKeys]);

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex flex-wrap gap-0.5 rounded-md border border-border bg-surface-100 p-0.5",
        className,
      )}
    >
      {options.map((option) => {
        const isOn = selected.has(option.key);
        return (
          <button
            key={option.key}
            type="button"
            role="switch"
            aria-checked={isOn}
            onClick={() => onToggle(option.key, !isOn)}
            className={cn(
              "flex h-7 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 text-xs transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500",
              isOn
                ? "border border-border bg-surface font-medium text-foreground"
                : "border border-transparent text-foreground-light hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full transition-colors",
                isOn ? "bg-brand-500" : "bg-foreground-muted",
              )}
            />
            {option.label}
            {option.hint != null && (
              <span
                className={cn(
                  "ml-0.5 tabular-nums transition-colors",
                  isOn ? "text-foreground-light" : "text-foreground-muted",
                )}
              >
                {option.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default FilterToggleGroup;
