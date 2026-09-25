"use client";
import WritersPerformace from "./_components/writers-performance";
import { Suspense, useState } from "react";
import { Tabs } from "@heroui/react";
import RetentionRatePerformance from "./_components/rate-performace";
import { usePageAccess } from "@/hooks/use-page-access";
import { PageHeader } from "@/components/ui";

type Tab = "writers" | "rate";

function AnalysisPageView() {
  const { hasAnyPage } = usePageAccess();

  const canSeeWritersPerf = hasAnyPage(
    "analysis.active_writer_daily",
    "analysis.active_writer_daily_download",
    "analysis.top_writers",
    "analysis.topup_stats",
    "analysis.winning_stats",
    "analysis.best_worst",
    "analysis.sales_card",
    "analysis.net_topups_card",
    "analysis.writers_at_work_card",
    "analysis.wins_card",
    "analysis.liquidation_card",
    "analysis.settlements_card",
  );
  const canSeeRatePerf = hasAnyPage(
    "analysis.retention_rate",
    "analysis.retention_trend",
  );

  const [userSelectedTab, setUserSelectedTab] = useState<Tab>("writers");

  // Derive the active tab — fall back to a permitted tab if the user's
  // selection is no longer accessible (e.g. permissions changed after load).
  const canAccess = (tab: Tab) =>
    (tab === "writers" && canSeeWritersPerf) ||
    (tab === "rate" && canSeeRatePerf);
  const activeTab = canAccess(userSelectedTab)
    ? userSelectedTab
    : canSeeWritersPerf
      ? "writers"
      : "rate";

  return (
    <div className="flex flex-col gap-5 px-5 py-6 lg:px-8 lg:py-7">
      <PageHeader
        className="shrink-0"
        title="Analysis"
        description="Writer performance and retention trends across the network."
      />
      <div className="shrink-0 sm:max-w-sm">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setUserSelectedTab(key as Tab)}
        >
          <Tabs.ListContainer>
            <Tabs.List
              aria-label="Analysis view"
              className="gap-1 rounded-2xl p-1"
            >
              {canSeeWritersPerf && (
                <Tabs.Tab id="writers" className="h-9 rounded-xl px-4 text-sm">
                  Writers Performance
                  <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
                </Tabs.Tab>
              )}
              {canSeeRatePerf && (
                <Tabs.Tab id="rate" className="h-9 rounded-xl px-4 text-sm">
                  Rate Performance
                  <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
                </Tabs.Tab>
              )}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>

      {activeTab === "writers" && canSeeWritersPerf && <WritersPerformace />}
      {activeTab === "rate" && canSeeRatePerf && <RetentionRatePerformance />}
    </div>
  );
}

export default function AnalysisPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="px-5 py-6 text-sm text-muted-foreground lg:px-8">
          Loading analysis…
        </div>
      }
    >
      <AnalysisPageView />
    </Suspense>
  );
}
