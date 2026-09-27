"use client";

import { cn } from "@heroui/react";
import React from "react";

/**
 * A labelled group of form fields, closed off by a rule.
 *
 * Long forms rendered as one flat `space-y-4` column give "Confirm password"
 * the same separation from "Password" as from "Supervisor", so the reader has
 * to parse every label to find the boundaries. Grouping restores the
 * tight-within / loose-between rhythm the rest of the app uses.
 */
export function FormSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3.5", className)}>
      <h3 className="border-b border-border pb-2 text-xs font-medium text-foreground-light">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default FormSection;
