"use client";

import CustomTable, { TableRow } from "@/components/custom-table";
import { Avatar, PageHeader, SearchInput, StatTile } from "@/components/ui";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import PlayersService from "@/api/players";
import { formatGhs } from "@/utils/currency";
import { LuUsers, LuActivity, LuTicket, LuWallet } from "react-icons/lu";
import { usePageAccess } from "@/hooks/use-page-access";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const GAME = "dollar-rush" as const;

function DollarRushPlayersView() {
  const { hasPage } = usePageAccess();
  const canSeeStats = hasPage("players.dollar_rush.stats");
  const canSeeDetail = hasPage("players.dollar_rush.detail");

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const { data: stats, isPending: statsPending } = useQuery({
    queryKey: ["players", GAME, "stats"],
    queryFn: () => PlayersService.fetchPlayerStats(GAME),
  });

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["players", GAME, "list", currentPage, currentPageSize, search],
    queryFn: () =>
      PlayersService.fetchPlayerList(GAME, {
        page: currentPage,
        page_size: currentPageSize,
        search: search || undefined,
      }),
  });

  const rows = data?.results ?? [];

  const pagination = data
    ? {
        pageNumber: currentPage,
        pageSize: currentPageSize,
        totalCount: data.count,
      }
    : { pageNumber: 1, pageSize: currentPageSize, totalCount: 0 };

  const tableData: TableRow[] = rows.map((p) => {
    return {
      name: (
        <div className="flex items-center gap-2.5">
          <Avatar name={p.full_name} size="sm" />
          <span className="truncate font-medium text-foreground">
            {p.full_name}
          </span>
        </div>
      ),
      phone: <span className="tabular-nums">{p.phone}</span>,
      email: <span className="truncate">{p.email || "—"}</span>,
      balance: (
        <span className="font-semibold tabular-nums text-foreground">
          {p.wallet ? formatGhs(parseFloat(p.wallet.balance)) : "—"}
        </span>
      ),
      deposited: (
        <span className="font-semibold tabular-nums text-foreground">
          {p.wallet ? formatGhs(parseFloat(p.wallet.total_deposited)) : "—"}
        </span>
      ),
      won: (
        <span className="font-semibold tabular-nums text-foreground">
          {p.wallet ? formatGhs(parseFloat(p.wallet.total_won)) : "—"}
        </span>
      ),
      joined: formatDate(p.joined),
    };
  });

  const wt = stats?.wallet_totals;

  return (
    <div className="flex flex-col gap-5 px-5 py-6 lg:px-8 lg:py-7 md:h-full md:overflow-hidden">
      <PageHeader
        className="shrink-0"
        title="Dollar Rush players"
        description={
          data
            ? `${data.count.toLocaleString("en-US")} registered players`
            : undefined
        }
        actions={
          <SearchInput
            className="w-full sm:w-72"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(v) => {
              setSearch(v);
              setCurrentPage(1);
            }}
          />
        }
      />

      <div className="flex h-full flex-col gap-4">
        {canSeeStats && (
          <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              icon={<LuUsers />}
              iconClassName="bg-primary-soft text-primary"
              label="Total players"
              value={stats?.total_players?.toLocaleString() ?? "—"}
              isLoading={statsPending}
            />
            <StatTile
              icon={<LuActivity />}
              iconClassName="bg-emerald-50 text-emerald-500"
              label="Active today"
              value={stats?.active_today?.toLocaleString() ?? "—"}
              isLoading={statsPending}
            />
            <StatTile
              icon={<LuTicket />}
              iconClassName="bg-amber-50 text-amber-500"
              label="Tickets today"
              value={stats?.tickets_today?.toLocaleString() ?? "—"}
              isLoading={statsPending}
            />
            <StatTile
              icon={<LuWallet />}
              iconClassName="bg-blue-50 text-blue-500"
              label="Total balance"
              value={wt ? formatGhs(parseFloat(wt.total_balance)) : "—"}
              isLoading={statsPending}
            />
          </div>
        )}

        <div className="h-[500px] md:flex-1 md:min-h-0 overflow-hidden">
          <div className="h-full overflow-hidden">
            <CustomTable
              columns={[
                { key: "name", label: "Name", sortable: false },
                { key: "phone", label: "Phone", sortable: false },
                { key: "email", label: "Email", sortable: false },
                { key: "balance", label: "Balance", sortable: false },
                { key: "deposited", label: "Total Deposited", sortable: false },
                { key: "won", label: "Total Won", sortable: false },
                { key: "joined", label: "Joined", sortable: false },
              ]}
              data={tableData}
              pagination={pagination}
              pageSize={currentPageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={() => {}}
              onRowClick={(_row, index) => {
                if (!canSeeDetail) return;
                const p = rows[index];
                if (p) router.push(`/players/${p.id}?game=${GAME}`);
              }}
              onSort={() => {}}
              loading={isPending}
              isRefetching={isFetching}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DollarRushPlayersView;
