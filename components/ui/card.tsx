"use client";

import { cn } from "@heroui/react";
import React from "react";

/**
 * Flat white surface on the app canvas — the core container of the
 * Ams1one design language. No shadow, hairline border, generous radius.
 */
export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface border border-border-subtle rounded-2xl overflow-hidden",
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
  /** Small tinted square that holds the section icon. */
  icon?: React.ReactNode;
  /** Tailwind classes for the icon chip, e.g. "bg-violet-50 text-violet-500". */
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
        "flex items-center justify-between gap-3 px-5 py-4 border-b border-border-subtle",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <span
            className={cn(
              "size-9 rounded-xl flex items-center justify-center shrink-0 [&>svg]:size-4",
              iconClassName ?? "bg-primary-soft text-primary",
            )}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {title}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
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

export function CardFooter({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-5 py-3 border-t border-border-subtle text-xs text-muted-foreground",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
