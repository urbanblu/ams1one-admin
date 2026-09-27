"use client";

import { cn } from "@heroui/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState, useSyncExternalStore } from "react";
import useAuth from "@/stores/auth.store";
import AuthService from "@/api/auth";
import { usePageAccess } from "@/hooks/use-page-access";
import { Avatar } from "@/components/ui";
import { AppBarIdentitySlot, AppBarSlots } from "@/components/ui/app-bar";
import { LuChevronRight, LuMenu, LuX } from "react-icons/lu";
/* The rail is drawn duotone: the tinted body reads at a glance in the
   collapsed state, where the glyph is the only label there is. The hamburger,
   close and breadcrumb chevron stay Lucide — they are open line glyphs with no
   enclosed area, so a second tone would have nothing to fill. */
import {
  PiBuildingsDuotone,
  PiCalendarDotsDuotone,
  PiChartBarDuotone,
  PiDeviceMobileDuotone,
  PiDiceFiveDuotone,
  PiFileTextDuotone,
  PiGearDuotone,
  PiMoneyWavyDuotone,
  PiShoppingBagOpenDuotone,
  PiSidebarSimpleDuotone,
  PiSignOutDuotone,
  PiSquaresFourDuotone,
  PiUsersDuotone,
  PiUsersThreeDuotone,
} from "react-icons/pi";

type NavEntry = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  pagePrefixes: string[];
};

const navGroups: { title: string; items: NavEntry[] }[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Sales",
        href: "/sales?tab=tickets",
        icon: PiSquaresFourDuotone,
        pagePrefixes: ["sales."],
      },
      {
        label: "Analysis",
        href: "/analysis",
        icon: PiChartBarDuotone,
        pagePrefixes: ["analysis."],
      },
      {
        label: "Reports",
        href: "/reports",
        icon: PiFileTextDuotone,
        pagePrefixes: ["reports."],
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        label: "Draws",
        href: "/draws",
        icon: PiDiceFiveDuotone,
        pagePrefixes: ["draw.", "autodraw."],
      },
      {
        label: "Events & Tickets",
        href: "/events",
        icon: PiCalendarDotsDuotone,
        pagePrefixes: ["events."],
      },
      {
        label: "Payments",
        href: "/admin-payouts",
        icon: PiMoneyWavyDuotone,
        pagePrefixes: ["admin_payouts."],
      },
    ],
  },
  {
    title: "Network",
    items: [
      {
        label: "Supervisors",
        href: "/supervisors",
        icon: PiBuildingsDuotone,
        pagePrefixes: ["supervisors."],
      },
      {
        label: "Writers",
        href: "/writers",
        icon: PiShoppingBagOpenDuotone,
        pagePrefixes: ["writers."],
      },
      {
        label: "Dollar Rush Players",
        href: "/dollar-rush-players",
        icon: PiUsersDuotone,
        pagePrefixes: ["players.dollar_rush."],
      },
      {
        /* The game was renamed 5/90 -> 6/90; the route, the API's `game`
           segment and the permission keys still say five-ninety. */
        label: "6/90 Players",
        href: "/five-ninety-players",
        icon: PiUsersThreeDuotone,
        pagePrefixes: ["players.five_ninety."],
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        label: "App Releases",
        href: "/app-releases",
        icon: PiDeviceMobileDuotone,
        pagePrefixes: ["admin_payouts.", "admin."],
      },
    ],
  },
];

function canSeeItem(
  pages: string[] | "*" | undefined,
  prefixes: string[],
): boolean {
  if (!pages) return true; // pages not yet loaded — show all to avoid flash
  if (pages === "*") return true;
  return pages.some((key) => prefixes.some((prefix) => key.startsWith(prefix)));
}

/** "operations_manager" -> "Operations Manager". */
function formatRole(role?: string | null) {
  if (!role) return "Administrator";
  return role
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** "dollar-rush-players" -> "Dollar Rush Players". */
function titleCaseSegment(segment: string) {
  return segment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Where the reader is, read off the route rather than passed down from each
 * page — the app bar has to say something on every route, including the ones
 * that have no nav entry of their own.
 */
type Crumbs = {
  trail: string[];
  /** The trail ends in a synthesised "Details" a mounted page may replace. */
  generic: boolean;
};

function crumbsFor(pathname: string): Crumbs {
  const match = navGroups
    .flatMap((group) =>
      group.items.map((item) => ({
        group: group.title,
        item,
        base: item.href.split("?")[0],
      })),
    )
    .filter(({ base }) => pathname === base || pathname.startsWith(`${base}/`))
    // A deeper href wins, so "/players/dollar-rush" beats "/players".
    .sort((a, b) => b.base.length - a.base.length)[0];

  if (match) {
    const isDetail = pathname.length > match.base.length;
    return isDetail
      ? { trail: [match.group, match.item.label, "Details"], generic: true }
      : { trail: [match.group, match.item.label], generic: false };
  }

  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return { trail: ["Home"], generic: false };
  return segments.length > 1
    ? { trail: [titleCaseSegment(segments[0]), "Details"], generic: true }
    : { trail: [titleCaseSegment(segments[0])], generic: false };
}

type NavItemProps = {
  item: NavEntry;
  active: boolean;
  collapsed?: boolean;
  onNavigate: (href: string) => void;
};

function NavItem({ item, active, collapsed, onNavigate }: NavItemProps) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onNavigate(item.href)}
      /* Collapsed, the icon is the only label there is, so the name has to
         survive as the accessible name and as the hover tooltip. */
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex w-full cursor-pointer items-center rounded-md py-1.5 text-sm transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500",
        collapsed ? "justify-center px-0" : "gap-2.5 px-2",
        active
          ? "bg-surface-300 font-medium text-foreground"
          : "text-foreground-light hover:bg-surface-200 hover:text-foreground",
      )}
    >
      {/* A duotone glyph carries most of its area at 20% opacity, so it needs
          a colour with room to fade — at the muted step the tinted body drops
          out entirely and the icon reads as a plain outline. */}
      <Icon
        className={cn(
          "size-4 shrink-0 transition-colors",
          active
            ? "text-brand-600"
            : "text-foreground-light group-hover:text-foreground",
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );
}

function AccountActions({
  canSeeSettings,
  onNavigate,
  onLogout,
  className,
}: {
  canSeeSettings: boolean;
  onNavigate: (href: string) => void;
  onLogout: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex shrink-0", className)}>
      {canSeeSettings && (
        <button
          onClick={() => onNavigate("/settings")}
          aria-label="Settings"
          title="Settings"
          className="relative flex size-6 cursor-pointer items-center justify-center rounded-md text-foreground-light transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-surface-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500"
        >
          <PiGearDuotone className="size-4" />
        </button>
      )}
      <button
        onClick={onLogout}
        aria-label="Sign out"
        title="Sign out"
        className="relative flex size-6 cursor-pointer items-center justify-center rounded-md text-foreground-light transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500"
      >
        <PiSignOutDuotone className="size-4" />
      </button>
    </div>
  );
}

type SidebarContentProps = {
  pathname: string;
  onNavigate: (href: string) => void;
  onLogout: () => void;
  fullName: string;
  role: string;
  email?: string;
  photoUrl?: string;
  pages?: string[] | "*";
  onClose?: () => void;
  /** Desktop only — icon rail instead of the full rail. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

function SidebarContent({
  pathname,
  onNavigate,
  onLogout,
  fullName,
  role,
  email,
  photoUrl,
  pages,
  onClose,
  collapsed,
  onToggleCollapse,
}: SidebarContentProps) {
  const { hasPage } = usePageAccess();
  const canSeeSettings =
    hasPage("admin.users") || hasPage("admin.activity_logs");

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canSeeItem(pages, item.pagePrefixes)),
    }))
    .filter((group) => group.items.length > 0);

  // The mark links to whatever the first page this account can actually open
  // is, so it never lands a restricted user on a forbidden route.
  const homeHref = visibleGroups[0]?.items[0]?.href;

  return (
    <div className="flex h-full flex-col bg-background-alt">
      {/* Brand lockup — the mark alone left the header reading as dead
          space, so it carries the wordmark and doubles as the home link. */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b border-border px-2">
        {collapsed ? (
          /* Nothing else fits at this width, so the mark is the control: it
             reads as the logo until you reach for it, then as "expand". */
          <button
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="group relative mx-auto flex size-10 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-surface-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500"
          >
            <Image
              src="/images/new/logo.png"
              alt="Ams1one Lottery"
              width={64}
              height={56}
              className="h-7 w-auto object-contain transition-opacity group-hover:opacity-0"
              priority
            />
            <PiSidebarSimpleDuotone className="absolute size-4 text-foreground-light opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ) : (
          <button
            onClick={() => homeHref && onNavigate(homeHref)}
            disabled={!homeHref}
            aria-label="Ams1one Lottery admin console — go to start page"
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-surface-200 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500 disabled:cursor-default disabled:hover:bg-transparent"
          >
            <Image
              src="/images/new/logo.png"
              alt=""
              width={64}
              height={56}
              className="h-7 w-auto shrink-0 object-contain"
              priority
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium tracking-tight text-foreground">
              Ams1one Lottery
            </span>
          </button>
        )}
        {!collapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="hidden size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500 md:flex"
          >
            <PiSidebarSimpleDuotone className="size-4" />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border-strong bg-surface text-foreground-light transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-surface-200 hover:text-foreground md:hidden"
          >
            <LuX className="size-3.5" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav
        className={cn(
          "flex-1 space-y-4 overflow-y-auto py-3",
          collapsed ? "px-3" : "px-2",
        )}
      >
        {visibleGroups.map((group, index) => (
          <div key={group.title} className="space-y-0.5">
            {collapsed ? (
              /* The group headings can't be read at this width, so a rule
                 carries the grouping instead. */
              index > 0 && <div className="mx-1 mb-2 h-px bg-border" />
            ) : (
              <p className="px-2 pb-1 text-xs text-foreground-lighter">
                {group.title}
              </p>
            )}
            {group.items.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                active={pathname.startsWith(item.href.split("?")[0])}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: account. Settings and sign out are the only two things
          anyone comes down here for, so they sit in the open rather than
          behind a menu — one click, no popover to place. */}
      <div className="shrink-0 border-t border-border p-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1">
            <Avatar name={fullName} src={photoUrl} size="sm" gradient />
            <AccountActions
              canSeeSettings={canSeeSettings}
              onNavigate={onNavigate}
              onLogout={onLogout}
              className="flex-col gap-1"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Avatar name={fullName} src={photoUrl} size="sm" gradient />
            {/* Both lines clamp inside this column, so neither one can push
                the buttons around or run on underneath them. That is what
                lets the buttons sit in flow and centre against the pair
                instead of being pinned to the top-right corner. */}
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-medium leading-tight text-foreground"
                title={fullName}
              >
                {fullName}
              </p>
              <p
                className="mt-0.5 truncate text-xs leading-tight text-foreground-lighter"
                title={email || role}
              >
                {email || role}
              </p>
            </div>
            <AccountActions
              canSeeSettings={canSeeSettings}
              onNavigate={onNavigate}
              onLogout={onLogout}
              className="gap-0.5"
            />
          </div>
        )}
      </div>
    </div>
  );
}

const COLLAPSE_KEY = "nav-rail-collapsed";

/**
 * The collapsed rail is a browser preference, not app state, so it's read
 * straight off localStorage through an external store — that keeps the server
 * render (always expanded) from fighting the stored value on hydration.
 */
const collapseStore = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    collapseStore.listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      collapseStore.listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  },
  get() {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false; // storage blocked — the rail just stays expanded
    }
  },
  toggle() {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapseStore.get() ? "0" : "1");
    } catch {
      /* the preference simply won't survive a reload */
    }
    collapseStore.listeners.forEach((listener) => listener());
  },
};

function NavRail({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, removeAuth, setAuth } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useSyncExternalStore(
    collapseStore.subscribe,
    collapseStore.get,
    () => false,
  );

  // Re-fetch pages for sessions that predate the permissions feature
  useEffect(() => {
    if (auth && auth.pages === undefined) {
      AuthService.fetchMyPages()
        .then((pages) => setAuth({ ...auth, pages }))
        .catch(() => {
          /* silently ignore — nav shows all items when pages is undefined */
        });
    }
  }, [auth, setAuth]);

  const handleNav = (href: string) => {
    router.push(href);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    removeAuth();
    router.replace("/login");
  };

  const firstName = auth?.user?.first_name ?? "";
  const lastName = auth?.user?.last_name ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Admin";
  const role = formatRole(auth?.user?.role);
  const email = auth?.user?.email ?? undefined;
  const photoUrl = auth?.user?.photo ?? undefined;
  const { trail, generic } = crumbsFor(pathname);

  const sidebarProps: SidebarContentProps = {
    pathname,
    onNavigate: handleNav,
    onLogout: handleLogout,
    fullName,
    role,
    email,
    photoUrl,
    pages: auth?.pages,
  };

  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop rail */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <SidebarContent
          {...sidebarProps}
          collapsed={collapsed}
          onToggleCollapse={collapseStore.toggle}
        />
      </aside>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[var(--z-backdrop)] bg-foreground/40 transition-opacity duration-200 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[var(--z-modal)] flex w-60 flex-col border-r border-border transition-transform duration-200 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent
          {...sidebarProps}
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* App bar. Held at h-14 so its bottom rule continues the one under
            the sidebar's brand lockup rather than sitting proud of it. It
            takes the content fill, not the rail's, so the working area reads
            as one white surface from the bar down. */}
        <header className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border bg-background px-3 lg:px-4">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="relative flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border-strong bg-surface text-foreground-light transition-colors after:absolute after:-inset-1.5 after:content-[''] hover:bg-surface-200 hover:text-foreground md:hidden"
          >
            <LuMenu className="size-3.5" />
          </button>

          {/* The bar's slots: where the reader is, what they are looking at,
              and what they can do to it. A detail page finishes the trail with
              the entity itself; the actions shrink and scroll before the trail
              does, so a crowded bar loses the controls' breathing room rather
              than the reader's sense of place. */}
          <AppBarSlots>
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-1.5"
            >
              {trail.map((crumb, index) => {
                const isLast = index === trail.length - 1;
                /* Stands in until a page names the entity, then stands down. */
                const isPlaceholder = isLast && generic;
                return (
                  <React.Fragment key={`${crumb}-${index}`}>
                    {index > 0 && (
                      /* Hidden in step with the crumb it precedes, so the
                         narrow bar never opens on a dangling chevron. */
                      <LuChevronRight
                        aria-hidden
                        className={cn(
                          "hidden size-3.5 shrink-0 text-foreground-muted sm:block",
                          isPlaceholder &&
                            "group-has-[[data-app-bar-identity]]/bar:hidden",
                        )}
                      />
                    )}
                    <span
                      aria-current={isLast ? "page" : undefined}
                      className={cn(
                        "min-w-0 truncate text-sm",
                        isLast
                          ? "font-medium text-foreground"
                          : "hidden text-foreground-light sm:block",
                        isPlaceholder &&
                          "group-has-[[data-app-bar-identity]]/bar:hidden",
                      )}
                    >
                      {crumb}
                    </span>
                  </React.Fragment>
                );
              })}
              <AppBarIdentitySlot />
            </nav>
          </AppBarSlots>
        </header>

        <main className="flex-1 min-h-0 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

export default NavRail;
