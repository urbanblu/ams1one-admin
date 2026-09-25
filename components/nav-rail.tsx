"use client";

import { cn, Popover } from "@heroui/react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import useAuth from "@/stores/auth.store";
import AuthService from "@/api/auth";
import { usePageAccess } from "@/hooks/use-page-access";
import { Avatar } from "@/components/ui";
import {
  LuBanknote,
  LuBuilding2,
  LuCalendarDays,
  LuChevronsUpDown,
  LuDices,
  LuFileText,
  LuLayoutDashboard,
  LuLogOut,
  LuMenu,
  LuSettings,
  LuShoppingBag,
  LuSmartphone,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { MdOutlineBarChart } from "react-icons/md";

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
        icon: LuLayoutDashboard,
        pagePrefixes: ["sales."],
      },
      {
        label: "Analysis",
        href: "/analysis",
        icon: MdOutlineBarChart,
        pagePrefixes: ["analysis."],
      },
      {
        label: "Reports",
        href: "/reports",
        icon: LuFileText,
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
        icon: LuDices,
        pagePrefixes: ["draw.", "autodraw."],
      },
      {
        label: "Events & Tickets",
        href: "/events",
        icon: LuCalendarDays,
        pagePrefixes: ["events."],
      },
      {
        label: "Payments",
        href: "/admin-payouts",
        icon: LuBanknote,
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
        icon: LuBuilding2,
        pagePrefixes: ["supervisors."],
      },
      {
        label: "Writers",
        href: "/writers",
        icon: LuShoppingBag,
        pagePrefixes: ["writers."],
      },
      {
        label: "Dollar Rush Players",
        href: "/dollar-rush-players",
        icon: LuUsers,
        pagePrefixes: ["players.dollar_rush."],
      },
      {
        label: "5/90 Players",
        href: "/five-ninety-players",
        icon: LuUsers,
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
        icon: LuSmartphone,
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

type NavItemProps = {
  item: NavEntry;
  active: boolean;
  onNavigate: (href: string) => void;
};

function NavItem({ item, active, onNavigate }: NavItemProps) {
  const Icon = item.icon;
  return (
    <button
      onClick={() => onNavigate(item.href)}
      className={cn(
        "group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all cursor-pointer",
        active
          ? "bg-primary-soft text-primary-strong font-semibold"
          : "text-muted-foreground font-medium hover:bg-subtle hover:text-foreground",
      )}
    >
      <Icon
        className={cn(
          "size-5 shrink-0 transition-colors",
          active ? "text-primary" : "text-zinc-400 group-hover:text-zinc-600",
        )}
      />
      <span className="truncate">{item.label}</span>
    </button>
  );
}

type SidebarContentProps = {
  pathname: string;
  onNavigate: (href: string) => void;
  onLogout: () => void;
  fullName: string;
  role: string;
  photoUrl?: string;
  pages?: string[] | "*";
  onClose?: () => void;
};

function SidebarContent({
  pathname,
  onNavigate,
  onLogout,
  fullName,
  role,
  photoUrl,
  pages,
  onClose,
}: SidebarContentProps) {
  const { hasPage } = usePageAccess();
  const canSeeSettings =
    hasPage("admin.users") || hasPage("admin.activity_logs");
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canSeeItem(pages, item.pagePrefixes)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* Logo */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-border-subtle shrink-0">
        <Image
          src="/images/new/icon.png"
          alt="Ams1one"
          width={34}
          height={34}
          className="object-contain"
          priority
        />
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="relative flex size-9 cursor-pointer items-center justify-center rounded-full bg-subtle text-muted-foreground transition-colors after:absolute after:-inset-1 after:content-[''] hover:text-foreground md:hidden"
          >
            <LuX className="size-4" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              {group.title}
            </p>
            {group.items.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                active={pathname.startsWith(item.href.split("?")[0])}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: user */}
      <div className="px-3 pb-4 pt-3 border-t border-border-subtle shrink-0">
        <Popover isOpen={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
          <Popover.Trigger>
            <button
              className="flex items-center gap-3 w-full px-2.5 py-2.5 rounded-2xl hover:bg-subtle transition-colors cursor-pointer"
              onClick={() => setUserPopoverOpen(!userPopoverOpen)}
            >
              <Avatar name={fullName} src={photoUrl} size="sm" gradient />
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">
                  {fullName}
                </p>
                <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                  {role}
                </p>
              </div>
              <LuChevronsUpDown className="size-4 text-zinc-400 shrink-0" />
            </button>
          </Popover.Trigger>

          <Popover.Content className="w-56 rounded-2xl border border-border-subtle p-1.5 shadow-lg shadow-zinc-200/60">
            <Popover.Dialog className="p-0 space-y-0.5">
              {canSeeSettings && (
                <button
                  className="flex items-center gap-3 w-full px-2.5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-subtle hover:text-foreground transition-colors cursor-pointer group"
                  onClick={() => {
                    setUserPopoverOpen(false);
                    onNavigate("/settings");
                  }}
                >
                  <span className="w-8 h-8 rounded-xl bg-subtle flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                    <LuSettings className="size-3.5" />
                  </span>
                  Settings
                </button>
              )}
              <button
                className="flex items-center gap-3 w-full px-2.5 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer group"
                onClick={() => {
                  setUserPopoverOpen(false);
                  onLogout();
                }}
              >
                <span className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                  <LuLogOut className="size-3.5" />
                </span>
                Sign out
              </button>
            </Popover.Dialog>
          </Popover.Content>
        </Popover>
      </div>
    </div>
  );
}

function NavRail({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { auth, removeAuth, setAuth } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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
  const role = (auth?.user as { role?: string })?.role ?? "Administrator";
  const photoUrl = auth?.user?.photo ?? undefined;

  const sidebarProps: SidebarContentProps = {
    pathname,
    onNavigate: handleNav,
    onLogout: handleLogout,
    fullName,
    role,
    photoUrl,
    pages: auth?.pages,
  };

  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop rail */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border-subtle">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[var(--z-backdrop)] bg-zinc-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[var(--z-modal)] w-64 border-r border-border-subtle flex flex-col md:hidden transition-transform duration-300 ease-out",
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
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border-subtle bg-surface shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="flex size-11 cursor-pointer items-center justify-center rounded-full border border-border-subtle bg-surface text-muted-foreground transition-colors hover:text-foreground"
          >
            <LuMenu className="size-4" />
          </button>
          <Image
            src="/images/new/icon.png"
            alt="Ams1one"
            width={28}
            height={28}
            className="object-contain"
          />
          <div className="size-11" />
        </header>

        <main className="flex-1 min-h-0 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}

export default NavRail;
