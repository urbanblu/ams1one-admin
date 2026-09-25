"use client";

import CustomTable, { TableRow } from "@/components/custom-table";
import { Avatar, SearchInput, StatTile } from "@/components/ui";
import { useMemo, useState } from "react";
import { LuUsers, LuWallet } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import WritersService from "@/api/writers";
import FinancialsService from "@/api/financials";
import { usePageAccess } from "@/hooks/use-page-access";

function SecondSalesSegment() {
  const { hasPage } = usePageAccess();
  const canSeeTopUp = hasPage("sales.today_topups");
  const canSeeFloat = hasPage("sales.available_float");
  const canSeeWriters = hasPage("sales.writer_statistics");

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stats, isPending: statsPending } = useQuery({
    queryKey: ["writers", "statistics"],
    queryFn: WritersService.fetchStatistics,
  });

  const { data: todayTopUp, isPending: topUpPending } = useQuery({
    queryKey: ["writers", "today-topup"],
    queryFn: WritersService.fetchTodayTopUp,
  });

  const { data: availableFloat, isPending: floatPending } = useQuery({
    queryKey: ["writers", "available-float"],
    queryFn: WritersService.fetchAvailableFloat,
  });

  const writers = useMemo(() => stats?.writers ?? [], [stats?.writers]);
  const filteredWriters = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return writers;

    return writers.filter((row) => {
      const name = row.writer.name?.toLowerCase() ?? "";
      const phone = row.writer.contact.phone?.toLowerCase() ?? "";
      const email = row.writer.contact.email?.toLowerCase() ?? "";
      return (
        name.includes(query) || phone.includes(query) || email.includes(query)
      );
    });
  }, [writers, searchTerm]);

  const paged = useMemo(() => {
    const start = (currentPage - 1) * currentPageSize;
    return filteredWriters.slice(start, start + currentPageSize);
  }, [filteredWriters, currentPage, currentPageSize]);

  const pagination = useMemo(
    () => ({
      pageNumber: currentPage,
      pageSize: currentPageSize,
      totalCount: filteredWriters.length,
    }),
    [currentPage, currentPageSize, filteredWriters.length],
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

  const { data: writersAtWork } = useQuery({
    queryKey: ["financials", "writers-at-work"],
    queryFn: FinancialsService.fetchWritersAtWorkCard,
  });

  const loading = statsPending || topUpPending || floatPending;

  const tradingCount =
    writersAtWork != null
      ? `${writersAtWork.active_writers} of ${writersAtWork.total_writers}`
      : "—";

  const topUpDisplay = todayTopUp?.total_topup ?? "—";

  const tableData: TableRow[] = paged.map((row) => {
    return {
      retailer: (
        <div className="flex items-center gap-3">
          <Avatar
            name={row.writer.name}
            src={row.writer.profileImage ?? undefined}
            size="sm"
            status={row.writer.online ? "active" : "inactive"}
          />
          <div className="flex min-w-0 flex-col items-start">
            <span className="truncate text-sm font-medium text-foreground">
              {row.writer.name}
            </span>
            <span className="mt-0.5 text-[11px] text-zinc-400">
              {row.writer.contact.phone}
            </span>
          </div>
        </div>
      ),
      topUp: (
        <span className="font-semibold tabular-nums text-foreground">
          {row.topup}
        </span>
      ),
      sales: (
        <span className="font-semibold tabular-nums text-foreground">
          {row.sales}
        </span>
      ),
    };
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {(canSeeTopUp || canSeeFloat) && (
        <div className="grid shrink-0 gap-3 sm:grid-cols-2">
          {canSeeTopUp && (
            <StatTile
              label="Today’s top-up"
              value={topUpDisplay}
              icon={<LuWallet />}
              iconClassName="bg-primary-soft text-primary"
              isLoading={topUpPending}
            />
          )}
          {canSeeFloat && (
            <StatTile
              label="Available float"
              value={availableFloat?.available_float ?? "—"}
              icon={<LuWallet />}
              iconClassName="bg-amber-50 text-amber-500"
              isLoading={floatPending}
            />
          )}
        </div>
      )}

      {canSeeWriters && (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm">
            <LuUsers className="size-4 text-zinc-400" />
            <span className="font-semibold tabular-nums text-foreground">
              {tradingCount}
            </span>
            <span className="text-muted-foreground">retailers trading</span>
          </div>
          <SearchInput
            className="sm:max-w-xs"
            placeholder="Search by name, phone or email"
            value={searchTerm}
            onChange={(v) => {
              setSearchTerm(v);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {canSeeWriters && (
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="h-full">
            <CustomTable
              columns={[
                { key: "retailer", label: "Retailer", sortable: true },
                { key: "topUp", label: "Top-Up", sortable: true },
                { key: "sales", label: "Sales", sortable: false },
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

export default SecondSalesSegment;
