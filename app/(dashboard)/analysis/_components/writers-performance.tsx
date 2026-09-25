"use client";

import { Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Axios from "@/api";
import FinancialsService from "@/api/financials";
import WritersService from "@/api/writers";
import { usePageAccess } from "@/hooks/use-page-access";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  LuWallet,
  LuTrophy,
  LuTrendingUp,
  LuTrendingDown,
  LuPercent,
  LuMedal,
  LuUpload,
} from "react-icons/lu";
import type { ElementType } from "react";
import ChartColors from "@/utils/chart-colors";
import { Avatar, MetricCard, SegmentedControl } from "@/components/ui";

function WritersPerformace() {
  const { hasPage } = usePageAccess();
  const canSeeChart = hasPage("analysis.active_writer_daily");
  const canSeeExport = hasPage("analysis.active_writer_daily_download");
  const canSeeTopWriters = hasPage("analysis.top_writers");
  const canSeeTopUpStats = hasPage("analysis.topup_stats");
  const canSeeWinStats = hasPage("analysis.winning_stats");
  const canSeeBestWorst = hasPage("analysis.best_worst");
  const canSeeRetentionRate = hasPage("analysis.retention_rate");

  const [rangeDays, setRangeDays] = useState<30 | 365>(30);

  const { data: topUpStats } = useQuery({
    queryKey: ["financials", "topup-statistics"],
    queryFn: FinancialsService.fetchTopUpStatistics,
  });

  const { data: winStats } = useQuery({
    queryKey: ["financials", "winning-statistics"],
    queryFn: FinancialsService.fetchWinningStatistics,
  });

  const { data: bestWorst } = useQuery({
    queryKey: ["financials", "best-worst-performance"],
    queryFn: FinancialsService.fetchBestWorstPerformance,
  });

  const { data: retention } = useQuery({
    queryKey: ["financials", "retention-rate"],
    queryFn: FinancialsService.fetchRetentionRate,
  });

  const { data: top10 = [] } = useQuery({
    queryKey: ["writers", "top-10"],
    queryFn: () => WritersService.fetchTop10Writers(),
  });

  const { data: activeWriterDaily30 } = useQuery({
    queryKey: ["writers", "active-writer-daily-stats", 30],
    queryFn: () => WritersService.fetchActiveWriterDailyStats(30),
  });

  const { data: activeWriterDaily365 } = useQuery({
    queryKey: ["writers", "active-writer-daily-stats", 365],
    queryFn: () => WritersService.fetchActiveWriterDailyStats(365),
  });

  const activeWriterDaily =
    rangeDays === 30 ? activeWriterDaily30 : activeWriterDaily365;
  const rawChartDays = activeWriterDaily?.days ?? [];
  const downloadUrl = activeWriterDaily?.download_url;

  // For long ranges (1 year) downsample to keep chart readable.
  const chartDays = (() => {
    const maxBars = 60;
    if (rawChartDays.length <= maxBars) return rawChartDays;

    const step = Math.ceil(rawChartDays.length / maxBars);
    const sampled = rawChartDays.filter((_, i) => i % step === 0);
    const last = rawChartDays[rawChartDays.length - 1];
    return last ? [...sampled, last] : sampled;
  })();

  return (
    <div className="flex flex-col space-y-5">
      {(canSeeChart ||
        canSeeTopUpStats ||
        canSeeWinStats ||
        canSeeBestWorst) && (
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-4 h-auto">
          {canSeeChart && (
            <div className="lg:col-span-3 flex min-w-0 flex-col rounded-2xl border border-border-subtle bg-surface px-5 py-4 lg:min-h-[400px]">
              <div className="flex flex-col h-full">
                <div className="md:flex md:justify-between space-y-5 md:space-y-0">
                  <div className="flex-col space-y-2">
                    <div className="text-sm font-semibold">
                      Total Writers vs Active Writers
                    </div>
                    <div className="space-x-4 flex">
                      <div className="flex items-center space-x-2">
                        <div className="size-3.5 rounded-full bg-emerald-500" />
                        <span className="text-xs">Deployed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="rounded-full w-3.5 h-3.5 bg-primary"></div>
                        <span className="text-xs">Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <SegmentedControl
                      className="shrink-0"
                      segments={[
                        { key: "30", label: "30 days" },
                        { key: "365", label: "1 year" },
                      ]}
                      value={String(rangeDays)}
                      onChange={(key) => setRangeDays(key === "30" ? 30 : 365)}
                    />
                    {canSeeExport && (
                      <Button
                        className="h-10 cursor-pointer rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-white transition-all hover:opacity-95 disabled:opacity-60"
                        size="md"
                        isDisabled={!downloadUrl}
                        onClick={async () => {
                          if (!downloadUrl) return;
                          const response = await Axios({
                            url: downloadUrl,
                            method: "GET",
                            responseType: "blob",
                          });
                          const blob = new Blob([response.data as BlobPart]);
                          const href = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = href;
                          a.download = `writer-activity-${rangeDays}d.csv`;
                          a.click();
                          URL.revokeObjectURL(href);
                        }}
                      >
                        <LuUpload className="size-4" />
                        Export
                      </Button>
                    )}
                  </div>
                </div>
                <div className="w-full mt-5 h-[220px] md:h-auto md:flex-1 md:min-h-0">
                  <ActiveWritersStackedBarChart days={chartDays} />
                </div>
              </div>
            </div>
          )}

          <div
            className={`${canSeeChart ? "lg:col-span-1" : "lg:col-span-4"} flex min-w-0 flex-col gap-4`}
          >
            {canSeeTopUpStats && (
              <InfoCard
                variant="primary"
                title="YTD top-ups"
                icon={LuWallet}
                totalAmount={topUpStats?.ytd.total ?? "—"}
                lastWeekAmount={topUpStats?.last_week.total ?? "—"}
                lastMonthAmount={topUpStats?.last_month.total ?? "—"}
                last3MonthsAmount={topUpStats?.last_3_months.total ?? "—"}
              />
            )}
            {canSeeWinStats && (
              <InfoCard
                variant="orange"
                title="YTD winnings"
                icon={LuTrophy}
                totalAmount={winStats?.ytd.total ?? "—"}
                lastWeekAmount={winStats?.last_week.total ?? "—"}
                lastMonthAmount={winStats?.last_month.total ?? "—"}
                last3MonthsAmount={winStats?.last_3_months.total ?? "—"}
              />
            )}
            {canSeeBestWorst && (
              <div className="flex-none overflow-hidden rounded-2xl border border-border-subtle bg-surface">
                <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-3.5">
                  <LuMedal className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Best &amp; Worst Performance
                  </span>
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 bg-emerald-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <LuTrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-wider">
                          Best Month
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {bestWorst?.best_month?.month ?? "—"}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-emerald-600">
                      {bestWorst?.best_month?.performance ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-rose-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <LuTrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[11px] text-rose-500 font-bold uppercase tracking-wider">
                          Worst Month
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {bestWorst?.worst_month?.month ?? "—"}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-rose-500">
                      {bestWorst?.worst_month?.performance ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(canSeeTopWriters || canSeeRetentionRate) && (
        <div className="grid gap-4 lg:grid-cols-4">
          {canSeeTopWriters && (
            <div className="flex min-w-0 flex-col lg:col-span-3 space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Top 10 retailers — year to date
              </span>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
                {top10.map((w, index) => {
                  const medalColor =
                    index === 0
                      ? "text-yellow-400"
                      : index === 1
                        ? "text-zinc-400"
                        : index === 2
                          ? "text-amber-600"
                          : null;
                  return (
                    <div
                      className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface px-4 py-3"
                      key={w.writer_id}
                    >
                      {medalColor ? (
                        <LuMedal className={`w-4 h-4 shrink-0 ${medalColor}`} />
                      ) : (
                        <span className="text-xs font-semibold tabular-nums text-zinc-300 shrink-0 w-4 text-center">
                          {index + 1}
                        </span>
                      )}
                      <Avatar
                        name={w.writer_name}
                        src={w.photo_url ?? undefined}
                        size="sm"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold tabular-nums text-sm truncate text-primary">
                          {w.net_profit.formatted}
                        </span>
                        <span className="truncate text-[11px] text-muted-foreground">
                          {w.writer_name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {canSeeRetentionRate && (
            <div
              className={`${canSeeTopWriters ? "lg:col-span-1" : "lg:col-span-4"} min-w-0 overflow-hidden rounded-2xl border border-border-subtle bg-surface`}
            >
              <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-5 py-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    YTD retention rate
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    % of net earnings retained after payout
                  </p>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <LuPercent className="size-4" />
                </span>
              </div>
              <div className="flex items-center justify-center py-8">
                <span className="text-3xl font-bold tracking-tight tabular-nums truncate text-primary">
                  {retention?.retention_rate ?? "—"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type InfoCardProps = {
  title: string;
  totalAmount: string;
  lastWeekAmount: string;
  lastMonthAmount: string;
  last3MonthsAmount: string;
  variant?: "primary" | "orange";
  icon: ElementType;
};

const InfoCard = ({
  title,
  totalAmount,
  lastWeekAmount,
  lastMonthAmount,
  last3MonthsAmount,
  variant = "primary",
  icon: Icon,
}: InfoCardProps) => {
  const rows = [
    { label: "Last week", value: lastWeekAmount },
    { label: "Last month", value: lastMonthAmount },
    { label: "Last 3 months", value: last3MonthsAmount },
  ];

  return (
    <MetricCard
      title={title}
      value={totalAmount}
      icon={<Icon />}
      tone={variant === "orange" ? "warning" : "brand"}
      rows={rows}
    />
  );
};
export default WritersPerformace;

type ActiveWriterDay = {
  day: string;
  total_writers: number;
  active_writers: number;
};

function formatDayLabel(isoDay: string) {
  const d = new Date(isoDay);
  if (Number.isNaN(d.getTime())) return isoDay;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function ActiveWritersStackedBarChart({ days }: { days: ActiveWriterDay[] }) {
  const deployedColor = ChartColors.success;
  const activeColor = ChartColors.brand;
  const gridColor = ChartColors.grid;
  const axisTextColor = ChartColors.axis;

  if (!days?.length) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-xs font-normal text-zinc-400">
          Data not available
        </span>
      </div>
    );
  }

  const chartData = days.map((d) => {
    const total = Math.max(0, d.total_writers);
    const active = Math.max(0, d.active_writers);
    const activeClamped = Math.min(active, total);
    const deployedRemainder = Math.max(0, total - activeClamped);
    return {
      day: d.day,
      active: activeClamped,
      deployed: deployedRemainder,
      total,
    };
  });

  const interval =
    days.length <= 12 ? 0 : Math.max(1, Math.floor(days.length / 10));

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 45 }}
          barCategoryGap="10%"
          barGap={1}
        >
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="day"
            interval={interval}
            tick={{
              fontSize: 12,
              fill: axisTextColor,
              angle: -45,
              textAnchor: "end",
              dy: 10,
            }}
            tickFormatter={(v) => formatDayLabel(String(v))}
          />
          <YAxis
            domain={[0, "dataMax"]}
            tickLine={false}
            axisLine={false}
            orientation="right"
            tick={{ fontSize: 12, fill: axisTextColor }}
          />

          <Tooltip
            cursor={{ fill: "transparent" }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const activeVal = payload.find((p) => p.dataKey === "active")
                ?.value as number | undefined;
              const deployedVal = payload.find((p) => p.dataKey === "deployed")
                ?.value as number | undefined;
              return (
                <div className="rounded-xl border border-border-subtle bg-surface px-3 py-2 shadow-lg shadow-zinc-200/60">
                  <div className="text-xs font-semibold text-foreground">
                    {formatDayLabel(String(label))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: deployedColor }}
                      />
                      Deployed: {deployedVal ?? 0}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ background: activeColor }}
                      />
                      Active: {activeVal ?? 0}
                    </span>
                  </div>
                </div>
              );
            }}
          />

          <Bar
            dataKey="deployed"
            name="Deployed"
            stackId="writers"
            fill={deployedColor}
          />
          <Bar
            dataKey="active"
            name="Active"
            stackId="writers"
            fill={activeColor}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
