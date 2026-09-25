"use client";

import { cn } from "@heroui/react";
import React from "react";

type Props = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons, filters, segmented controls — right aligned on desktop. */
  actions?: React.ReactNode;
  /** Rendered above the title, e.g. a back button or breadcrumb. */
  leading?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  leading,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {leading}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Standard page shell: canvas padding + vertical rhythm.
 *
 * `fill` is for pages that own their height — a header above a table that
 * scrolls internally rather than letting the whole document scroll. It locks
 * at `md`, the same breakpoint the nav rail appears, so the mobile top bar is
 * never competing with a non-scrolling page.
 */
export function PageShell({
  fill,
  className,
  children,
}: {
  /** Lock the page to the viewport and let a child own the scrolling. */
  fill?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-5 px-5 py-6 lg:px-8 lg:py-7",
        fill && "md:h-full md:min-h-0 md:overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default PageHeader;
