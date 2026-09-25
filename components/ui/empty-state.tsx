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
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className,
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-subtle flex items-center justify-center mb-3 text-zinc-300 [&>svg]:size-5">
        {icon ?? <LuInbox />}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
