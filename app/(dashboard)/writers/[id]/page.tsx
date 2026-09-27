"use client";

import {
  AppBarActions,
  AppBarIdentity,
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  DetailRow,
  EmptyState,
  PageShell,
  SegmentedControl,
  Skeleton,
  StatTile,
  StatusBadge,
} from "@/components/ui";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import WritersService from "@/api/writers";
import { formatUsd } from "@/utils/currency";
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
import { useState } from "react";

type WriterTabKey = "topups" | "sales" | "winnings" | "cashout";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function RetailerDetailView() {
  const { hasPage } = usePageAccess();
  const canSeeTopUps = hasPage("writers.topups");
  const canSeeSales = hasPage("writers.sales");
  const canSeeWinnings = hasPage("writers.winnings");
  const canSeeCashouts = hasPage("writers.cashouts");

  const detailTabs = [
    canSeeTopUps && { key: "topups" as const, label: "Top-ups" },
    canSeeSales && { key: "sales" as const, label: "Sales" },
    canSeeWinnings && { key: "winnings" as const, label: "Winnings" },
    canSeeCashouts && { key: "cashout" as const, label: "Cashout" },
  ].filter(Boolean) as { key: WriterTabKey; label: string }[];

  const [activeTab, setActiveTab] = useState<WriterTabKey>("topups");
  // Permissions resolve after mount, so the stored tab can briefly name one
  // the user cannot see — fall back to the first tab that is actually on.
  const currentTab = detailTabs.some((t) => t.key === activeTab)
    ? activeTab
    : (detailTabs[0]?.key ?? activeTab);

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
      <PageShell>
        <Card>
          <EmptyState
            title="Writer not found"
            description="This link is missing a writer id. Go back and pick a writer from the list."
            action={
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <LuArrowLeft />
                Go back
              </Button>
            }
          />
        </Card>
      </PageShell>
    );
  }

  if (isPending || !profile) {
    return (
      <PageShell className="overflow-x-hidden">
        <AppBarIdentity name="" onBack={() => router.back()} isLoading />

        <div className="grid items-start gap-4 lg:grid-cols-5">
          <div className="col-span-5 space-y-4 lg:col-span-1">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <CardHeader title={<Skeleton className="h-3 w-20" />} />
                <CardBody className="flex flex-col gap-3">
                  {[0, 1, 2].map((j) => (
                    <Skeleton key={j} className="h-3 w-full" />
                  ))}
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="col-span-5 min-w-0 space-y-4 lg:col-span-4">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[88px] rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-9 w-72 rounded-md" />
            <Skeleton className="h-72 w-full rounded-lg" />
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="overflow-x-hidden">
      <AppBarIdentity
        name={profile.name}
        meta={`ID ${String(profile.writer_id)}`}
        onBack={() => router.back()}
        adornment={<EditRetailerUserDrawer writerId={writerId} />}
        avatar={
          profile.photo_url ? (
            <a
              href={profile.photo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 rounded-md ring-2 ring-transparent transition-all hover:ring-brand-500"
            >
              <Avatar name={profile.name} src={profile.photo_url} size="sm" />
            </a>
          ) : undefined
        }
      />

      <AppBarActions>
        {isBlocked ? (
          <Button
            variant="success"
            size="sm"
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
            isPending={blocking}
            onClick={() => block()}
          >
            {!blocking && <LuShieldOff />}
            {blocking ? "Blocking…" : "Block account"}
          </Button>
        )}
      </AppBarActions>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        {/* ── Left sidebar ── */}
        <div className="col-span-5 space-y-4 lg:col-span-1">
          {/* Contact */}
          <Card>
            <CardHeader icon={<LuPhone />} title="Contact" />
            <CardBody className="flex flex-col gap-3">
              <DetailRow
                icon={<LuBuilding2 />}
                label={profile.supervisor_name ?? "—"}
              />
              <DetailRow icon={<LuPhone />} label={profile.phone} />
              <DetailRow icon={<LuMail />} label={profile.email || "—"} />
              <DetailRow
                icon={<LuMapPin />}
                label={profile.location_address || "—"}
              />
              <DetailRow
                icon={<LuCalendar />}
                label={`DOB: ${profile.date_of_birth || "—"}`}
              />
              <DetailRow
                icon={<LuHash />}
                label={`Joined ${formatDate(profile.created_at)}`}
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
              <DetailRow
                icon={<LuClock />}
                label="Days on task"
                value={String(profile.days_on_task)}
              />
              <DetailRow
                icon={<LuTrendingUp />}
                label="LT avg. sale"
                value={formatUsd(parseFloat(profile.lifetime_avg_sale) || 0)}
              />
            </CardBody>
          </Card>

          {/* Wallets */}
          <Card>
            <CardHeader icon={<LuWallet />} title="Wallets" />
            <CardBody className="flex flex-col gap-3">
              <DetailRow
                icon={<LuSmartphone />}
                label="Airtime"
                value={formatUsd(parseFloat(profile.airtime_balance) || 0)}
              />
              <DetailRow
                icon={<LuWallet />}
                label="Claims"
                value={formatUsd(parseFloat(profile.claims_balance) || 0)}
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
                    className="relative w-full overflow-hidden rounded-md"
                    style={{ aspectRatio: "16/10" }}
                  >
                    <Image
                      src={profile.id_card_image_url}
                      alt="ID card"
                      fill
                      className="object-cover transition-transform duration-200 hover:scale-105"
                    />
                  </div>
                  <p className="mt-2 text-center text-xs text-foreground-muted">
                    Click to view full size
                  </p>
                </a>
              ) : (
                <EmptyState
                  className="px-2 py-8"
                  icon={<LuIdCard />}
                  title="No ID card"
                  description="Nothing has been uploaded for this writer yet."
                />
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
              value={formatUsd(parseFloat(String(profile.ytd_sales)) || 0)}
              hint={`This month ${formatUsd(parseFloat(String(profile.month_sales)) || 0)}`}
              icon={<LuTrendingUp />}
            />
            <StatTile
              label="YTD top-ups"
              value={formatUsd(parseFloat(String(profile.ytd_topups)) || 0)}
              hint={`This month ${formatUsd(parseFloat(String(profile.month_topups)) || 0)}`}
              icon={<LuWallet />}
            />
            <StatTile
              label="YTD winnings"
              value={formatUsd(parseFloat(String(profile.ytd_winnings)) || 0)}
              icon={<LuTrophy />}
            />
            <StatTile
              label="Tier"
              value={profile.tier}
              hint={`Avg top-up ${formatUsd(parseFloat(String(profile.avg_topup)) || 0)}`}
              icon={<LuHash />}
            />
          </div>

          {/* Tabs */}
          <div className="min-w-0">
            <SegmentedControl
              className="mb-4"
              segments={detailTabs}
              value={currentTab}
              onChange={setActiveTab}
            />

            {currentTab === "topups" && canSeeTopUps && (
              <TopUpTable writerId={writerId} />
            )}
            {currentTab === "sales" && canSeeSales && (
              <SalesTable writerId={writerId} />
            )}
            {currentTab === "winnings" && canSeeWinnings && (
              <WinningsTable writerId={writerId} />
            )}
            {currentTab === "cashout" && canSeeCashouts && (
              <CashoutTable writerId={writerId} />
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default RetailerDetailView;
