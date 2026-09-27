"use client";

import CustomTable from "@/components/custom-table";
import { StatusBadge } from "@/components/ui";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import WritersService from "@/api/writers";
import { formatUsd } from "@/utils/currency";

function SalesTable({ writerId }: { writerId: string }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["writers", writerId, "sales", currentPage, currentPageSize],
    queryFn: () =>
      WritersService.fetchWriterSales(writerId, {
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
          { key: "ticketId", label: "Ticket ID", sortable: true },
          { key: "soldAt", label: "Date", sortable: false },
          { key: "event", label: "Event #", sortable: true },
          { key: "eventName", label: "Event", sortable: false },
          { key: "game", label: "Game", sortable: false },
          {
            key: "amountPaid",
            label: "Amount",
            sortable: false,
            align: "right",
          },
          { key: "stakes", label: "Stakes", sortable: false, align: "right" },
          { key: "status", label: "Status", sortable: false },
        ]}
        data={rows.map((r) => ({
          ticketId: (
            <span className="text-xs font-medium tabular-nums text-foreground">
              {r.ticket_no}
            </span>
          ),
          soldAt: r.sold_at,
          event: String(r.event_no),
          eventName: r.event_name,
          game: r.game,
          amountPaid: (
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {formatUsd(parseFloat(String(r.total_amount)) || 0)}
            </span>
          ),
          stakes: String(r.stake_count),
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

export default SalesTable;
