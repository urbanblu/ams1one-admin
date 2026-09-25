"use client";

import CustomTable from "@/components/custom-table";
import { StatusBadge } from "@/components/ui";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PlayersService, { type PlayerGame } from "@/api/players";
import { formatGhs } from "@/utils/currency";

function TicketsTable({
  game,
  playerId,
}: {
  game: PlayerGame;
  playerId: string;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);

  const { data, isPending, isFetching } = useQuery({
    queryKey: [
      "players",
      game,
      playerId,
      "tickets",
      currentPage,
      currentPageSize,
    ],
    queryFn: () =>
      PlayersService.fetchPlayerTickets(game, playerId, {
        page: currentPage,
        page_size: currentPageSize,
      }),
    enabled: !!playerId,
  });

  const rows = data?.results ?? [];
  const pagination = data
    ? {
        pageNumber: currentPage,
        pageSize: currentPageSize,
        totalCount: data.count,
      }
    : { pageNumber: 1, pageSize: currentPageSize, totalCount: 0 };

  return (
    <div className="flex flex-col min-w-0 lg:h-full lg:min-h-0">
      <CustomTable
        columns={[
          { key: "ticketNo", label: "Ticket #", sortable: false },
          { key: "soldAt", label: "Date", sortable: false },
          { key: "event", label: "Event", sortable: false },
          { key: "game", label: "Game", sortable: false },
          { key: "channel", label: "Channel", sortable: false },
          { key: "amount", label: "Amount", sortable: false },
          { key: "stakes", label: "Stakes", sortable: false },
          { key: "status", label: "Status", sortable: false },
        ]}
        data={rows.map((r) => ({
          ticketNo: (
            <span className="text-xs font-semibold tabular-nums">
              {r.ticket_no}
            </span>
          ),
          soldAt: new Date(r.sold_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          event: (
            <span className="text-xs">
              #{r.draw_event.event_no} — {r.draw_event.name}
            </span>
          ),
          game: (
            <span className="text-xs font-semibold">{r.game_type.name}</span>
          ),
          channel: <span className="text-xs capitalize">{r.channel}</span>,
          amount: (
            <span className="text-sm font-semibold tabular-nums">
              {formatGhs(parseFloat(r.total_amount))}
            </span>
          ),
          stakes: (
            <span className="text-sm font-semibold tabular-nums">
              {r.stake_count}
            </span>
          ),
          status: (
            <StatusBadge
              status={r.status}
              tone={r.status?.toLowerCase() === "active" ? "info" : undefined}
            />
          ),
        }))}
        pagination={pagination}
        pageSize={currentPageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={(s) => {
          setCurrentPageSize(s);
          setCurrentPage(1);
        }}
        onRowClick={() => {}}
        onSort={() => {}}
        loading={isPending}
        isRefetching={isFetching}
      />
    </div>
  );
}

export default TicketsTable;
