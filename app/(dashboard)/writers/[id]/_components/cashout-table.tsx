"use client";

import CustomTable from "@/components/custom-table";
import { StatusBadge } from "@/components/ui";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import WritersService from "@/api/writers";
import { formatGhs } from "@/utils/currency";

function CashoutTable({ writerId }: { writerId: string }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["writers", writerId, "cashouts", currentPage, currentPageSize],
    queryFn: () =>
      WritersService.fetchWriterCashouts(writerId, {
        page: currentPage,
        page_size: currentPageSize,
      }),
    enabled: !!writerId,
  });

  const handlePageChange = (page: number) => setCurrentPage(page);
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
          { key: "provider", label: "Provider", sortable: false },
          { key: "mobileNumber", label: "Mobile Number", sortable: false },
          { key: "reference", label: "Reference", sortable: false },
          { key: "amount", label: "Amount", sortable: false },
          { key: "status", label: "Status", sortable: false },
        ]}
        data={rows.map((r) => ({
          createdAt: r.created_at,
          provider: (
            <span className="font-semibold text-xs capitalize">
              {r.mobile_provider}
            </span>
          ),
          mobileNumber: (
            <span className="font-semibold tabular-nums text-xs">
              {r.mobile_number}
            </span>
          ),
          reference: (
            <span className="font-semibold tabular-nums text-xs">
              {r.reference || "—"}
            </span>
          ),
          amount: (
            <span className="text-sm font-semibold tabular-nums">
              {formatGhs(parseFloat(String(r.amount)) || 0)}
            </span>
          ),
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

export default CashoutTable;
