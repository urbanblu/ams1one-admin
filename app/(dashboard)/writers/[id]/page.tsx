"use client";

import { Tabs } from "@heroui/react";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  IconButton,
  PageShell,
  StatTile,
  StatusBadge,
} from "@/components/ui";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import WritersService from "@/api/writers";
import { formatGhs } from "@/utils/currency";
import EditRetailerUserDrawer from "../_components/edit-retailer-user-drawer";
import TopUpTable from "./_components/topup-table";
import SalesTable from "./_components/sales-table";
import WinningsTable from "./_components/winnings-table";
import CashoutTable from "./_components/cashout-table";
import { usePageAccess } from "@/hooks/use-page-access";
import {
  LuArrowLeft,
  LuBuilding2,
  LuCalendar,
  LuClock,
  LuHash,
  LuMapPin,
  LuMail,
  LuPhone,
  LuIdCard,
  LuShieldCheck,
  LuShieldOff,
  LuTrophy,
  LuSmartphone,
  LuTrendingUp,
  LuWallet,
} from "react-icons/lu";
import Image from "next/image";
import ToastService from "@/utils/toast-service";
import ApiError from "@/utils/api_error";
import type { ElementType } from "react";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Left sidebar row with icon ───────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  iconBg,
  iconColor,
  value,
}: {
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
      >
        <Icon className={`size-3.5 ${iconColor}`} />
      </span>
      <span className="truncate text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function RetailerDetailView() {
  const { hasPage } = usePageAccess();
  const canSeeTopUps = hasPage("writers.topups");
  const canSeeSales = hasPage("writers.sales");
  const canSeeWinnings = hasPage("writers.winnings");
  const canSeeCashouts = hasPage("writers.cashouts");

  const params = useParams();
  const router = useRouter();
  const writerId = typeof params?.id === "string" ? params.id : "";

  const qc = useQueryClient();

  const { data: profile, isPending } = useQuery({
    queryKey: ["writers", "profile", writerId],
    queryFn: () => WritersService.fetchWriterProfile(writerId),
    enabled: !!writerId,
  });

  const isBlocked =
    profile?.status === "inactive" || profile?.status === "no_use";

  const { mutate: block, isPending: blocking } = useMutation({
    mutationFn: () => WritersService.blockWriter(writerId),
    onSuccess: () => {
      ToastService.success({ text: "Writer blocked successfully." });
      void qc.invalidateQueries({ queryKey: ["writers", "profile", writerId] });
      void qc.invalidateQueries({ queryKey: ["writers", "all"] });
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Failed to block writer." });
    },
  });

  const { mutate: unblock, isPending: unblocking } = useMutation({
    mutationFn: () => WritersService.unblockWriter(writerId),
    onSuccess: () => {
      ToastService.success({ text: "Writer unblocked successfully." });
      void qc.invalidateQueries({ queryKey: ["writers", "profile", writerId] });
      void qc.invalidateQueries({ queryKey: ["writers", "all"] });
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Failed to unblock writer." });
    },
  });

  if (!writerId) {
    return (
      <div className="px-5 py-6 text-sm text-muted-foreground lg:px-8">
        Invalid writer id.
      </div>
    );
  }

  if (isPending || !profile) {
    return (
      <div className="px-5 py-6 text-sm text-muted-foreground lg:px-8">
        Loading writer…
      </div>
    );
  }

  return (
    <PageShell className="overflow-x-hidden">
      {/* Header */}
      <div className="flex min-w-0 items-center gap-3">
        <IconButton label="Go back" onClick={() => router.back()}>
          <LuArrowLeft />
        </IconButton>

        {profile.photo_url ? (
          <a
            href={profile.photo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full ring-2 ring-transparent transition-all hover:ring-primary"
          >
            <Avatar name={profile.name} src={profile.photo_url} size="lg" />
          </a>
        ) : (
          <Avatar name={profile.name} size="lg" gradient />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 truncate text-xl font-bold tracking-tight text-foreground">
              {profile.name}
            </h1>
            <EditRetailerUserDrawer writerId={writerId} />
          </div>
          <p className="mt-0.5 text-xs tabular-nums text-zinc-400">
            ID {String(profile.writer_id)}
          </p>
        </div>

        {/* Block / Unblock */}
        {isBlocked ? (
          <Button
            variant="secondary"
            size="sm"
            className="shrink-0 bg-emerald-50 text-emerald-500 hover:bg-emerald-100"
            isPending={unblocking}
            onClick={() => unblock()}
          >
            {!unblocking && <LuShieldCheck />}
            {unblocking ? "Unblocking…" : "Unblock account"}
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            className="shrink-0"
            isPending={blocking}
            onClick={() => block()}
          >
            {!blocking && <LuShieldOff />}
            {blocking ? "Blocking…" : "Block account"}
          </Button>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        {/* ── Left sidebar ── */}
        <div className="col-span-5 space-y-4 lg:col-span-1">
          {/* Contact */}
          <Card>
            <CardHeader icon={<LuPhone />} title="Contact" />
            <CardBody className="flex flex-col gap-3">
              <InfoRow
                icon={LuBuilding2}
                iconBg="bg-indigo-50"
                iconColor="text-indigo-500"
                value={profile.supervisor_name ?? "—"}
              />
              <InfoRow
                icon={LuPhone}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-500"
                value={profile.phone}
              />
              <InfoRow
                icon={LuMail}
                iconBg="bg-blue-50"
                iconColor="text-blue-500"
                value={profile.email || "—"}
              />
              <InfoRow
                icon={LuMapPin}
                iconBg="bg-rose-50"
                iconColor="text-rose-500"
                value={profile.location_address || "—"}
              />
              <InfoRow
                icon={LuCalendar}
                iconBg="bg-subtle"
                iconColor="text-muted-foreground"
                value={`DOB: ${profile.date_of_birth || "—"}`}
              />
              <InfoRow
                icon={LuHash}
                iconBg="bg-subtle"
                iconColor="text-zinc-400"
                value={`Joined ${formatDate(profile.created_at)}`}
              />
            </CardBody>
          </Card>

          {/* Status & performance */}
          <Card>
            <CardHeader
              icon={<LuTrendingUp />}
              title="Status"
              action={<StatusBadge status={profile.status} />}
            />
            <CardBody className="flex flex-col gap-3">
              <MetaRow
                icon={LuClock}
                label="Days on task"
                value={String(profile.days_on_task)}
              />
              <MetaRow
                icon={LuTrendingUp}
                label="LT avg. sale"
                value={formatGhs(parseFloat(profile.lifetime_avg_sale) || 0)}
              />
            </CardBody>
          </Card>

          {/* Wallets */}
          <Card>
            <CardHeader icon={<LuWallet />} title="Wallets" />
            <CardBody className="flex flex-col gap-3">
              <MetaRow
                icon={LuSmartphone}
                iconBg="bg-amber-50"
                iconColor="text-amber-500"
                label="Airtime"
                value={`USD ${profile.airtime_balance}`}
              />
              <MetaRow
                icon={LuWallet}
                iconBg="bg-primary-soft"
                iconColor="text-primary"
                label="Claims"
                value={`USD ${profile.claims_balance}`}
              />
            </CardBody>
          </Card>

          {/* ID Card */}
          <Card>
            <CardHeader icon={<LuIdCard />} title="ID card" />
            <div className="p-3">
              {profile.id_card_image_url ? (
                <a
                  href={profile.id_card_image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div
                    className="relative w-full overflow-hidden rounded-xl"
                    style={{ aspectRatio: "16/10" }}
                  >
                    <Image
                      src={profile.id_card_image_url}
                      alt="ID card"
                      fill
                      className="object-cover transition-transform duration-200 hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 text-center text-[11px] text-zinc-400">
                    Click to view full size
                  </p>
                </a>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <span className="text-xs text-muted-foreground">
                    No ID card uploaded
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="col-span-5 flex min-w-0 flex-col gap-4 lg:col-span-4">
          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <StatTile
              label="YTD sales"
              value={formatGhs(parseFloat(String(profile.ytd_sales)) || 0)}
              hint={`This month ${formatGhs(parseFloat(String(profile.month_sales)) || 0)}`}
              icon={<LuTrendingUp />}
              iconClassName="bg-primary-soft text-primary"
            />
            <StatTile
              label="YTD top-ups"
              value={formatGhs(parseFloat(String(profile.ytd_topups)) || 0)}
              hint={`This month ${formatGhs(parseFloat(String(profile.month_topups)) || 0)}`}
              icon={<LuWallet />}
              iconClassName="bg-emerald-50 text-emerald-500"
            />
            <StatTile
              label="YTD winnings"
              value={formatGhs(parseFloat(String(profile.ytd_winnings)) || 0)}
              icon={<LuTrophy />}
              iconClassName="bg-amber-50 text-amber-500"
            />
            <StatTile
              label="Tier"
              value={profile.tier}
              hint={`Avg top-up ${formatGhs(parseFloat(String(profile.avg_topup)) || 0)}`}
              icon={<LuHash />}
              iconClassName="bg-blue-50 text-blue-500"
            />
          </div>

          {/* Tabs */}
          <div className="min-w-0 overflow-x-auto">
            <Tabs className="w-full min-w-0" variant="secondary">
              <Tabs.ListContainer className="shrink-0 w-full max-w-full overflow-x-auto overflow-y-hidden md:overflow-visible">
                <Tabs.List
                  aria-label="Writer tabs"
                  className="inline-flex! w-max! whitespace-nowrap"
                >
                  {canSeeTopUps && (
                    <Tabs.Tab
                      id="topups"
                      className="h-10 w-auto! flex-none! whitespace-nowrap px-4 text-sm font-medium"
                    >
                      Top-ups
                      <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
                    </Tabs.Tab>
                  )}
                  {canSeeSales && (
                    <Tabs.Tab
                      id="sales"
                      className="h-10 w-auto! flex-none! whitespace-nowrap px-4 text-sm font-medium"
                    >
                      Sales
                      <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
                    </Tabs.Tab>
                  )}
                  {canSeeWinnings && (
                    <Tabs.Tab
                      id="winnings"
                      className="h-10 w-auto! flex-none! whitespace-nowrap px-4 text-sm font-medium"
                    >
                      Winnings
                      <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
                    </Tabs.Tab>
                  )}
                  {canSeeCashouts && (
                    <Tabs.Tab
                      id="cashout"
                      className="h-10 w-auto! flex-none! whitespace-nowrap px-4 text-sm font-medium"
                    >
                      Cashout
                      <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
                    </Tabs.Tab>
                  )}
                </Tabs.List>
              </Tabs.ListContainer>

              {canSeeTopUps && (
                <Tabs.Panel
                  id="topups"
                  className="md:flex-1 md:min-h-0 min-w-0 w-full"
                >
                  <TopUpTable writerId={writerId} />
                </Tabs.Panel>
              )}
              {canSeeSales && (
                <Tabs.Panel
                  id="sales"
                  className="md:flex-1 md:min-h-0 min-w-0 w-full"
                >
                  <SalesTable writerId={writerId} />
                </Tabs.Panel>
              )}
              {canSeeWinnings && (
                <Tabs.Panel
                  id="winnings"
                  className="md:flex-1 md:min-h-0 min-w-0 w-full"
                >
                  <WinningsTable writerId={writerId} />
                </Tabs.Panel>
              )}
              {canSeeCashouts && (
                <Tabs.Panel
                  id="cashout"
                  className="md:flex-1 md:min-h-0 min-w-0 w-full"
                >
                  <CashoutTable writerId={writerId} />
                </Tabs.Panel>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default RetailerDetailView;

function MetaRow({
  icon: Icon,
  label,
  value,
  iconBg = "bg-subtle",
  iconColor = "text-zinc-400",
}: {
  icon: ElementType;
  label: string;
  value: string;
  iconBg?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
        >
          <Icon className={`size-3.5 ${iconColor}`} />
        </span>
        <span className="truncate text-xs text-muted-foreground">{label}</span>
      </div>
      <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
