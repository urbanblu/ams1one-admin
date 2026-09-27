"use client";

import { cn } from "@heroui/react";
import React from "react";

/**
 * Standard page shell: canvas padding + vertical rhythm.
 *
 * `fill` is for pages that own their height — a header above a table that
 * scrolls internally rather than letting the whole document scroll. It locks
 * at `md`, the same breakpoint the nav rail appears, so the mobile top bar is
 * never competing with a non-scrolling page.
 *
 * `narrow` is for pages that are a single stack of forms or panels. A capped
 * column left-aligned on a 1600px canvas reads as a layout that failed rather
 * than one that chose its width, so the cap comes with centring.
 */
export function PageShell({
  fill,
  narrow,
  className,
  children,
}: {
  /** Lock the page to the viewport and let a child own the scrolling. */
  fill?: boolean;
  /** Cap the content at a readable measure and centre it on the canvas. */
  narrow?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-4 px-4 py-5 lg:px-6 lg:py-6",
        fill && "md:h-full md:min-h-0 md:overflow-hidden",
        narrow && "mx-auto w-full max-w-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default PageShell;
