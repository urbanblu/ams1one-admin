"use client";

import CustomTable from "@/components/custom-table";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PlayersService, { type PlayerGame } from "@/api/players";
import { formatUsd } from "@/utils/currency";
import {
  LuArrowDownLeft,
  LuArrowUpRight,
  LuTicket,
  LuTrophy,
  LuRefreshCw,
} from "react-icons/lu";

const TX_META: Record<
  string,
  { label: string; color: string; Icon: React.ElementType; credit: boolean }
> = {
  deposit: {
    label: "Deposit",
    color: "text-emerald-700",
    Icon: LuArrowDownLeft,
    credit: true,
  },
  win_credit: {
    label: "Win credit",
    color: "text-emerald-700",
    Icon: LuTrophy,
    credit: true,
  },
  refund: {
    label: "Refund",
    color: "text-emerald-700",
    Icon: LuRefreshCw,
    credit: true,
  },
  ticket_purchase: {
    label: "Ticket purchase",
    color: "text-rose-700",
    Icon: LuTicket,
    credit: false,
  },
  withdrawal: {
    label: "Withdrawal",
    color: "text-rose-700",
    Icon: LuArrowUpRight,
    credit: false,
  },
};

import React from "react";

function TransactionsTable({
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
      "transactions",
      currentPage,
      currentPageSize,
    ],
    queryFn: () =>
      PlayersService.fetchPlayerTransactions(game, playerId, {
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
          { key: "type", label: "Type", sortable: false },
          { key: "description", label: "Description", sortable: false },
          { key: "amount", label: "Amount", sortable: false, align: "right" },
          {
            key: "balanceAfter",
            label: "Balance after",
            sortable: false,
            align: "right",
          },
          { key: "createdAt", label: "Date", sortable: false },
        ]}
        data={rows.map((r) => {
          const meta = TX_META[r.tx_type] ?? {
            label: r.tx_type.replace(/_/g, " "),
            color: "text-foreground-light",
            Icon: LuArrowDownLeft,
            credit: true,
          };
          const { Icon } = meta;
          return {
            type: (
              <div className="flex items-center gap-1.5">
                <Icon className={`size-3.5 shrink-0 ${meta.color}`} />
                <span
                  className={`text-xs font-medium capitalize ${meta.color}`}
                >
                  {meta.label}
                </span>
              </div>
            ),
            description: (
              <span className="block max-w-[180px] truncate text-xs text-foreground-light">
                {r.description}
              </span>
            ),
            amount: (
              <span
                className={`text-xs font-semibold tabular-nums ${meta.credit ? "text-emerald-700" : "text-rose-700"}`}
              >
                {meta.credit ? "+" : "−"}
                {formatUsd(parseFloat(r.amount))}
              </span>
            ),
            balanceAfter: (
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {formatUsd(parseFloat(r.balance_after))}
              </span>
            ),
            createdAt: new Date(r.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
          };
        })}
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

export default TransactionsTable;
