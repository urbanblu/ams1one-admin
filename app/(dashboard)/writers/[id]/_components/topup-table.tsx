"use client";

import CustomTable from "@/components/custom-table";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import WritersService from "@/api/writers";
import { formatUsd } from "@/utils/currency";

function TopUpTable({ writerId }: { writerId: string }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["writers", writerId, "topups", currentPage, currentPageSize],
    queryFn: () =>
      WritersService.fetchWriterTopups(writerId, {
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
          { key: "createdAt", label: "Date", sortable: true },
          { key: "method", label: "Method", sortable: false },
          { key: "reference", label: "Reference", sortable: false },
          { key: "amount", label: "Amount", sortable: false, align: "right" },
          {
            key: "airtimeCredited",
            label: "Airtime credited",
            sortable: false,
            align: "right",
          },
        ]}
        data={rows.map((r) => ({
          createdAt: (
            <span className="text-xs font-medium tabular-nums text-foreground">
              {r.created_at}
            </span>
          ),
          method: (
            <span className="text-xs capitalize text-foreground-light">
              {r.method.replace(/_/g, " ")}
            </span>
          ),
          reference: (
            <span className="text-xs tabular-nums text-foreground-light">
              {r.reference || "—"}
            </span>
          ),
          amount: (
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {formatUsd(parseFloat(String(r.amount)) || 0)}
            </span>
          ),
          airtimeCredited: (
            <span className="text-xs font-semibold tabular-nums text-foreground">
              {formatUsd(parseFloat(String(r.airtime_credited)) || 0)}
            </span>
          ),
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

export default TopUpTable;
