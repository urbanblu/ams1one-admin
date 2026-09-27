"use client";

import CustomTable, { TableColumn, TableRow } from "@/components/custom-table";
import { SegmentedControl, StatusBadge } from "@/components/ui";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import LmcService from "@/api/lmc";

type Props = {
  type: "Transactions" | "Writers" | "Agents";
  tabs: string[];
  lmcId: string;
};

const TRANSACTION_TAB_MAP: Record<string, string | undefined> = {
  "View All": undefined,
  Commissions: "commission",
  "Top-ups": "topup",
  Transfers: "transfer",
};

const WRITER_STATUS_MAP: Record<string, string | undefined> = {
  "View All": undefined,
  Active: "active",
  Passive: "passive",
  Inactive: "inactive",
  Recover: "recover",
  "No Use": "no_use",
};

function LmcDetailTable({ type, tabs, lmcId }: Props) {
  const [tab, setTab] = useState<string>(tabs[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);

  const transactionType = TRANSACTION_TAB_MAP[tab];
  const writerStatus = WRITER_STATUS_MAP[tab];

  const {
    data: transactionsData,
    isPending: transactionsPending,
    isFetching: transactionsFetching,
  } = useQuery({
    queryKey: ["lmc", lmcId, "transactions", tab, currentPage, currentPageSize],
    queryFn: () =>
      LmcService.fetchTransactions(lmcId, {
        type: transactionType,
        page: currentPage,
        page_size: currentPageSize,
      }),
    enabled: type === "Transactions" && !!lmcId,
  });

  const {
    data: writersData,
    isPending: writersPending,
    isFetching: writersFetching,
  } = useQuery({
    queryKey: [
      "lmc",
      lmcId,
      "writers-overview",
      tab,
      currentPage,
      currentPageSize,
    ],
    queryFn: () =>
      LmcService.fetchWritersOverview(lmcId, {
        status: writerStatus,
        page: currentPage,
        page_size: currentPageSize,
      }),
    enabled: type === "Writers" && !!lmcId,
  });

  const handleTabChange = (key: string) => {
    setTab(key);
    setCurrentPage(1);
  };

  const transactionColumns: TableColumn[] = [
    { key: "createdAt", label: "Date", sortable: false },
    { key: "type", label: "Type", sortable: false },
    { key: "writer", label: "Writer", sortable: false },
    { key: "reference", label: "Reference", sortable: false },
    { key: "amount", label: "Amount", sortable: false, align: "right" },
  ];

  const writerColumns: TableColumn[] = [
    { key: "name", label: "Name", sortable: false },
    { key: "contact", label: "Contact", sortable: false },
    { key: "location", label: "Location", sortable: false },
    { key: "dot", label: "DoT", sortable: false },
    { key: "ytd_sales", label: "YTD sales", sortable: false, align: "right" },
    {
      key: "ytd_topups",
      label: "YTD top-ups",
      sortable: false,
      align: "right",
    },
    { key: "status", label: "Status", sortable: false },
  ];

  const transactionRows: TableRow[] = useMemo(
    () =>
      (transactionsData?.results ?? []).map((row) => ({
        createdAt: (
          <span className="text-xs font-medium tabular-nums text-foreground">
            {row.created_at}
          </span>
        ),
        type: (
          <span
            className={`text-xs font-medium capitalize ${row.is_credit ? "text-emerald-700" : "text-rose-700"}`}
          >
            {row.type}
          </span>
        ),
        writer: (
          <div className="flex flex-col min-w-0">
            <span className="truncate text-xs text-foreground-light">
              {row.writer_name}
            </span>
            {row.writer_phone && (
              <span className="text-xs tabular-nums text-foreground-lighter">
                {row.writer_phone}
              </span>
            )}
          </div>
        ),
        reference: (
          <span className="text-xs tabular-nums text-foreground-light">
            {row.reference ?? "—"}
          </span>
        ),
        amount: (
          <span
            className={`text-xs font-semibold tabular-nums ${row.is_credit ? "text-emerald-700" : "text-rose-700"}`}
          >
            {row.is_credit ? "+" : "-"}USD {row.amount}
          </span>
        ),
      })),
    [transactionsData],
  );

  const writerRows: TableRow[] = useMemo(
    () =>
      (writersData?.results ?? []).map((row) => ({
        name: <span className="text-xs font-medium">{row.name}</span>,
        contact: (
          <span className="text-xs text-muted-foreground">{row.phone}</span>
        ),
        location: (
          <span className="text-xs text-muted-foreground">
            {row.location_address || "—"}
          </span>
        ),
        dot: <span className="text-xs">{row.dot}</span>,
        ytd_sales: (
          <span className="text-xs font-medium tabular-nums">
            USD {row.ytd_sales}
          </span>
        ),
        ytd_topups: (
          <span className="text-xs font-medium tabular-nums">
            USD {row.ytd_topups}
          </span>
        ),
        status: <StatusBadge status={row.status} />,
      })),
    [writersData],
  );

  const isTransactions = type === "Transactions";
  const isWriters = type === "Writers";

  const columns = isTransactions
    ? transactionColumns
    : isWriters
      ? writerColumns
      : transactionColumns;

  const tableData = isTransactions
    ? transactionRows
    : isWriters
      ? writerRows
      : [];

  const totalCount = isTransactions
    ? (transactionsData?.count ?? 0)
    : isWriters
      ? (writersData?.count ?? 0)
      : 0;

  const loading = isTransactions
    ? transactionsPending
    : isWriters
      ? writersPending
      : false;
  const isRefetching = isTransactions
    ? transactionsFetching
    : isWriters
      ? writersFetching
      : false;

  const pagination = {
    pageNumber: currentPage,
    pageSize: currentPageSize,
    totalCount,
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      {/* This sits under the page-level tab bar, so it reads as a filter row
          rather than a second navigation level. */}
      <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium text-foreground-light">
          {type}
        </span>
        <SegmentedControl
          className="self-start"
          segments={tabs.map((i) => ({ key: i, label: i }))}
          value={tab}
          onChange={handleTabChange}
        />
      </div>
      {type != "Agents" && (
        <CustomTable
          key={tab}
          addTableBorder={false}
          columns={columns}
          data={tableData}
          pagination={pagination}
          pageSize={currentPageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setCurrentPageSize(size);
            setCurrentPage(1);
          }}
          onRowClick={() => {}}
          onSort={() => {}}
          loading={loading}
          isRefetching={isRefetching}
        />
      )}
      {type == "Agents" && (
        <div className="flex w-full justify-center py-16 text-xs text-muted-foreground">
          Content coming soon
        </div>
      )}
    </div>
  );
}

export default LmcDetailTable;
