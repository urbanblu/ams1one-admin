"use client";

import CustomTable, { TableRow } from "@/components/custom-table";
import { Tabs } from "@heroui/react";
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

  const transactionColumns = [
    { key: "createdAt", label: "Date", sortable: false },
    { key: "type", label: "Type", sortable: false },
    { key: "writer", label: "Writer", sortable: false },
    { key: "reference", label: "Reference", sortable: false },
    { key: "amount", label: "Amount", sortable: false },
  ];

  const writerColumns = [
    { key: "name", label: "Name", sortable: false },
    { key: "contact", label: "Contact", sortable: false },
    { key: "location", label: "Location", sortable: false },
    { key: "dot", label: "DoT", sortable: false },
    { key: "ytd_sales", label: "YTD Sales", sortable: false },
    { key: "ytd_topups", label: "YTD Top-ups", sortable: false },
    { key: "status", label: "Status", sortable: false },
  ];

  const transactionRows: TableRow[] = useMemo(
    () =>
      (transactionsData?.results ?? []).map((row) => ({
        createdAt: <span className="text-xs">{row.created_at}</span>,
        type: (
          <span
            className={`text-xs capitalize font-medium ${row.is_credit ? "text-emerald-600" : "text-rose-500"}`}
          >
            {row.type}
          </span>
        ),
        writer: (
          <div className="flex flex-col min-w-0">
            <span className="text-xs truncate">{row.writer_name}</span>
            {row.writer_phone && (
              <span className="text-[10px] text-muted-foreground">
                {row.writer_phone}
              </span>
            )}
          </div>
        ),
        reference: (
          <span className="text-xs text-muted-foreground">
            {row.reference ?? "—"}
          </span>
        ),
        amount: (
          <span
            className={`text-xs font-semibold tabular-nums ${row.is_credit ? "text-emerald-600" : "text-rose-500"}`}
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
          <span className="text-xs font-semibold tabular-nums">
            USD {row.ytd_sales}
          </span>
        ),
        ytd_topups: (
          <span className="text-xs font-semibold tabular-nums">
            USD {row.ytd_topups}
          </span>
        ),
        status: (
          <span className="text-xs capitalize font-medium">
            {row.status.replace("_", " ")}
          </span>
        ),
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
    <div className="rounded-2xl border border-border-subtle bg-surface p-5">
      <span className="font-bold">{type}</span>
      <div className="flex flex-col sm:flex-row items-center sm:justify-between mt-3">
        <Tabs
          className="max-w-full flex-wrap"
          variant="primary"
          selectedKey={tab}
          onSelectionChange={(key) => handleTabChange(key.toString())}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Options" className="gap-1 rounded-2xl p-1">
              {tabs.map((i) => (
                <Tabs.Tab
                  className="h-9 whitespace-nowrap rounded-xl px-4 text-sm font-medium"
                  id={i}
                  key={i}
                >
                  {i}
                  <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>
      {type != "Agents" && (
        <CustomTable
          key={tab}
          className="py-3"
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
        <div className="w-full justify-center flex text-xs pb-96 mt-2">
          Content coming soon
        </div>
      )}
    </div>
  );
}

export default LmcDetailTable;
