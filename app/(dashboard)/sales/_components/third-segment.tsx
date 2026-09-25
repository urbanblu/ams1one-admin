"use client";

import CustomDatePicker from "@/components/custom-date-picker";
import Badge from "@/public/images/new/trophy-badge.png";
import Image from "next/image";
import CustomSelectComponent from "@/components/custom-select-component";
import {
  Card,
  CardHeader,
  EmptyState,
  NumberBallRow,
  StatTile,
} from "@/components/ui";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DateValue } from "@internationalized/date";
import SalesService from "@/api/sales";
import GamesService from "@/api/games";
import { formatGhs } from "@/utils/currency";
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

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Wins + claims */}
      {(canSeeWins || canSeeClaims) && (
        <div className="grid shrink-0 gap-3 md:grid-cols-2">
          {canSeeWins && (
            <StatTile
              label="Today’s wins"
              value={formatGhs(todayWins?.total_win_amount ?? 0)}
              hint={`from ${(todayWins?.unique_players ?? 0).toLocaleString("en-US")} players`}
              icon={<LuTrophy />}
              iconClassName="bg-primary-soft text-primary"
              isLoading={winsPending}
            />
          )}
          {canSeeClaims && (
            <StatTile
              label="Today’s claims"
              value={formatGhs(todayClaims?.total_claims ?? 0)}
              hint={`${formatGhs(todayClaims?.claims_withdrawn ?? 0)} withdrawn`}
              icon={<LuBanknote />}
              iconClassName="bg-amber-50 text-amber-500"
              isLoading={claimsPending}
            />
          )}
        </div>
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

            <div className="grid shrink-0 gap-3 border-b border-border-subtle px-5 py-4 sm:grid-cols-2">
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
                    ? "md:grid-cols-2 md:divide-x md:divide-border-subtle"
                    : ""
                }`}
              >
                {/* Events column */}
                {canSeeEvents && (
                  <div className="flex flex-col">
                    <p className="border-b border-border-subtle px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
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
                      <div className="divide-y divide-border-subtle">
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
                  <div className="flex flex-col border-t border-border-subtle md:border-t-0">
                    <p className="border-b border-border-subtle px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
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
                      <div className="divide-y divide-border-subtle">
                        {visibleWinners.map((winner, index) => (
                          <WinnerItem
                            key={`${winner.player_phone}-${index}`}
                            winner={winner}
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
        <p className="mt-0.5 text-[11px] text-zinc-400">
          Event <span className="font-semibold tabular-nums">#{event}</span>
        </p>
      </div>
      <NumberBallRow values={values} variant="solid" size="sm" />
    </div>
  );
};

const WinnerItem = ({ winner }: { winner: IWinnerRow }) => {
  const firstLine = winner.numbers_staked?.[0] ?? [];
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <NumberBallRow values={firstLine} variant="soft" size="sm" />
          <Image src={Badge} alt="" className="size-5" />
        </div>
        <p className="mt-2 truncate text-[11px] text-zinc-400">
          Event #{winner.event_no} · {winner.event_name}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatGhs(winner.win_amount)}
        </span>
        <span className="mt-0.5 text-[11px] text-muted-foreground">
          {winner.player_phone}
        </span>
        <span className="text-[11px] text-zinc-400">{winner.writer_name}</span>
      </div>
    </div>
  );
};
