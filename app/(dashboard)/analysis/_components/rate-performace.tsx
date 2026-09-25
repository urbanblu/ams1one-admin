"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FinancialsService from "@/api/financials";
import { usePageAccess } from "@/hooks/use-page-access";
import { formatGhs } from "@/utils/currency";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  LuShoppingBag,
  LuWallet,
  LuUsers,
  LuTrophy,
  LuArrowDownUp,
  LuHandCoins,
} from "react-icons/lu";
import type { ElementType } from "react";
import ChartColors from "@/utils/chart-colors";
import { SegmentedControl } from "@/components/ui";

type ChartEntry = {
  label: string;
  fullLabel: string;
  value: number;
};

const getBarColor = (value: number) => {
  if (value < 0) return ChartColors.danger;
  if (value >= 50) return ChartColors.success;
  return ChartColors.info;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderCustomLabel = (props: any) => {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    value = 0,
  } = props as {
    x: number;
    y: number;
    width: number;
    height: number;
    value: number;
  };
  if (value === 0) return <g />;
  const isPositive = value > 0;
  const labelY = isPositive ? y - 5 : y + height + 12;
  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      fontSize={9}
      fill={ChartColors.label}
      fontWeight="bold"
    >
      {value}%
    </text>
  );
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartEntry }>;
}) => {
  if (!active || !payload?.length) return null;
  const { fullLabel, value } = payload[0].payload;
  return (
    <div className="rounded-xl border border-border-subtle bg-surface px-3 py-2 text-xs shadow-lg shadow-zinc-200/60">
      <p className="font-bold text-foreground">{fullLabel}</p>
      <p className="text-emerald-500 font-medium mt-1">
        Retention rate: {value}%
      </p>
    </div>
  );
};

function RetentionRatePerformance() {
  const { hasPage } = usePageAccess();
  const canSeeSalesCard = hasPage("analysis.sales_card");
  const canSeeNetTopups = hasPage("analysis.net_topups_card");
  const canSeeWritersAtWork = hasPage("analysis.writers_at_work_card");
  const canSeeWinsCard = hasPage("analysis.wins_card");
  const canSeeLiquidation = hasPage("analysis.liquidation_card");
  const canSeeSettlements = hasPage("analysis.settlements_card");
  const canSeeTrend = hasPage("analysis.retention_trend");

  const [period, setPeriod] = useState<"30days" | "1year">("30days");

  const { data: salesCard } = useQuery({
    queryKey: ["financials", "sales-card"],
    queryFn: FinancialsService.fetchSalesCard,
  });
  const { data: netTopupsCard } = useQuery({
    queryKey: ["financials", "net-topups-card"],
    queryFn: FinancialsService.fetchNetTopupsCard,
  });
  const { data: writersAtWorkCard } = useQuery({
    queryKey: ["financials", "writers-at-work-card"],
    queryFn: FinancialsService.fetchWritersAtWorkCard,
  });
  const { data: winsCard } = useQuery({
    queryKey: ["financials", "wins-card"],
    queryFn: FinancialsService.fetchWinsCard,
  });
  const { data: liquidationCard } = useQuery({
    queryKey: ["financials", "liquidation-card"],
    queryFn: FinancialsService.fetchLiquidationCard,
  });
  const { data: settlementsCard } = useQuery({
    queryKey: ["financials", "settlements-card"],
    queryFn: FinancialsService.fetchSettlementsCard,
  });

  const days = period === "1year" ? 365 : 30;
  const { data: trendData } = useQuery({
    queryKey: ["financials", "retention-rate-trend", days],
    queryFn: () => FinancialsService.fetchRetentionRateTrend(days),
  });

  const chartData: ChartEntry[] = useMemo(() => {
    if (!trendData) return [];
    if (period === "30days") {
      return (trendData.days ?? []).map((d) => {
        const date = new Date(d.day);
        const shortLabel = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        return {
          label: shortLabel,
          fullLabel: `${d.day} (${dayName})`,
          value: d.retention_rate,
        };
      });
    }
    return (trendData.months ?? []).map((m) => ({
      label: m.month,
      fullLabel: m.month,
      value: m.retention_rate,
    }));
  }, [trendData, period]);

  const ytdRR =
    trendData != null ? `${trendData.ytd_retention_rate.toFixed(2)}%` : "—";

  const visibleCards = [
    canSeeSalesCard,
    canSeeNetTopups,
    canSeeWritersAtWork,
    canSeeWinsCard,
    canSeeLiquidation,
    canSeeSettlements,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col space-y-5">
      {/* 3×2 grid — dashed dividers only between cells */}
      {visibleCards > 0 && (
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-3">
          {canSeeSalesCard && (
            <PrimaryCard
              label="Sales"
              value={salesCard?.total_sales ?? "N/A"}
              subLabel="Net Sales"
              subValue={
                salesCard != null
                  ? formatGhs(salesCard.total_sales_amount)
                  : "N/A"
              }
              icon={LuShoppingBag}
              iconBg="bg-primary-soft"
              iconColor="text-primary"
            />
          )}
          {canSeeNetTopups && (
            <PrimaryCard
              label="Net Top-Ups"
              value={netTopupsCard?.net_topups ?? "N/A"}
              subLabel="Gross Top-Ups"
              subValue={netTopupsCard?.gross_topups ?? "N/A"}
              icon={LuWallet}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
          )}
          {canSeeWritersAtWork && (
            <PrimaryCard
              label="Writers@Work"
              value={
                writersAtWorkCard != null
                  ? `${writersAtWorkCard.active_writers.toLocaleString("en-US")}`
                  : "N/A"
              }
              subLabel="Total Writers"
              subValue={
                writersAtWorkCard != null
                  ? `${writersAtWorkCard.total_writers.toLocaleString("en-US")}`
                  : "N/A"
              }
              icon={LuUsers}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-500"
            />
          )}
          {canSeeWinsCard && (
            <PrimaryCard
              label="Wins"
              value={winsCard?.total_wins ?? "N/A"}
              subLabel="Winning Stakes"
              subValue={
                winsCard != null
                  ? `${winsCard.winning_stakes.toLocaleString("en-US")}`
                  : "N/A"
              }
              icon={LuTrophy}
              iconBg="bg-amber-50"
              iconColor="text-orange-500"
            />
          )}
          {canSeeLiquidation && (
            <PrimaryCard
              label="Liquidation"
              value={liquidationCard?.total_liquidation ?? "N/A"}
              subLabel="Unclaimed Tickets"
              subValue={liquidationCard?.unclaimed_coupons ?? "N/A"}
              icon={LuArrowDownUp}
              iconBg="bg-rose-50"
              iconColor="text-rose-500"
            />
          )}
          {canSeeSettlements && (
            <PrimaryCard
              label="Settlements"
              value={settlementsCard?.total_settlements ?? "N/A"}
              subLabel="Claim Wallet Bal."
              subValue={settlementsCard?.claim_wallet_balance ?? "N/A"}
              icon={LuHandCoins}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
          )}
        </div>
      )}

      {/* Retention rate trend chart */}
      {canSeeTrend && (
        <div className="flex min-h-[400px] flex-col rounded-2xl border border-border-subtle bg-surface px-5 py-4">
          <div className="flex flex-col flex-1 h-full">
            <div className="sm:flex sm:justify-between space-y-5 sm:space-y-0 shrink-0 mb-4">
              <div className="flex-col space-y-1">
                <div className="text-sm font-semibold tracking-tight">
                  Retention Rate Trend
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">
                    YTD RR:
                  </span>
                  <span className="text-xs font-semibold tabular-nums bg-primary-soft text-primary px-2 py-0.5 rounded-full">
                    {ytdRR}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <SegmentedControl
                  segments={[
                    { key: "30days", label: "30 days" },
                    { key: "1year", label: "1 year" },
                  ]}
                  value={period}
                  onChange={(key) => setPeriod(key)}
                />
              </div>
            </div>

            <div className="h-[300px]">
              {chartData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-xs text-zinc-400">
                    No data available
                  </span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke={ChartColors.grid}
                    />
                    <XAxis dataKey="label" hide />
                    <YAxis
                      domain={[-100, 100]}
                      ticks={[-100, -50, 0, 50, 100]}
                      orientation="right"
                      tick={{ fontSize: 9, fill: ChartColors.axis }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <ReferenceLine
                      y={0}
                      stroke={ChartColors.reference}
                      strokeWidth={1}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    />
                    <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getBarColor(entry.value)}
                        />
                      ))}
                      <LabelList dataKey="value" content={renderCustomLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RetentionRatePerformance;

const PrimaryCard = ({
  label,
  value,
  subLabel,
  subValue,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string;
  value: string;
  subLabel: string;
  subValue: string;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
}) => {
  return (
    <div className="flex min-w-0 flex-col bg-surface px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
        >
          <Icon className={`size-4 ${iconColor}`} />
        </span>
      </div>
      <p className="mt-1.5 truncate text-xl font-bold tracking-tight tabular-nums text-foreground">
        {value}
      </p>
      <p className="mt-1 truncate text-[11px] text-muted-foreground">
        <span className={`font-semibold tabular-nums ${iconColor}`}>
          {subValue}
        </span>{" "}
        {subLabel}
      </p>
    </div>
  );
};
