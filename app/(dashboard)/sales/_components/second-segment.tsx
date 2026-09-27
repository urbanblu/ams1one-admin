"use client";

import CustomTable, { TableRow } from "@/components/custom-table";
import {
  Avatar,
  HeroDivider,
  HeroFact,
  HeroLedger,
  HeroPanel,
  HeroScope,
  HeroStat,
  ScopeFact,
  ScopeLabel,
  ScopeLine,
  SearchInput,
} from "@/components/ui";
import type { HeroLedgerEntry } from "@/components/ui";
import { useMemo, useState } from "react";
import { LuUsers, LuWallet } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import WritersService from "@/api/writers";
import FinancialsService from "@/api/financials";
import { usePageAccess } from "@/hooks/use-page-access";
import { formatTradingDay } from "@/utils/date";

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

  const { data: writersAtWork, isPending: atWorkPending } = useQuery({
    queryKey: ["financials", "writers-at-work"],
    queryFn: FinancialsService.fetchWritersAtWorkCard,
  });

  const loading = statsPending || topUpPending || floatPending;

  /* ---- The roster, as the server counts it. Whole field, not this page. -- */

  const topUpAmount = todayTopUp?.total_topup_amount ?? 0;
  const topUpCount = todayTopUp?.topup_count ?? 0;
  const floatAmount = availableFloat?.available_float_amount ?? 0;
  const tradingDay = formatTradingDay(todayTopUp?.date);

  const activeWriters = writersAtWork?.active_writers ?? 0;
  const totalWriters = writersAtWork?.total_writers ?? 0;
  const idleWriters = Math.max(0, totalWriters - activeWriters);

  /* What the float is made of: the day it was last added to, and what went
     out today. Top-ups feed the float, so they read under it rather than
     across the panel from it. */
  const floatScope: React.ReactNode[] = [
    canSeeTopUp && tradingDay ? (
      <span className="text-white/70">{tradingDay}</span>
    ) : null,
    canSeeTopUp ? (
      topUpAmount > 0 ? (
        <HeroFact value={todayTopUp?.total_topup} label="topped up today" />
      ) : (
        <span>No top-ups yet today</span>
      )
    ) : null,
    canSeeTopUp && topUpCount > 0 ? (
      <HeroFact
        value={topUpCount.toLocaleString("en-US")}
        label={topUpCount === 1 ? "top-up" : "top-ups"}
      />
    ) : null,
  ];

  /* The top-up figure standing on its own, for someone not cleared to see
     the float it feeds. */
  const topUpScope: React.ReactNode[] = [
    tradingDay ? <span className="text-white/70">{tradingDay}</span> : null,
    topUpCount > 0 ? (
      <HeroFact
        value={topUpCount.toLocaleString("en-US")}
        label={topUpCount === 1 ? "top-up" : "top-ups"}
      />
    ) : (
      <span>No top-ups yet</span>
    ),
  ];

  /* Who is actually out selling. A count on its own says little — seven is
     good on a roster of nine and dire on a roster of two hundred — so the
     roster is the track and the two shares are read against it. */
  const rosterEntries: HeroLedgerEntry[] = useMemo(() => {
    const share = (n: number) => (totalWriters > 0 ? n / totalWriters : 0);

    return [
      {
        key: "trading",
        label: "Trading",
        value: activeWriters.toLocaleString("en-US"),
        hint:
          totalWriters > 0
            ? `${Math.round((activeWriters / totalWriters) * 100)}% of the roster`
            : undefined,
        share: share(activeWriters),
        tone: "brand",
      },
      {
        key: "idle",
        label: "Idle",
        value: idleWriters.toLocaleString("en-US"),
        hint: "yet to sell today",
        share: share(idleWriters),
        tone: "muted",
      },
    ];
  }, [activeWriters, idleWriters, totalWriters]);

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
            <span className="mt-0.5 text-xs text-foreground-muted">
              {row.writer.contact.phone}
            </span>
          </div>
        </div>
      ),
      topUp: (
        <span className="font-medium tabular-nums text-foreground">
          {row.topup}
        </span>
      ),
      sales: (
        <span className="font-medium tabular-nums text-foreground">
          {row.sales}
        </span>
      ),
    };
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* What is out with retailers and who is out selling it. Both are
          whole-field figures the server computed — nothing here is derived
          from the page of retailers below. */}
      {(canSeeTopUp || canSeeFloat) && (
        <HeroPanel padded={false} className="shrink-0">
          <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-stretch lg:gap-8">
            {canSeeFloat ? (
              <HeroStat
                className="lg:flex-[2]"
                icon={<LuWallet />}
                label="Available float"
                value={availableFloat?.available_float ?? "—"}
                scope={
                  floatScope.some(Boolean) ? (
                    <HeroScope facts={floatScope} />
                  ) : undefined
                }
                /* True, but not news — an empty field should read as quiet
                   rather than as a figure worth shouting. */
                isMuted={!floatPending && floatAmount === 0}
                isLoading={floatPending}
              />
            ) : (
              <HeroStat
                className="lg:flex-[2]"
                icon={<LuWallet />}
                label="Today’s top-up"
                value={todayTopUp?.total_topup ?? "—"}
                scope={<HeroScope facts={topUpScope} />}
                isMuted={!topUpPending && topUpAmount === 0}
                isLoading={topUpPending}
              />
            )}

            {canSeeWriters && (
              <>
                <HeroDivider />
                <HeroLedger
                  className="lg:flex-[3]"
                  icon={<LuUsers />}
                  label="Retailers at work"
                  entries={rosterEntries}
                  isLoading={atWorkPending}
                  isEmpty={!atWorkPending && totalWriters === 0}
                  empty={
                    <p className="max-w-xs text-xs leading-relaxed text-white/45">
                      No retailers on the roster yet. Once writers are signed
                      up, this splits them into who is trading today and who is
                      not.
                    </p>
                  }
                />
              </>
            )}
          </div>
        </HeroPanel>
      )}

      {/* The table's own toolbar. Everything on this line is measured from
          the rows currently loaded, so it says so once, on the left. */}
      {canSeeWriters && (
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ScopeLine
            facts={[
              <ScopeLabel key="label" icon={<LuUsers />}>
                On this page
              </ScopeLabel>,
              searchTerm.trim() ? (
                <span key="count" className="text-foreground-light">
                  <span className="font-medium tabular-nums text-foreground">
                    {paged.length.toLocaleString("en-US")}
                  </span>
                  {" of "}
                  <span className="font-medium tabular-nums text-foreground">
                    {writers.length.toLocaleString("en-US")}
                  </span>
                  {" retailers"}
                </span>
              ) : (
                <ScopeFact
                  key="count"
                  value={paged.length.toLocaleString("en-US")}
                  label={paged.length === 1 ? "retailer" : "retailers"}
                />
              ),
            ]}
          />
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
                {
                  key: "topUp",
                  label: "Top-Up",
                  sortable: true,
                  align: "right",
                },
                {
                  key: "sales",
                  label: "Sales",
                  sortable: false,
                  align: "right",
                },
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
