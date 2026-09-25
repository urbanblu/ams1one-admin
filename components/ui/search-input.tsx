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
      <LuSearch className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
      <input
        value={current}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-10 text-sm text-foreground",
          "placeholder:text-zinc-400 outline-none transition-colors focus:border-primary",
        )}
      />
      {current && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => update("")}
          className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-zinc-400 transition-colors after:absolute after:-inset-2.5 after:content-[''] hover:bg-subtle hover:text-foreground"
        >
          <LuX className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
