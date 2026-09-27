"use client";

import { cn } from "@heroui/react";
import CustomDatePicker from "@/components/custom-date-picker";
import TrophyBadge from "@/public/images/new/trophy-badge.png";
import Image from "next/image";
import CustomSelectComponent from "@/components/custom-select-component";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  HeroDivider,
  HeroFact,
  HeroLedger,
  HeroPanel,
  HeroScope,
  HeroStat,
  NumberBallRow,
} from "@/components/ui";
import type { HeroLedgerEntry } from "@/components/ui";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DateValue } from "@internationalized/date";
import SalesService from "@/api/sales";
import GamesService from "@/api/games";
import { formatUsd } from "@/utils/currency";
import { formatTradingDay } from "@/utils/date";
import type { IWinnerRow } from "@/interfaces/sales.interface";
import { usePageAccess } from "@/hooks/use-page-access";
import { LuBanknote, LuCalendarDays, LuTrophy } from "react-icons/lu";

function ThirdSalesSegment() {
  const { hasPage } = usePageAccess();
  const canSeeWins = hasPage("sales.today_wins");
  const canSeeClaims = hasPage("sales.today_claims");
  const canSeeEvents = hasPage("sales.winning_events");
  const canSeeWinners = hasPage("sales.winners_list");

  const [selectedDate, setSelectedDate] = useState<string>();
  const [selectedGameKey, setSelectedGameKey] = useState("all");

  const { data: todayWins, isPending: winsPending } = useQuery({
    queryKey: ["sales", "today-wins"],
    queryFn: SalesService.fetchTodayWins,
  });

  const { data: todayClaims, isPending: claimsPending } = useQuery({
    queryKey: ["sales", "today-claims"],
    queryFn: SalesService.fetchTodayClaims,
  });

  const { data: winningEvents } = useQuery({
    queryKey: ["sales", "winning-events", selectedDate ?? "today"],
    queryFn: () => SalesService.fetchWinningEvents(selectedDate),
  });

  const { data: winnersList } = useQuery({
    queryKey: ["sales", "winners-list", selectedDate ?? "today"],
    queryFn: () => SalesService.fetchWinnersList(selectedDate),
  });

  const { data: gameTypes = [] } = useQuery({
    queryKey: ["games", "types", "sales-third"],
    queryFn: () => GamesService.fetchGameTypes({ is_active: true }),
  });

  const gameOptions = useMemo(() => {
    return [
      { key: "all", label: "All" },
      ...gameTypes.map((g) => ({
        key: g.id,
        label: g.name,
      })),
    ];
  }, [gameTypes]);

  const visibleEvents = useMemo(() => {
    const events = winningEvents?.events ?? [];
    if (selectedGameKey === "all") return events;
    return events.filter((event) => event.game_type?.id === selectedGameKey);
  }, [winningEvents?.events, selectedGameKey]);

  const visibleWinners = useMemo(() => {
    const winners = winnersList?.winners ?? [];
    if (selectedGameKey === "all") return winners;
    const visibleEventNos = new Set(visibleEvents.map((e) => e.event_no));
    return winners.filter((winner) => visibleEventNos.has(winner.event_no));
  }, [winnersList?.winners, selectedGameKey, visibleEvents]);

  /**
   * The largest payout on screen, or null when singling one out would be
   * meaningless — a lone winner, or a set that all won the same amount. Ties
   * for an actual maximum are all marked; they did all win the most.
   */
  const topWinAmount = useMemo(() => {
    if (visibleWinners.length < 2) return null;
    const amounts = visibleWinners.map((winner) => winner.win_amount);
    const highest = Math.max(...amounts);
    return highest === Math.min(...amounts) ? null : highest;
  }, [visibleWinners]);

  /* ---- Today, as the server counts it. Whole day, not this selection. --- */

  const winAmount = todayWins?.total_win_amount ?? 0;
  const winners = todayWins?.unique_players ?? 0;
  const claimed = todayClaims?.total_claims ?? 0;
  const withdrawn = todayClaims?.claims_withdrawn ?? 0;
  /* Claims that have been made but not cashed out — still sitting on the
     players' balances, and still ours to pay. */
  const onBalance = Math.max(0, claimed - withdrawn);

  const tradingDay = formatTradingDay(todayWins?.date ?? todayClaims?.date);

  /* What the figure covers: the day it belongs to and how many players it was
     spread across. */
  const winsScope: React.ReactNode[] = [
    tradingDay ? <span className="text-white/70">{tradingDay}</span> : null,
    winAmount > 0 ? (
      <HeroFact
        value={winners.toLocaleString("en-US")}
        label={winners === 1 ? "player" : "players"}
      />
    ) : (
      <span>Nothing won yet</span>
    ),
  ];

  /* The claims figure standing on its own, for someone not cleared to see the
     wins it draws on. */
  const claimsScope: React.ReactNode[] = [
    tradingDay ? <span className="text-white/70">{tradingDay}</span> : null,
    <HeroFact key="withdrawn" value={formatUsd(withdrawn)} label="withdrawn" />,
  ];

  /* A win is not money out of the door until the player collects it, and it
     is not gone until they withdraw it. The split is the point, so it reads
     as one track rather than as two figures the reader has to subtract. */
  const claimEntries: HeroLedgerEntry[] = useMemo(() => {
    const share = (n: number) => (claimed > 0 ? n / claimed : 0);

    return [
      {
        key: "withdrawn",
        label: "Withdrawn",
        value: formatUsd(withdrawn),
        /* The total appears once, flush right, on the row where the
           proportion it scales is being read. */
        hint: `of ${formatUsd(claimed)} claimed`,
        share: share(withdrawn),
        tone: "brand",
      },
      {
        key: "balance",
        label: "On balance",
        value: formatUsd(onBalance),
        hint: "still with players",
        share: share(onBalance),
        tone: "muted",
      },
    ];
  }, [claimed, onBalance, withdrawn]);

  /* Before the first claim there is no split, there is an absence — two
     zeroes under a flat rail say the same nothing twice. */
  const nothingClaimed = !claimsPending && claimed === 0 && withdrawn === 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* What players won today and how much of it they have taken. These are
          whole-day totals the server computed — the panel below reports a
          single draw date and game, which is a slice of the day, not all of
          it. */}
      {(canSeeWins || canSeeClaims) && (
        <HeroPanel padded={false} className="shrink-0">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-stretch lg:gap-8">
            {canSeeWins ? (
              <HeroStat
                className="lg:flex-[2]"
                icon={<LuTrophy />}
                label="Today’s wins"
                value={formatUsd(winAmount)}
                scope={<HeroScope facts={winsScope} />}
                /* True, but not news. A day nobody has won yet should read as
                   quiet rather than as a figure worth shouting. */
                isMuted={!winsPending && winAmount === 0}
                isLoading={winsPending}
              />
            ) : (
              <HeroStat
                className="lg:flex-[2]"
                icon={<LuBanknote />}
                label="Today’s claims"
                value={formatUsd(claimed)}
                scope={<HeroScope facts={claimsScope} />}
                isMuted={!claimsPending && claimed === 0}
                isLoading={claimsPending}
              />
            )}

            {canSeeWins && canSeeClaims && (
              <>
                <HeroDivider />
                <HeroLedger
                  className="lg:flex-[3]"
                  icon={<LuBanknote />}
                  label="Claimed today"
                  entries={claimEntries}
                  isLoading={claimsPending}
                  isEmpty={nothingClaimed}
                  empty={
                    <p className="max-w-xs text-xs leading-relaxed text-white/45">
                      Nothing claimed yet. As players collect their wins, this
                      splits into what they withdrew and what is still sitting
                      on their balance.
                    </p>
                  }
                />
              </>
            )}
          </div>
        </HeroPanel>
      )}

      {/* Winnings panel */}
      {(canSeeEvents || canSeeWinners) && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <Card className="flex h-full flex-col">
            <CardHeader
              icon={<LuTrophy />}
              title="Winnings"
              description="Drawn events and the players who won them"
            />

            <div className="grid shrink-0 gap-3 border-b border-border px-5 py-4 sm:grid-cols-2">
              <div>
                <CustomDatePicker
                  label="Draw date"
                  onDatePicked={(date: DateValue) =>
                    setSelectedDate(date.toString())
                  }
                />
              </div>
              <CustomSelectComponent
                label="Game"
                initialItemKey="all"
                showDropDownIcon
                list={gameOptions}
                onSelectionChange={(item) => setSelectedGameKey(item.key)}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div
                className={`grid h-full grid-cols-1 ${
                  canSeeEvents && canSeeWinners
                    ? "md:grid-cols-2 md:divide-x md:divide-border"
                    : ""
                }`}
              >
                {/* Events column */}
                {canSeeEvents && (
                  <div className="flex flex-col">
                    <p className="border-b border-border px-5 py-3 text-xs font-medium text-foreground-light">
                      Events
                    </p>
                    {visibleEvents.length === 0 ? (
                      <EmptyState
                        icon={<LuCalendarDays />}
                        title="No events"
                        description="Nothing was drawn for this date and game."
                        className="py-12"
                      />
                    ) : (
                      <div className="divide-y divide-border">
                        {visibleEvents.map((event) => (
                          <MiniEventInfo
                            key={event.event_id}
                            title={event.event_name}
                            values={event.winning_numbers}
                            event={String(event.event_no)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Winners column */}
                {canSeeWinners && (
                  <div className="flex flex-col border-t border-border md:border-t-0">
                    <p className="border-b border-border px-5 py-3 text-xs font-medium text-foreground-light">
                      Winners
                    </p>
                    {visibleWinners.length === 0 ? (
                      <EmptyState
                        icon={<LuTrophy />}
                        title="No winners"
                        description="No winning tickets for this selection."
                        className="py-12"
                      />
                    ) : (
                      <div className="divide-y divide-border">
                        {visibleWinners.map((winner, index) => (
                          <WinnerItem
                            key={`${winner.player_phone}-${index}`}
                            winner={winner}
                            isTopWin={winner.win_amount === topWinAmount}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default ThirdSalesSegment;

const MiniEventInfo = ({
  title,
  event,
  values,
}: {
  title: string;
  event: string;
  values: number[];
}) => {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-foreground-light">
          Event <span className="font-medium tabular-nums">#{event}</span>
        </p>
      </div>
      <NumberBallRow values={values} variant="solid" size="sm" />
    </div>
  );
};

const WinnerItem = ({
  winner,
  isTopWin,
}: {
  winner: IWinnerRow;
  /** Carried the largest payout in the current selection. */
  isTopWin?: boolean;
}) => {
  const firstLine = winner.numbers_staked?.[0] ?? [];
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-5 py-4 transition-colors",
        isTopWin && "bg-brand-50",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <NumberBallRow values={firstLine} variant="soft" size="sm" />
          {isTopWin && (
            <Badge tone="brand" className="normal-case">
              <Image src={TrophyBadge} alt="" className="size-3" />
              Biggest win
            </Badge>
          )}
        </div>
        <p className="mt-2 truncate text-xs text-foreground-light">
          Event #{winner.event_no} · {winner.event_name}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end">
        <span className="text-sm font-medium tabular-nums text-foreground">
          {formatUsd(winner.win_amount)}
        </span>
        <span className="mt-0.5 text-xs text-foreground-light">
          {winner.player_phone}
        </span>
        <span className="text-xs text-foreground-light">
          {winner.writer_name}
        </span>
      </div>
    </div>
  );
};
