"use client";

import CustomTable from "@/components/custom-table";
import { StatusBadge } from "@/components/ui";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import WritersService from "@/api/writers";
import { formatGhs } from "@/utils/currency";

function WinningsTable({ writerId }: { writerId: string }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["writers", writerId, "winnings", currentPage, currentPageSize],
    queryFn: () =>
      WritersService.fetchWriterWinnings(writerId, {
        page: currentPage,
        page_size: currentPageSize,
      }),
    enabled: !!writerId,
  });

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
          { key: "ticket", label: "Ticket #", sortable: true },
          { key: "event", label: "Event #", sortable: false },
          { key: "eventName", label: "Event", sortable: false },
          { key: "game", label: "Game", sortable: true },
          { key: "computedAt", label: "Computed At", sortable: false },
          { key: "stakeAmount", label: "Stake Amount", sortable: false },
          { key: "winAmount", label: "Win Amount", sortable: false },
          { key: "status", label: "Status", sortable: false },
        ]}
        data={rows.map((r) => ({
          ticket: r.ticket_no,
          event: String(r.event_no),
          eventName: r.event_name,
          game: r.game,
          computedAt: r.computed_at,
          stakeAmount: formatGhs(parseFloat(String(r.stake_amount)) || 0),
          winAmount: formatGhs(parseFloat(String(r.win_amount)) || 0),
          status: <StatusBadge status={r.status} />,
        }))}
        pagination={pagination}
        pageSize={currentPageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onRowClick={handleRowClick}
        onSort={handleSort}
        loading={isPending}
        isRefetching={isFetching}
      />
    </div>
  );
}

export default WinningsTable;
