"use client";

import { Tabs } from "@heroui/react";
import {
  AppBarIdentity,
  Card,
  CardBody,
  CardHeader,
  DetailRow,
  PageShell,
  StatTile,
} from "@/components/ui";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LuWallet,
  LuArrowDownLeft,
  LuArrowUpRight,
  LuTrophy,
  LuTicket,
  LuPhone,
  LuMail,
  LuCalendar,
} from "react-icons/lu";
import PlayersService, { type PlayerGame } from "@/api/players";
import { formatUsd } from "@/utils/currency";
import TicketsTable from "./_components/tickets-table";
import WinsTable from "./_components/wins-table";
import TransactionsTable from "./_components/transactions-table";
import type { ElementType } from "react";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function PlayerDetailView() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const playerId = String(params?.id ?? "");
  const game = (searchParams.get("game") ?? "five-ninety") as PlayerGame;

  const { data, isPending } = useQuery({
    queryKey: ["players", game, playerId, "detail"],
    queryFn: () => PlayersService.fetchPlayerDetail(game, playerId),
    enabled: !!playerId,
  });

  if (!playerId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Invalid player id.
      </div>
    );
  }

  if (isPending || !data) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading player…</div>
    );
  }

  const wallet = data.wallet;
  const tc = data.ticket_counts;

  return (
    <PageShell className="overflow-x-hidden">
      <AppBarIdentity
        name={data.full_name}
        meta={data.phone}
        onBack={() => router.back()}
      />

      <div className="grid items-start gap-4 lg:grid-cols-5">
        {/* Left column — info + wallet */}
        <div className="col-span-5 space-y-4 lg:col-span-1">
          {/* Contact card */}
          <Card>
            <CardHeader icon={<LuPhone />} title="Contact" />
            <CardBody className="flex flex-col gap-3">
              <SideRow
                icon={LuPhone}
                iconColor="text-emerald-600"
                label={data.phone}
              />
              <SideRow
                icon={LuMail}
                iconColor="text-blue-600"
                label={data.email || "—"}
              />
              <SideRow
                icon={LuCalendar}
                label={`Joined ${formatDate(data.joined)}`}
              />
            </CardBody>
          </Card>

          {/* Wallet card */}
          {wallet && (
            <Card>
              <CardHeader icon={<LuWallet />} title="Wallet" />
              <CardBody className="flex flex-col gap-3">
                <SideRow
                  icon={LuWallet}
                  iconColor="text-brand-600"
                  label="Balance"
                  value={formatUsd(parseFloat(wallet.balance))}
                />
                <SideRow
                  icon={LuArrowDownLeft}
                  iconColor="text-emerald-600"
                  label="Deposited"
                  value={formatUsd(parseFloat(wallet.total_deposited))}
                />
                <SideRow
                  icon={LuTrophy}
                  iconColor="text-amber-600"
                  label="Won"
                  value={formatUsd(parseFloat(wallet.total_won))}
                />
                <SideRow
                  icon={LuArrowUpRight}
                  iconColor="text-rose-600"
                  label="Withdrawn"
                  value={formatUsd(parseFloat(wallet.total_withdrawn))}
                />
              </CardBody>
            </Card>
          )}

          {/* Ticket counts */}
          <Card>
            <CardHeader icon={<LuTicket />} title="Ticket status" />
            <CardBody className="flex flex-col gap-3">
              {(
                [
                  { label: "Active", key: "active", color: "text-blue-600" },
                  { label: "Won", key: "won", color: "text-emerald-600" },
                  { label: "Lost", key: "lost", color: "text-rose-600" },
                  { label: "Claimed", key: "claimed", color: "text-brand-700" },
                  {
                    label: "Cancelled",
                    key: "cancelled",
                    color: "text-muted-foreground",
                  },
                  {
                    label: "Expired",
                    key: "expired",
                    color: "text-foreground-muted",
                  },
                ] as { label: string; key: keyof typeof tc; color: string }[]
              ).map(({ label, key, color }) => (
                <SideRow
                  key={key}
                  icon={LuTicket}
                  label={label}
                  value={String(tc[key])}
                  valueClassName={color}
                />
              ))}
            </CardBody>
          </Card>
        </div>

        {/* Right column — summary cards + tabs */}
        <div className="col-span-5 flex min-w-0 flex-col gap-4 lg:col-span-4">
          {wallet && (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatTile
                icon={<LuWallet />}
                label="Balance"
                value={formatUsd(parseFloat(wallet.balance))}
              />
              <StatTile
                icon={<LuArrowDownLeft />}
                label="Total deposited"
                value={formatUsd(parseFloat(wallet.total_deposited))}
              />
              <StatTile
                icon={<LuTrophy />}
                label="Total won"
                value={formatUsd(parseFloat(wallet.total_won))}
              />
              <StatTile
                icon={<LuArrowUpRight />}
                label="Total withdrawn"
                value={formatUsd(parseFloat(wallet.total_withdrawn))}
              />
            </div>
          )}

          <div className="min-w-0 overflow-x-auto">
            <Tabs className="w-full min-w-0" variant="secondary">
              <Tabs.ListContainer className="shrink-0 w-full max-w-full overflow-x-auto overflow-y-hidden md:overflow-visible">
                <Tabs.List
                  aria-label="Player tabs"
                  className="inline-flex! w-max! whitespace-nowrap"
                >
                  <Tabs.Tab
                    id="tickets"
                    className="h-10 w-auto! flex-none! whitespace-nowrap px-4 text-sm font-medium"
                  >
                    Tickets
                    <Tabs.Indicator className="rounded-none bg-brand-500" />
                  </Tabs.Tab>
                  <Tabs.Tab
                    id="wins"
                    className="h-10 w-auto! flex-none! whitespace-nowrap px-4 text-sm font-medium"
                  >
                    Wins
                    <Tabs.Indicator className="rounded-none bg-brand-500" />
                  </Tabs.Tab>
                  <Tabs.Tab
                    id="transactions"
                    className="h-10 w-auto! flex-none! whitespace-nowrap px-4 text-sm font-medium"
                  >
                    Transactions
                    <Tabs.Indicator className="rounded-none bg-brand-500" />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel
                id="tickets"
                className="md:flex-1 md:min-h-0 min-w-0 w-full"
              >
                <TicketsTable game={game} playerId={playerId} />
              </Tabs.Panel>
              <Tabs.Panel
                id="wins"
                className="md:flex-1 md:min-h-0 min-w-0 w-full"
              >
                <WinsTable game={game} playerId={playerId} />
              </Tabs.Panel>
              <Tabs.Panel
                id="transactions"
                className="md:flex-1 md:min-h-0 min-w-0 w-full"
              >
                <TransactionsTable game={game} playerId={playerId} />
              </Tabs.Panel>
            </Tabs>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

export default function PlayerPage() {
  return (
    <Suspense>
      <PlayerDetailView />
    </Suspense>
  );
}

const SideRow = ({
  icon: Icon,
  label,
  value,
  iconColor,
  valueClassName,
}: {
  icon: ElementType;
  label: string;
  value?: string;
  /** Only for rows where the glyph's colour is the signal. */
  iconColor?: string;
  valueClassName?: string;
}) => (
  <DetailRow
    icon={<Icon />}
    iconClassName={iconColor}
    label={label}
    value={value}
    valueClassName={valueClassName}
  />
);
