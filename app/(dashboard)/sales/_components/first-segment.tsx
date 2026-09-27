"use client";

import CustomTable, { TableRow } from "@/components/custom-table";
import { useMemo, useState } from "react";
import { CloseButton, Popover, Separator } from "@heroui/react";
import {
  Button,
  EmptyState,
  FilterToggleGroup,
  HeroDivider,
  HeroFact,
  HeroLedger,
  HeroPanel,
  HeroScope,
  HeroStat,
  NumberBall,
  ScopeFact,
  ScopeLabel,
  ScopeLine,
} from "@/components/ui";
import type { HeroLedgerEntry } from "@/components/ui";
import IntradaySalesChart from "./intraday-sales-chart";
import {
  LuEllipsisVertical,
  LuFilter,
  LuReceipt,
  LuSplit,
} from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import SalesService from "@/api/sales";
import GamesService from "@/api/games";
import { formatUsd, parseStakeAmount } from "@/utils/currency";
import { formatTradingDay } from "@/utils/date";
import { IDetailedTicket } from "@/interfaces/sales.interface";
import { usePageAccess } from "@/hooks/use-page-access";
import { useCountUp } from "@/hooks/use-count-up";

function formatTime(isoDateTime: string) {
  const normalized = isoDateTime.includes("T")
    ? isoDateTime
    : isoDateTime.replace(" ", "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return isoDateTime;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function ticketMatchesGameFilter(
  ticket: IDetailedTicket,
  hiddenGames: Set<string>,
): boolean {
  // Every game is on until the user switches one off.
  if (hiddenGames.size === 0) return true;
  return ticket.stakes.some((s) => !hiddenGames.has(s.game.code));
}

function FirstSalesSegment() {
  const { hasPage } = usePageAccess();
  const canSeeSalesCard = hasPage("sales.today_sales");
  const canSeeGameTypes = hasPage("sales.game_types");
  const canSeeTickets = hasPage("sales.detailed_tickets");
  /* Wins are the other half of the day's money. The winnings tab reports them
     per event and per player; here they only appear as what they cost the
     day's take, and only to someone already cleared to see them. */
  const canSeeWins = hasPage("sales.today_wins");

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);
  const [hiddenGames, setHiddenGames] = useState<Set<string>>(() => new Set());

  const { data: todaySales, isPending: salesPending } = useQuery({
    queryKey: ["sales", "today"],
    queryFn: SalesService.fetchTodaySales,
  });

  /* Same key the winnings tab uses, so switching between the two reads one
     cached answer rather than asking twice. */
  const { data: todayWins, isPending: winsPending } = useQuery({
    queryKey: ["sales", "today-wins"],
    queryFn: SalesService.fetchTodayWins,
    enabled: canSeeWins,
  });

  const { data: gameTypes = [], isPending: gamesPending } = useQuery({
    queryKey: ["games", "types"],
    queryFn: () => GamesService.fetchGameTypes({ is_active: true }),
  });

  const { data: ticketsResp, isPending: ticketsPending } = useQuery({
    queryKey: ["sales", "detailed-tickets", currentPage, currentPageSize],
    queryFn: () =>
      SalesService.fetchDetailedTickets({
        page: currentPage,
        page_size: currentPageSize,
      }),
  });

  const tickets = useMemo(
    () => ticketsResp?.results ?? [],
    [ticketsResp?.results],
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => ticketMatchesGameFilter(t, hiddenGames));
  }, [tickets, hiddenGames]);

  const selectedGameCodes = useMemo(
    () => gameTypes.map((g) => g.code).filter((code) => !hiddenGames.has(code)),
    [gameTypes, hiddenGames],
  );

  /* Counted over every ticket on the page, not the filtered set, so a switch
     still reports what it is holding back once it is off. A ticket that
     stakes on two games counts under both — exactly how the filter reads it. */
  const ticketsPerGame = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ticket of tickets) {
      const codes = new Set(ticket.stakes.map((s) => s.game.code));
      for (const code of codes) {
        counts.set(code, (counts.get(code) ?? 0) + 1);
      }
    }
    return counts;
  }, [tickets]);

  const showGameFilter = canSeeGameTypes && gameTypes.length > 0;
  const isGameFiltered = hiddenGames.size > 0;

  const handleGameToggle = (code: string, next: boolean) => {
    setHiddenGames((prev) => {
      const draft = new Set(prev);
      if (next) draft.delete(code);
      else draft.add(code);
      return draft;
    });
  };

  const pagination = useMemo(
    () => ({
      pageNumber: currentPage,
      pageSize: currentPageSize,
      totalCount: ticketsResp?.count ?? filteredTickets.length,
    }),
    [currentPage, currentPageSize, ticketsResp?.count, filteredTickets.length],
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setCurrentPageSize(size);
    setCurrentPage(1);
  };

  const handleRowClick = () => {};

  const handleSort = (column: string, direction: "asc" | "desc") => {
    void column;
    void direction;
  };

  const loading = salesPending || gamesPending || ticketsPending;

  /* ---- The day, as the server counts it. Exact figures, whole day. ------ */

  const ticketCount = todaySales?.ticket_count ?? 0;
  const totalSales = todaySales?.total_sales ?? 0;
  const averageTicket = ticketCount > 0 ? totalSales / ticketCount : 0;

  const paidOut = todayWins?.total_win_amount ?? 0;
  const grossGamingRevenue = totalSales - paidOut;
  /* Undefined rather than 0% on a day that has not sold anything — a rate off
     a zero denominator is not a rate. */
  const retentionRate =
    totalSales > 0 ? (grossGamingRevenue / totalSales) * 100 : undefined;

  /* Screen readers get the settled figure, not whatever frame the animation
     happens to be on when focus reaches it. Only the headline counts itself
     in; a panel where every figure animates takes a second to become
     readable. */
  const animatedSales = useCountUp(todaySales?.total_sales);

  const headerAmount =
    todaySales && animatedSales !== undefined ? (
      <>
        <span aria-hidden="true">{formatUsd(animatedSales)}</span>
        <span className="sr-only">{formatUsd(todaySales.total_sales)}</span>
      </>
    ) : (
      "—"
    );

  const tradingDay = formatTradingDay(todaySales?.date);

  /* What the figure covers and what it is made of — the day it belongs to,
     how many tickets it came off, and what each one was worth. Tickets times
     average multiply back to the headline, so they read under it rather than
     across the panel from it. */
  const scopeFacts: React.ReactNode[] = [
    tradingDay ? <span className="text-white/70">{tradingDay}</span> : null,
    ticketCount > 0 ? (
      <HeroFact
        value={ticketCount.toLocaleString("en-US")}
        label={ticketCount === 1 ? "ticket" : "tickets"}
      />
    ) : (
      <span>No tickets sold yet</span>
    ),
    ticketCount > 0 ? (
      <HeroFact value={formatUsd(averageTicket)} label="average" />
    ) : null,
  ];

  /* Before the first ticket there is no split — there is an absence. Zero
     kept of zero sold, nothing staked, no winners: four figures that all say
     the same nothing. Say it once instead. */
  const nothingToSplit =
    !salesPending && !winsPending && totalSales === 0 && paidOut === 0;

  /* The day's take, split into what stayed and what went out. Measured
     against whichever is larger so the track never has to render past its
     own end: on an ordinary day that is sales, and the two shares fill it; on
     a day the payouts outrun the sales it is the payouts, and the track fills
     with them alone. */
  const ledgerEntries: HeroLedgerEntry[] = useMemo(() => {
    const overdrawn = grossGamingRevenue < 0;
    const denominator = Math.max(totalSales, paidOut);

    return [
      {
        key: "kept",
        /* On a day the payouts outran the sales there is nothing kept, there
           is a hole — and "Kept -USD 61,794.25" makes the reader do the sign
           arithmetic before they can see that. */
        label: overdrawn ? "Shortfall" : "Kept",
        value: overdrawn ? (
          <span className="text-rose-300">
            {formatUsd(Math.abs(grossGamingRevenue))}
          </span>
        ) : (
          formatUsd(grossGamingRevenue)
        ),
        hint: overdrawn
          ? "payouts exceed sales"
          : retentionRate === undefined
            ? "—"
            : `${retentionRate.toFixed(1)}% retention`,
        share:
          denominator > 0 && !overdrawn ? grossGamingRevenue / denominator : 0,
        /* The legend dot keys the bar, so it follows the bar: on an overdrawn
           day the track is entirely payouts and the whole legend goes red
           with it, rather than showing a violet key for a segment that was
           never drawn. */
        tone: overdrawn ? "danger" : "brand",
      },
      {
        key: "paid",
        label: "Paid out",
        value: formatUsd(paidOut),
        hint:
          todayWins?.unique_players === 1
            ? "1 winner"
            : `${(todayWins?.unique_players ?? 0).toLocaleString("en-US")} winners`,
        share: denominator > 0 ? paidOut / denominator : 0,
        tone: overdrawn ? "danger" : "muted",
      },
    ];
  }, [
    grossGamingRevenue,
    paidOut,
    retentionRate,
    todayWins?.unique_players,
    totalSales,
  ]);

  /* ---- This page, derived. Never presented as the whole day. ------------ */

  const pageStakes = useMemo(
    () =>
      filteredTickets.reduce(
        (sum, t) => sum + (t.total_stake ?? t.stakes.length ?? 0),
        0,
      ),
    [filteredTickets],
  );

  const pageValue = useMemo(
    () =>
      filteredTickets.reduce(
        (sum, t) => sum + parseStakeAmount(t.total_stake_amount),
        0,
      ),
    [filteredTickets],
  );

  /* The filter, not the data, is why the table is empty — worth saying, since
     the switches that caused it are scrolled out of sight above the fold. */
  const filterHidEverything =
    !loading &&
    isGameFiltered &&
    tickets.length > 0 &&
    filteredTickets.length === 0;

  /* Read off the server's count, not the length of this page: page 5 of a
     busy day is also empty, and "nothing sold yet" would be a lie there. */
  const nothingSoldToday = !loading && (ticketsResp?.count ?? 0) === 0;

  const tableData: TableRow[] = filteredTickets.map((ticket) => {
    const first = ticket.stakes[0];
    return {
      ticket: (
        <div className="flex flex-col items-start space-y-1">
          <span>{ticket.ticket_no}</span>
          <span className="text-xs font-medium text-foreground-muted">
            {first?.writer?.name ?? "—"}
          </span>
        </div>
      ),
      play: ticket.play_group || first?.play || "—",
      stakes: String(ticket.total_stake ?? ticket.stakes.length ?? 0),
      amount: (
        <span className="font-medium tabular-nums text-foreground">
          {formatUsd(parseStakeAmount(ticket.total_stake_amount))}
        </span>
      ),
      time: (
        <div className="flex items-center gap-1.5">
          <span className="font-medium tabular-nums">
            {formatTime(ticket.time)}
          </span>
          <Popover>
            <CloseButton
              aria-label="View stakes"
              className="flex size-7 items-center justify-center rounded-full bg-transparent text-foreground-muted transition-colors hover:bg-subtle hover:text-foreground"
            >
              <LuEllipsisVertical className="size-4" />
            </CloseButton>
            <Popover.Content
              className="w-full rounded-lg border border-border shadow-overlay sm:max-w-lg"
              placement="bottom right"
            >
              <Popover.Dialog className="w-full p-0">
                <div className="max-h-72 space-y-5 overflow-y-auto py-5">
                  {ticket.stakes.map((stake, index) => {
                    const nums = stake.numbers.split(",").map((n) => n.trim());
                    const isLast = index === ticket.stakes.length - 1;
                    return (
                      <div key={stake.stake_id}>
                        <div className="flex w-full flex-row items-center justify-between gap-2 px-5">
                          <div className="flex min-w-0 flex-col items-start">
                            <span className="truncate text-xs font-medium text-foreground">
                              {stake.writer?.name}
                            </span>
                            <span className="mt-0.5 text-xs text-foreground-muted">
                              {stake.writer?.phone}
                            </span>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {stake.play}
                          </span>
                          <div className="flex flex-col items-center space-y-1">
                            <div className="flex flex-wrap gap-1 justify-start">
                              {nums.map((num, ni) => (
                                <NumberBall key={ni} variant="solid" size="sm">
                                  {num}
                                </NumberBall>
                              ))}
                            </div>
                            <span className="text-xs text-foreground-muted">
                              {stake.game?.name}
                            </span>
                          </div>
                          <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
                            {formatUsd(parseStakeAmount(stake.stake_amount))}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {formatTime(stake.created_at)}
                          </span>
                        </div>
                        {!isLast && (
                          <Separator className="mt-5 w-full bg-border-subtle" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </Popover.Dialog>
            </Popover.Content>
          </Popover>
        </div>
      ),
    };
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-col gap-3">
        {/* Today, as one figure and where it went. These are whole-day
            totals the server computed — nothing here is derived from the page
            of tickets below, which covers a slice of the day, not all of it. */}
        {canSeeSalesCard && (
          <HeroPanel padded={false}>
            {/* Two zones, not two edges. How much the day took, then where
                that went — each group whole on its own side of a hairline,
                so no figure has to be read against one half a panel away. */}
            <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-stretch lg:gap-8">
              <HeroStat
                className="lg:flex-[2]"
                icon={<LuReceipt />}
                label="Today’s total sales"
                value={headerAmount}
                scope={<HeroScope facts={scopeFacts} />}
                /* True, but not news. A day that has not opened should read
                   as quiet rather than as a figure worth shouting. */
                isMuted={!salesPending && totalSales === 0}
                isLoading={salesPending}
              />

              {/* Only drawn for someone cleared to see payouts — without them
                  the split is unknowable, and a bar claiming the whole day
                  was kept would be a guess. */}
              {canSeeWins && (
                <>
                  <HeroDivider />
                  <HeroLedger
                    className="lg:flex-[3]"
                    icon={<LuSplit />}
                    label="Where it went"
                    entries={ledgerEntries}
                    isLoading={salesPending || winsPending}
                    isEmpty={nothingToSplit}
                    empty={
                      <p className="max-w-xs text-xs leading-relaxed text-white/45">
                        Nothing to divide yet. As tickets sell, the day’s take
                        splits here into what stayed and what went out to
                        winners.
                      </p>
                    }
                  />
                </>
              )}
            </div>
          </HeroPanel>
        )}

        {/* How the figure above arrived. The panel answers how much; this
            answers when, which is the only other question a trading day gets
            asked before the tickets themselves — where the peak sits, whether
            the afternoon went quiet, whether the day is still running. */}
        {canSeeTickets && <IntradaySalesChart />}

        {/* The table's own toolbar. Everything on this line is measured from
            the rows currently loaded, so it says so once, on the left, and
            the figures after it inherit that scope. */}
        {(canSeeTickets || showGameFilter) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {canSeeTickets && (
              <ScopeLine
                facts={[
                  <ScopeLabel key="label" icon={<LuReceipt />}>
                    On this page
                  </ScopeLabel>,
                  isGameFiltered ? (
                    <span key="count" className="text-foreground-light">
                      <span className="font-medium tabular-nums text-foreground">
                        {filteredTickets.length.toLocaleString("en-US")}
                      </span>
                      {" of "}
                      <span className="font-medium tabular-nums text-foreground">
                        {tickets.length.toLocaleString("en-US")}
                      </span>
                      {" tickets"}
                    </span>
                  ) : (
                    <ScopeFact
                      key="count"
                      value={tickets.length.toLocaleString("en-US")}
                      label={tickets.length === 1 ? "ticket" : "tickets"}
                    />
                  ),
                  <ScopeFact
                    key="stakes"
                    value={pageStakes.toLocaleString("en-US")}
                    label={pageStakes === 1 ? "stake" : "stakes"}
                  />,
                  <ScopeFact key="value" value={formatUsd(pageValue)} />,
                ]}
              />
            )}

            {showGameFilter && (
              <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                {isGameFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHiddenGames(new Set())}
                  >
                    Show all
                  </Button>
                )}
                <FilterToggleGroup
                  label="Filter by game type"
                  options={gameTypes.map((g) => ({
                    key: g.code,
                    label: g.name,
                    hint: tickets.length
                      ? (ticketsPerGame.get(g.code) ?? 0).toLocaleString(
                          "en-US",
                        )
                      : undefined,
                  }))}
                  selectedKeys={selectedGameCodes}
                  onToggle={handleGameToggle}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {canSeeTickets && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="h-full">
            <CustomTable
              columns={[
                { key: "ticket", label: "Ticket #", sortable: true },
                { key: "play", label: "Play", sortable: true },
                {
                  key: "stakes",
                  label: "Stakes",
                  sortable: false,
                  align: "right",
                },
                {
                  key: "amount",
                  label: "Amount",
                  sortable: true,
                  align: "right",
                },
                { key: "time", label: "Time", sortable: false },
              ]}
              data={tableData}
              pagination={pagination}
              pageSize={currentPageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onRowClick={handleRowClick}
              onSort={handleSort}
              loading={loading}
              isRefetching={false}
              emptyState={
                filterHidEverything ? (
                  <EmptyState
                    icon={<LuFilter />}
                    title="No tickets match this filter"
                    description={`All ${tickets.length} tickets on this page stake only on game types you’ve switched off.`}
                    action={
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setHiddenGames(new Set())}
                      >
                        Show all games
                      </Button>
                    }
                  />
                ) : nothingSoldToday ? (
                  <EmptyState
                    icon={<LuReceipt />}
                    title="No tickets sold yet today"
                    description="Every ticket a writer sells today lands here, newest first."
                  />
                ) : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default FirstSalesSegment;
