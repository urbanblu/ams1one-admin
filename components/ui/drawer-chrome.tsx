"use client";

import { cn, Drawer } from "@heroui/react";
import React from "react";
import { LuX } from "react-icons/lu";

/**
 * Shared surface treatment for every HeroUI `Drawer.Dialog` in the app.
 *
 * `p-0` matters: HeroUI's `.drawer__dialog` ships `p-6`, which insets every
 * child by 24px and so stops a header rule from ever reaching the drawer's
 * edges. Padding belongs to the title bar, the body and the footer — the same
 * places a `Card` puts it — so the shell carries none.
 *
 * `overflow-hidden` is scoped to `sm` because below that the drawer is
 * full-screen and has to scroll; clipping it there strands the submit button.
 */
export const drawerDialogClass =
  "flex h-full w-full max-w-none flex-col p-0 rounded-none bg-surface sm:rounded-l-xl sm:overflow-hidden sm:border-l sm:border-border";

/**
 * The two drawer widths, composed onto `Drawer.Dialog` alongside
 * `drawerDialogClass` — **not** onto `Drawer.Content`.
 *
 * `Drawer.Content` is the `fixed inset-0` positioning wrapper, and it is what
 * `placement="right"` steers with `justify-end`. Giving *it* a width leaves an
 * element with `left:0`, `right:0` and an explicit width, and in LTR `left`
 * wins — so the panel silently docks to the left edge and `placement` stops
 * meaning anything. The width has to go on the panel inside that wrapper.
 *
 * `wide` clears CustomTable's 720px content floor so a table inside a drawer
 * doesn't get its own nested horizontal scrollbar.
 */
export const drawerWidth = {
  /** Forms and entity detail — a single column of fields. */
  form: "sm:w-[28rem] sm:max-w-[28rem] sm:min-w-[300px]",
  /** Anything containing a data table. */
  wide: "lg:w-[55rem] lg:max-w-[55rem] sm:min-w-[300px]",
} as const;

/**
 * The scrolling middle of a drawer. `mx-0` cancels the -3px horizontal margin
 * HeroUI's body slot uses for its scrollbar, so the fields line up with the
 * title bar above them rather than sitting 3px wider than it.
 */
export const drawerBodyClass = "min-h-0 flex-1 overflow-y-auto mx-0 px-5 py-5";

/**
 * Where a drawer's primary action lives — the panel footer treatment from the
 * design system, pinned so the submit stays reachable however long the form is.
 */
export const drawerFooterClass =
  "shrink-0 mt-0 border-t border-border bg-surface-100 px-5 py-3.5";

type TitleBarProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  iconClassName?: string;
  onClose: () => void;
  className?: string;
  /** Right of the title, left of the close button — a status badge, a count. */
  adornment?: React.ReactNode;
};

/**
 * Icon + title + close button, matching the panel headers.
 *
 * The title renders through `Drawer.Heading`, which carries React Aria's
 * `slot="title"` — that is what gives the dialog its accessible name, so a
 * drawer must take its heading from here rather than printing one into its body.
 */
export function DrawerTitleBar({
  title,
  description,
  icon,
  iconClassName,
  onClose,
  className,
  adornment,
}: TitleBarProps) {
  return (
    <div
      className={cn(
        "flex w-full shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-3.5",
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
          <Drawer.Heading className="truncate text-sm font-medium tracking-tight text-foreground">
            {title}
          </Drawer.Heading>
          {description && (
            <p className="mt-0.5 text-xs text-foreground-light">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {adornment}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border-strong bg-surface text-foreground-light transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-surface-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500"
        >
          <LuX className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export default DrawerTitleBar;
