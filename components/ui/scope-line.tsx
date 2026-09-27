"use client";

import { cn } from "@heroui/react";
import React from "react";

/**
 * Heads a scope line: an icon and the phrase that says what everything after
 * it is measured over — "On this page", "Across the roster". The figures that
 * follow inherit that scope, so it is stated once rather than per fact.
 */
export function ScopeLabel({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5 text-foreground-light">
      {icon && (
        <span className="shrink-0 text-foreground-muted [&>svg]:size-3.5">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}

/** A figure in a scope line: the number carries the emphasis, not the noun. */
export function ScopeFact({
  value,
  label,
}: {
  value: React.ReactNode;
  label?: string;
}) {
  return (
    <span className="text-foreground-light">
      <span className="font-medium tabular-nums text-foreground">{value}</span>
      {label ? ` ${label}` : null}
    </span>
  );
}

/**
 * The toolbar line above a table — `HeroScope`'s counterpart on a light
 * surface. Each separator travels with the fact it introduces, so a line
 * that wraps never ends on a dangling middot, and falsy entries drop out so
 * a caller can gate a fact on a permission inline.
 */
export function ScopeLine({
  facts,
  className,
}: {
  facts: React.ReactNode[];
  className?: string;
}) {
  const visible = facts.filter(Boolean);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs",
        className,
      )}
    >
      {visible.map((fact, index) => (
        <span key={index} className="flex items-center gap-x-2.5">
          {index > 0 && (
            <span aria-hidden="true" className="text-foreground-muted">
              ·
            </span>
          )}
          {fact}
        </span>
      ))}
    </div>
  );
}
