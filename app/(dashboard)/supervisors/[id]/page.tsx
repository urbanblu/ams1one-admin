"use client";
import {
  Avatar,
  Card,
  CardBody,
  CardHeader,
  IconButton,
  MetricCard,
  PageShell,
  SegmentedControl,
} from "@/components/ui";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { usePageAccess } from "@/hooks/use-page-access";
import { PieChart, Pie } from "recharts";
import LmcDetailTable from "../_components/supervisor-detail-table";
import ToastService from "@/utils/toast-service";
import {
  LuArrowLeft,
  LuBuilding2,
  LuMapPin,
  LuShoppingBag,
  LuTrendingUp,
  LuTrophy,
  LuUsers,
  LuTablet,
  LuActivity,
  LuPhone,
} from "react-icons/lu";
import { LuTrash2 } from "react-icons/lu";
import EditLmcUserDrawer from "../_components/edit-supervisor-user-drawer";
import { useQuery } from "@tanstack/react-query";
import LmcService from "@/api/lmc";
import { ILmcSummary } from "@/interfaces/lmc.interface";
import type { ElementType } from "react";

const formatUSD = (n: number) =>
  `USD ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function LmcDetailView() {
  const { hasPage } = usePageAccess();
  const canSeeSummary = hasPage("supervisors.summary");
  const canSeeTransactions = hasPage("supervisors.transactions");
  const canSeeWritersOverview = hasPage("supervisors.writers_overview");


  const router = useRouter();
  const params = useParams();
  const lmcId = String(params.id ?? "");
  const detailTabs = [
    canSeeTransactions && { key: "transactions" as const, label: "Transactions" },
    canSeeWritersOverview && { key: "writers" as const, label: "Writers" },
    canSeeWritersOverview && { key: "agents" as const, label: "Agents" },
  ].filter(Boolean) as { key: "transactions" | "writers" | "agents"; label: string }[];

  const [activeTab, setActiveTab] = useState<
    "transactions" | "writers" | "agents"
  >(detailTabs[0]?.key ?? "transactions");

  const { data: summary } = useQuery<ILmcSummary>({
    queryKey: ["lmc", lmcId, "summary"],
    queryFn: () => LmcService.fetchSummary(lmcId),
    enabled: !!lmcId,
  });

  const s = summary?.summary;
  const info = summary?.supervisor_info;

  return (
    <PageShell className="overflow-x-hidden">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <IconButton label="Go back" onClick={() => router.back()}>
            <LuArrowLeft />
          </IconButton>
          <Avatar name={info?.name ?? "—"} size="lg" gradient />
          <div className="min-w-0">
            <h1 className="min-w-0 truncate text-xl font-bold tracking-tight text-foreground">
              {info?.name ?? "—"}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-400">Supervisor</p>
          </div>
        </div>
        <div className="shrink-0">
          <EditLmcUserDrawer lmcId={lmcId} info={summary?.supervisor_info} />
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        {canSeeSummary && (
          <div className="col-span-5 space-y-4 lg:col-span-1">
            <PrimaryAddressCard
              name={info?.name}
              address={info?.address}
              phone={info?.phone}
            />
            <PosCard
              posIssued={info?.pos_issued ?? 0}
              posTrading={info?.pos_trading ?? 0}
              writersTotal={info?.writers_total ?? 0}
            />
          </div>
        )}
        <div className="col-span-5 min-w-0 space-y-4 lg:col-span-4">
          {canSeeSummary && (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <MetricCard
                icon={<LuShoppingBag />}
                title="YTD sales"
                value={s ? formatUSD(parseFloat(s.ytd_sales)) : "—"}
                tone="brand"
                footer={<ContributionRatio value={s?.ytd_sales_ratio ?? 0} tone="brand" />}
              />
              <MetricCard
                icon={<LuTrendingUp />}
                title="YTD top-ups"
                value={s ? formatUSD(parseFloat(s.ytd_topups)) : "—"}
                tone="warning"
                footer={<ContributionRatio value={s?.ytd_topups_ratio ?? 0} tone="warning" />}
              />
              <MetricCard
                icon={<LuTrophy />}
                title="YTD winnings"
                value={s ? formatUSD(parseFloat(s.ytd_winnings)) : "—"}
                tone="success"
                footer={<ContributionRatio value={s?.ytd_winnings_ratio ?? 0} tone="success" />}
              />
              <MetricCard
                icon={<LuUsers />}
                title="Writers"
                value={s ? String(s.writers_count) : "—"}
                tone="info"
                footer={<ContributionRatio value={s?.writers_ratio ?? 0} tone="info" />}
              />
            </div>
          )}

          <div className="min-w-0">
            <SegmentedControl
              className="mb-4"
              segments={detailTabs}
              value={activeTab}
              onChange={setActiveTab}
            />

            {activeTab === "transactions" && canSeeTransactions && (
              <LmcDetailTable
                type="Transactions"
                tabs={["View All", "Commissions", "Top-ups", "Transfers"]}
                lmcId={lmcId}
              />
            )}
            {activeTab === "writers" && canSeeWritersOverview && (
              <LmcDetailTable
                type="Writers"
                tabs={[
                  "View All",
                  "Active",
                  "Passive",
                  "Inactive",
                  "Recover",
                  "No Use",
                ]}
                lmcId={lmcId}
              />
            )}
            {activeTab === "agents" && canSeeWritersOverview && (
              <LmcDetailTable
                type="Agents"
                tabs={["View All", "Active", "Inactive"]}
                lmcId={lmcId}
              />
            )}
          </div>
        </div>

      </div>
    </PageShell>
  );
}

export default LmcDetailView;

/** The bottom rule of the four summary cards. */
const ContributionRatio = ({
  value,
  tone,
}: {
  value: number;
  tone: keyof typeof TONES;
}) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-[11px] text-muted-foreground">Contribution ratio</span>
    <DonutChart value={value} color={TONES[tone].chart} />
  </div>
);

const TONES = {
  brand: { chip: "bg-primary-soft text-primary", chart: "#9387eb" },
  warning: { chip: "bg-amber-50 text-amber-500", chart: "#f59e0b" },
  success: { chip: "bg-emerald-50 text-emerald-500", chart: "#10b981" },
  info: { chip: "bg-blue-50 text-blue-500", chart: "#3b82f6" },
};


const PrimaryAddressCard = ({
  name,
  address,
  phone,
}: {
  name?: string;
  address?: string;
  phone?: string;
}) => (
  <Card>
    <CardHeader icon={<LuMapPin />} title="Primary address" />
    <CardBody className="flex flex-col gap-3">
      <SideRow
        icon={LuBuilding2}
        iconBg="bg-primary-soft"
        iconColor="text-primary"
        value={name ?? "—"}
      />
      <SideRow
        icon={LuMapPin}
        iconBg="bg-amber-50"
        iconColor="text-amber-500"
        value={address || "N/A"}
      />

      <div className="mt-1 border-t border-border-subtle pt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Phone numbers
        </p>
        <div className="mt-2.5 flex flex-col gap-2.5">
          {phone ? (
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                <LuPhone className="size-3.5 text-emerald-500" />
              </span>
              <span className="flex-1 truncate text-xs tabular-nums text-foreground">
                {phone}
              </span>
              <button
                type="button"
                aria-label="Remove phone number"
                className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
                onClick={() =>
                  ToastService.info({ text: "Feature not yet available" })
                }
              >
                <LuTrash2 className="size-3.5" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-zinc-400">—</span>
          )}
          <button
            type="button"
            className="cursor-pointer text-left text-xs font-semibold text-primary transition-colors hover:text-primary-strong"
            onClick={() =>
              ToastService.info({ text: "Feature not yet available" })
            }
          >
            + Add new
          </button>
        </div>
      </div>
    </CardBody>
  </Card>
);

const PosCard = ({
  posIssued,
  posTrading,
  writersTotal,
}: {
  posIssued: number;
  posTrading: number;
  writersTotal: number;
}) => (
  <Card>
    <CardHeader icon={<LuTablet />} title="POS devices" />
    <CardBody className="flex flex-col gap-3">
      <SideRow
        icon={LuTablet}
        iconBg="bg-primary-soft"
        iconColor="text-primary"
        value="Issued"
        trailing={String(posIssued)}
      />
      <SideRow
        icon={LuActivity}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-500"
        value="Trading"
        trailing={String(posTrading)}
      />
      <SideRow
        icon={LuUsers}
        iconBg="bg-blue-50"
        iconColor="text-blue-500"
        value="Writers"
        trailing={String(writersTotal)}
      />
    </CardBody>
  </Card>
);

const SideRow = ({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  trailing,
}: {
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  value: string;
  trailing?: string;
}) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <Icon className={`size-3.5 ${iconColor}`} />
      </span>
      <span className="truncate text-xs text-muted-foreground">{value}</span>
    </div>
    {trailing && (
      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
        {trailing}
      </span>
    )}
  </div>
);

const DonutChart = ({
  value,
  size = 44,
  color = "#a78bfa",
}: {
  value: number;
  size?: number;
  color?: string;
}) => {
  const progress = Math.min(Math.max(value, 0), 100);
  const data = [
    { value: progress, fill: color },
    { value: 100 - progress, fill: "#f1f1f3" },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <PieChart
        width={size}
        height={size}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <Pie
          data={data}
          cx={size / 2}
          cy={size / 2}
          innerRadius={size * 0.32}
          outerRadius={size * 0.48}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        />
      </PieChart>
      <span
        className="absolute text-[10px] font-bold tabular-nums text-foreground"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      >
        {progress}%
      </span>
    </div>
  );
};
