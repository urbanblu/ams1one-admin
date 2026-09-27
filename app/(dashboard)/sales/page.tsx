"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import FirstSalesSegment from "./_components/first-segment";
import SecondSalesSegment from "./_components/second-segment";
import ThirdSalesSegment from "./_components/third-segment";
import { usePageAccess } from "@/hooks/use-page-access";
import { AppBarActions, PageShell, SegmentedControl } from "@/components/ui";
import { LuTicket, LuTrophy, LuUsers } from "react-icons/lu";

type Tab = "tickets" | "writers" | "winnings";
const VALID_TABS: Tab[] = ["tickets", "writers", "winnings"];

function SalesPageView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { hasAnyPage } = usePageAccess();

  const canSeeTickets = hasAnyPage(
    "sales.detailed_tickets",
    "sales.today_sales",
  );
  const canSeeWriters = hasAnyPage(
    "sales.writer_statistics",
    "sales.today_topups",
    "sales.available_float",
  );
  const canSeeWinnings = hasAnyPage(
    "sales.winning_events",
    "sales.winners_list",
    "sales.today_wins",
    "sales.today_claims",
  );

  const rawTab = searchParams.get("tab") ?? "";
  const activeTab: Tab = VALID_TABS.includes(rawTab as Tab)
    ? (rawTab as Tab)
    : "tickets";

  const defaultTab: Tab = canSeeTickets
    ? "tickets"
    : canSeeWriters
      ? "writers"
      : "winnings";
  const isCurrentTabAccessible =
    (activeTab === "tickets" && canSeeTickets) ||
    (activeTab === "writers" && canSeeWriters) ||
    (activeTab === "winnings" && canSeeWinnings);
  const effectiveTab: Tab = isCurrentTabAccessible ? activeTab : defaultTab;

  useEffect(() => {
    if (activeTab !== effectiveTab) {
      router.replace(`${pathname}?tab=${effectiveTab}`);
    }
  }, [activeTab, effectiveTab, router, pathname]);

  const setActiveTab = (tab: Tab) => {
    router.push(`${pathname}?tab=${tab}`);
  };

  const segments = [
    canSeeTickets && {
      key: "tickets" as const,
      label: "Tickets",
      icon: <LuTicket />,
    },
    canSeeWriters && {
      key: "writers" as const,
      label: "Writers",
      icon: <LuUsers />,
    },
    canSeeWinnings && {
      key: "winnings" as const,
      label: "Winnings",
      icon: <LuTrophy />,
    },
  ].filter(Boolean) as { key: Tab; label: string; icon: React.ReactNode }[];

  return (
    <PageShell fill className="w-full">
      {segments.length > 1 && (
        <AppBarActions>
          <SegmentedControl
            segments={segments}
            value={effectiveTab}
            onChange={setActiveTab}
          />
        </AppBarActions>
      )}

      {/* Keyed on the tab so the panel replays its entrance on every switch:
          the segments share a footprint, and without it the swap reads as a
          repaint rather than as one panel giving way to another. The animation
          runs unconditionally at mount rather than on a class the page toggles
          later, so there is no state in which the content stays hidden. */}
      <div
        key={effectiveTab}
        className="min-h-0 flex-1 animate-rise-in overflow-hidden"
      >
        {effectiveTab === "tickets" && canSeeTickets && <FirstSalesSegment />}
        {effectiveTab === "writers" && canSeeWriters && <SecondSalesSegment />}
        {effectiveTab === "winnings" && canSeeWinnings && <ThirdSalesSegment />}
      </div>
    </PageShell>
  );
}

export default function SalesPage() {
  return (
    <Suspense>
      <SalesPageView />
    </Suspense>
  );
}
