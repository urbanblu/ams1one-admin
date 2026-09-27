"use client";

import { cn } from "@heroui/react";
import React from "react";
import { LuSearch, LuX } from "react-icons/lu";

type Props = {
  value?: string;
  defaultValue?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

/** Standalone search field — leading magnifier, clear button when filled. */
export function SearchInput({
  value,
  defaultValue,
  onChange,
  placeholder = "Search…",
  className,
}: Props) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = value ?? internal;

  const update = (next: string) => {
    if (value === undefined) setInternal(next);
    onChange(next);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <LuSearch className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-foreground-muted" />
      <input
        value={current}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-8 w-full rounded-md border border-border-strong bg-surface pl-8 pr-8 text-xs text-foreground",
          "outline-none transition-colors placeholder:text-foreground-lighter",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
        )}
      />
      {current && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => update("")}
          className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm text-foreground-muted transition-colors after:absolute after:-inset-2.5 after:content-[''] hover:bg-surface-200 hover:text-foreground"
        >
          <LuX className="size-3" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
