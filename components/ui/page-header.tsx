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
          <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
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

/** Standard page shell: canvas padding + vertical rhythm. */
export function PageShell({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("px-5 py-6 lg:px-8 lg:py-7 space-y-5", className)}>
      {children}
    </div>
  );
}

export default PageHeader;
