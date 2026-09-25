"use client";

import { cn } from "@heroui/react";
import React from "react";
import { LuX } from "react-icons/lu";

/**
 * Shared surface treatment for every HeroUI `Drawer.Dialog` in the app.
 *
 * `overflow-hidden` is scoped to `sm` because below that the drawer is
 * full-screen and has to scroll; clipping it there strands the submit button.
 */
export const drawerDialogClass =
  "rounded-none bg-surface sm:rounded-l-3xl sm:overflow-hidden";

/**
 * The two drawer widths. Applied to `Drawer.Content`, not `Drawer.Dialog`.
 *
 * `wide` clears CustomTable's 720px content floor so a table inside a drawer
 * doesn't get its own nested horizontal scrollbar.
 */
export const drawerWidth = {
  /** Forms and entity detail — a single column of fields. */
  form: "w-full sm:w-[28rem]! sm:max-w-[28rem] sm:min-w-[300px] bg-surface h-dvh",
  /** Anything containing a data table. */
  wide: "w-full lg:w-[55rem]! lg:max-w-[55rem] sm:min-w-[300px] bg-surface h-dvh",
} as const;

type TitleBarProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  iconClassName?: string;
  onClose: () => void;
  className?: string;
};

/** Icon chip + title + close button, matching the card headers. */
export function DrawerTitleBar({
  title,
  description,
  icon,
  iconClassName,
  onClose,
  className,
}: TitleBarProps) {
  return (
    <div
      className={cn(
        "flex w-full items-start justify-between gap-3 border-b border-border-subtle px-5 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl [&>svg]:size-4",
              iconClassName ?? "bg-primary-soft text-primary",
            )}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-tight text-foreground">
            {title}
          </p>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="relative flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-subtle text-muted-foreground transition-colors after:absolute after:-inset-1 after:content-[''] hover:bg-zinc-200 hover:text-foreground"
      >
        <LuX className="size-4" />
      </button>
    </div>
  );
}

export default DrawerTitleBar;
