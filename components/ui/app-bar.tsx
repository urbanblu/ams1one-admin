"use client";

import { cn } from "@heroui/react";
import React from "react";
import { createPortal } from "react-dom";
import { LuArrowLeft, LuChevronRight } from "react-icons/lu";
import { Avatar } from "./avatar";
import { IconButton } from "./button";
import { Skeleton } from "./skeleton";

/** The app bar's right-hand slot, filled by whichever page is mounted. */
export const APP_BAR_ACTIONS_ID = "app-bar-actions";

/**
 * The last breadcrumb. A detail page names the entity it is showing, which is
 * a better final crumb than the generic "Details" the bar synthesises from
 * the route — so while this is filled, it takes that crumb's place at the end
 * of the trail.
 */
export const APP_BAR_IDENTITY_ID = "app-bar-identity";

/* The host is a fixed node in the layout, so there is nothing to subscribe
   to — this is `useSyncExternalStore` purely for its server snapshot, which
   keeps the portal out of the hydration pass and lets it mount straight
   after. `getElementById` returns the same node every call, so the snapshot
   is stable. */
const noSubscription = () => () => {};
const readServerHost = () => null;

function useAppBarHost(id: string) {
  const read = React.useCallback(() => document.getElementById(id), [id]);
  return React.useSyncExternalStore(noSubscription, read, readServerHost);
}

/**
 * Publishes a page's controls — tab bars, search fields, primary buttons —
 * into the app bar.
 *
 * A portal rather than a context value: the nodes stay in the page's own
 * React tree, so page state drives them directly and there is no second copy
 * to keep in sync.
 */
export function AppBarActions({ children }: { children: React.ReactNode }) {
  const host = useAppBarHost(APP_BAR_ACTIONS_ID);

  if (!host) return null;
  return createPortal(children, host);
}

type IdentityProps = {
  /** The entity's name — the bar's headline while this page is mounted. */
  name: React.ReactNode;
  /** Secondary identifier: an ID, a phone number, a role. */
  meta?: React.ReactNode;
  /** Defaults to initials from `name`. Pass one for a photo or a photo link. */
  avatar?: React.ReactNode;
  /** Sits immediately after the name — an inline edit affordance. */
  adornment?: React.ReactNode;
  /** Omit to leave the back control out entirely. */
  onBack?: () => void;
  isLoading?: boolean;
};

/**
 * Publishes the entity a detail page is about into the app bar: back control,
 * avatar, name and identifier.
 *
 * Keeping this out of the page body means a detail screen opens on its
 * content rather than on a second, taller header directly under the first —
 * and it puts the entity on the same line as the actions that operate on it.
 */
export function AppBarIdentity({
  name,
  meta,
  avatar,
  adornment,
  onBack,
  isLoading,
}: IdentityProps) {
  const host = useAppBarHost(APP_BAR_IDENTITY_ID);

  if (!host) return null;

  return createPortal(
    /* `data-app-bar-identity` is what the bar keys its breadcrumb off — see
       APP_BAR_IDENTITY_ID above. */
    <div data-app-bar-identity className="flex min-w-0 items-center gap-2.5">
      {onBack && (
        <IconButton label="Go back" onClick={onBack}>
          <LuArrowLeft />
        </IconButton>
      )}

      {isLoading ? (
        <Skeleton className="size-7 shrink-0 rounded-md" />
      ) : (
        (avatar ?? (
          <Avatar
            name={typeof name === "string" ? name : undefined}
            size="sm"
          />
        ))
      )}

      {isLoading ? (
        <Skeleton className="h-3 w-32" />
      ) : (
        <div className="flex min-w-0 items-baseline gap-2">
          {/* The trail's current item as well as the page's heading: the
              placeholder crumb it replaces is display:none, so it takes
              `aria-current` with it out of the accessibility tree. */}
          <h1
            aria-current="page"
            className="min-w-0 truncate text-sm font-medium text-foreground"
          >
            {name}
          </h1>
          {adornment}
          {meta && (
            /* First thing to go when the bar tightens: the name and the
               actions both outrank it. */
            <span className="hidden shrink-0 truncate text-xs tabular-nums text-foreground-light sm:block">
              {meta}
            </span>
          )}
        </div>
      )}
    </div>,
    host,
  );
}

/**
 * Shown when a page fills the identity slot, hidden when none does. Tailwind
 * resolves that from the DOM — `empty:` for the host, `group-has-` for the
 * separator that would otherwise dangle — so neither the bar nor the shell
 * has to hold state about what the mounted page decided to publish.
 */
export function AppBarIdentitySlot() {
  return (
    <>
      <LuChevronRight
        aria-hidden
        className="hidden size-3.5 shrink-0 text-foreground-muted group-has-[[data-app-bar-identity]]/bar:block"
      />
      <div
        id={APP_BAR_IDENTITY_ID}
        className="flex min-w-0 items-center empty:hidden"
      />
    </>
  );
}

/**
 * The bar's slot container. Rendered by the app shell, not by pages: it owns
 * the `bar` group the identity separator keys off, and closes with the
 * right-hand actions host.
 *
 * Both hosts stay mounted whether or not a page fills them — a portal can
 * only find a host already in the document.
 */
export function AppBarSlots({
  children,
  className,
}: {
  /** The breadcrumb trail, ending in `<AppBarIdentitySlot />`. */
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("group/bar flex min-w-0 flex-1 items-center", className)}
    >
      {children}
      <div
        id={APP_BAR_ACTIONS_ID}
        className="ml-auto flex min-w-0 shrink items-center justify-end gap-2 overflow-x-auto"
      />
    </div>
  );
}

export default AppBarActions;
