"use client";

import { cn } from "@heroui/react";
import React from "react";

/**
 * The panel. White fill, 8px radius, a visible 1px border and no shadow —
 * separation comes entirely from the border, never from elevation or a fill
 * difference with the canvas.
 */
export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-surface",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Rendered bare at 16px in the muted glyph colour — no tinted chip. */
  icon?: React.ReactNode;
  /** Escape hatch for the rare header icon that carries meaning by colour. */
  iconClassName?: string;
  action?: React.ReactNode;
  className?: string;
};

export function CardHeader({
  title,
  description,
  icon,
  iconClassName,
  action,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border px-5 py-3.5",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span
            className={cn(
              "flex shrink-0 items-center justify-center [&>svg]:size-4",
              iconClassName ?? "text-foreground-muted",
            )}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {title}
          </p>
          {description && (
            <p className="mt-0.5 truncate text-xs text-foreground-light">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-4", className)} {...rest}>
      {children}
    </div>
  );
}

/** The panel footer: a quieter strip on the chrome fill. */
export function CardFooter({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-t border-border bg-surface-100 px-5 py-2.5 text-xs text-foreground-light",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
