"use client";

import React from "react";
import { LuLoaderCircle, LuTriangleAlert } from "react-icons/lu";
import { EmptyState } from "./empty-state";

type Props = {
  isPending: boolean;
  isError?: boolean;
  error?: unknown;
  isEmpty?: boolean;
  children: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ReactNode;
  /** Replaces the default spinner, e.g. with a skeleton matching the layout. */
  loadingFallback?: React.ReactNode;
};

/** Standard loading / error / empty wrapper for a React Query result. */
export function QueryState({
  isPending,
  isError,
  error,
  isEmpty,
  children,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  loadingFallback,
}: Props) {
  if (isPending) {
    return (
      <>
        {loadingFallback ?? (
          <div className="flex items-center justify-center py-16">
            <LuLoaderCircle className="size-5 animate-spin text-primary" />
          </div>
        )}
      </>
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mb-3 text-rose-400">
          <LuTriangleAlert className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Couldn&apos;t load this
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{message}</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
      />
    );
  }

  return <>{children}</>;
}

export default QueryState;
