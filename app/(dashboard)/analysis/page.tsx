"use client";
import WritersPerformace from "./_components/writers-performance";
import { Suspense, useState } from "react";
import RetentionRatePerformance from "./_components/rate-performace";
import { usePageAccess } from "@/hooks/use-page-access";
import { AppBarActions, PageShell, SegmentedControl } from "@/components/ui";

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

  const analysisTabs = [
    canSeeWritersPerf && { key: "writers" as const, label: "Writers" },
    canSeeRatePerf && { key: "rate" as const, label: "Retention rate" },
  ].filter(Boolean) as { key: Tab; label: string }[];

  return (
    <PageShell>
      {analysisTabs.length > 1 && (
        <AppBarActions>
          <SegmentedControl
            segments={analysisTabs}
            value={activeTab}
            onChange={setUserSelectedTab}
          />
        </AppBarActions>
      )}

      {activeTab === "writers" && canSeeWritersPerf && <WritersPerformace />}
      {activeTab === "rate" && canSeeRatePerf && <RetentionRatePerformance />}
    </PageShell>
  );
}

export default function AnalysisPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="px-5 py-6 text-sm text-muted-foreground lg:px-8 lg:py-7">
          Loading analysis…
        </div>
      }
    >
      <AnalysisPageView />
    </Suspense>
  );
}
