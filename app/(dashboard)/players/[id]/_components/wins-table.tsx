"use client";

import CustomTable from "@/components/custom-table";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PlayersService, { type PlayerGame } from "@/api/players";
import { formatGhs } from "@/utils/currency";

function winStatusClass(status: string) {
  const s = status.toLowerCase();
  if (s === "claimed") return "border-emerald-300 text-emerald-600";
  if (s === "pending") return "border-orange-500 text-orange-600";
  if (s === "expired") return "border-rose-300 text-rose-500";
  return "border-zinc-400 text-muted-foreground";
}

function WinsTable({ game, playerId }: { game: PlayerGame; playerId: string }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["players", game, playerId, "wins", currentPage, currentPageSize],
    queryFn: () =>
      PlayersService.fetchPlayerWins(game, playerId, {
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

  function fmtDate(iso: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
      ? "—"
      : d.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  }

  return (
    <div className="flex flex-col min-w-0 lg:h-full lg:min-h-0">
      <CustomTable
        columns={[
          { key: "winAmount", label: "Win Amount", sortable: false },
          { key: "status", label: "Status", sortable: false },
          { key: "computedAt", label: "Computed", sortable: false },
          { key: "claimedAt", label: "Claimed At", sortable: false },
          { key: "expiresAt", label: "Expires At", sortable: false },
        ]}
        data={rows.map((r) => ({
          winAmount: (
            <span className="text-sm font-semibold tabular-nums text-emerald-600">
              {formatGhs(parseFloat(r.win_amount))}
            </span>
          ),
          status: (
            <div
              className={`rounded-full border-[1.5px] text-center text-xs py-[2px] px-2 inline-block ${winStatusClass(r.status)}`}
            >
              <span className="text-[.6rem] capitalize">{r.status}</span>
            </div>
          ),
          computedAt: fmtDate(r.computed_at),
          claimedAt: fmtDate(r.claimed_at),
          expiresAt: fmtDate(r.expires_at),
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

export default WinsTable;
