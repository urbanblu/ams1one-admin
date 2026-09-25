"use client";

import CustomTable, { TableRow } from "@/components/custom-table";
import { useMemo, useState } from "react";
import { CloseButton, Popover, Separator } from "@heroui/react";
import CustomCheckboxItem from "@/components/custom-checkbox";
import { HeroPanel, HeroStat, NumberBall } from "@/components/ui";
import { LuEllipsisVertical, LuReceipt, LuFilter } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import SalesService from "@/api/sales";
import GamesService from "@/api/games";
import { formatGhs, parseStakeAmount } from "@/utils/currency";
import { IDetailedTicket } from "@/interfaces/sales.interface";
import { usePageAccess } from "@/hooks/use-page-access";

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
  selected: Record<string, boolean>,
): boolean {
  // Treat missing keys as "selected" by default.
  const selectedCodes = Object.keys(selected).filter(
    (c) => selected[c] === true,
  );
  const unselectedCodes = Object.keys(selected).filter(
    (c) => selected[c] === false,
  );

  // If the user hasn't explicitly unchecked anything, don't filter.
  if (selectedCodes.length === 0 && unselectedCodes.length === 0) return true;

  // If the user explicitly unchecked something, apply filtering using default=true for missing.
  return ticket.stakes.some((s) => selected[s.game.code] ?? true);
}

function FirstSalesSegment() {
  const { hasPage } = usePageAccess();
  const canSeeSalesCard = hasPage("sales.today_sales");
  const canSeeGameTypes = hasPage("sales.game_types");
  const canSeeTickets = hasPage("sales.detailed_tickets");

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);
  const [gameSelected, setGameSelected] = useState<Record<string, boolean>>({});

  const { data: todaySales, isPending: salesPending } = useQuery({
    queryKey: ["sales", "today"],
    queryFn: SalesService.fetchTodaySales,
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
    return tickets.filter((t) => ticketMatchesGameFilter(t, gameSelected));
  }, [tickets, gameSelected]);

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
  const headerAmount = todaySales ? formatGhs(todaySales.total_sales) : "—";

  const tableData: TableRow[] = filteredTickets.map((ticket) => {
    const first = ticket.stakes[0];
    return {
      ticket: (
        <div className="flex flex-col items-start space-y-1">
          <span>{ticket.ticket_no}</span>
          <span className="text-[10px] font-bold text-zinc-400">
            {first?.writer?.name ?? "—"}
          </span>
        </div>
      ),
      play: ticket.play_group || first?.play || "—",
      stakes: String(ticket.total_stake ?? ticket.stakes.length ?? 0),
      amount: (
        <span className="font-semibold tabular-nums text-foreground">
          {formatGhs(parseStakeAmount(ticket.total_stake_amount))}
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
              className="flex size-7 items-center justify-center rounded-full bg-transparent text-zinc-400 transition-colors hover:bg-subtle hover:text-foreground"
            >
              <LuEllipsisVertical className="size-4" />
            </CloseButton>
            <Popover.Content
              className="w-full rounded-2xl border border-border-subtle shadow-lg shadow-zinc-200/60 sm:max-w-lg"
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
                            <span className="mt-0.5 text-[10px] text-zinc-400">
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
                            <span className="text-[10px] text-zinc-400">
                              {stake.game?.name}
                            </span>
                          </div>
                          <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">
                            {formatGhs(parseStakeAmount(stake.stake_amount))}
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
        {/* Today's sales */}
        {canSeeSalesCard && (
          <HeroPanel>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <HeroStat
                icon={<LuReceipt />}
                label="Today’s total sales"
                value={headerAmount}
                isLoading={salesPending}
              />

              <div className="flex items-end gap-8 sm:gap-10">
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-widest text-white/60">
                    Tickets
                  </p>
                  {salesPending ? (
                    <div className="h-6 w-16 animate-pulse rounded-lg bg-white/20" />
                  ) : (
                    <p className="text-lg font-bold leading-none tracking-tight text-white">
                      {todaySales
                        ? todaySales.ticket_count.toLocaleString("en-US")
                        : "—"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-widest text-white/60">
                    Date
                  </p>
                  <p className="text-lg font-bold leading-none tracking-tight text-white">
                    {new Date().toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </HeroPanel>
        )}

        {/* Game filter row */}
        {canSeeGameTypes && gameTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-border-subtle bg-surface px-4 py-3">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <LuFilter className="size-3" />
              Game types
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {gameTypes.map((g) => (
                <CustomCheckboxItem
                  key={g.code}
                  selected={gameSelected[g.code] ?? true}
                  label={g.name}
                  setIsSelected={(v) =>
                    setGameSelected((prev) => ({ ...prev, [g.code]: v }))
                  }
                />
              ))}
            </div>
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
                { key: "stakes", label: "Stakes", sortable: false },
                { key: "amount", label: "Amount", sortable: true },
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
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default FirstSalesSegment;
