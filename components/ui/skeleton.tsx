"use client";

import { cn } from "@heroui/react";
import React from "react";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-subtle rounded animate-pulse", className)} />;
}

/** Placeholder rows for avatar + two-line list items. */
export function SkeletonList({
  rows = 5,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-border-subtle", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-2.5 w-36" />
            <Skeleton className="h-2 w-24" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
