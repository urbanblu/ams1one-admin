"use client";

import { cn } from "@heroui/react";
import React from "react";
import { LuInbox } from "react-icons/lu";

type Props = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title = "Nothing here yet",
  description,
  icon,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-3 text-foreground-muted [&>svg]:size-5">
        {icon ?? <LuInbox />}
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-foreground-light">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
