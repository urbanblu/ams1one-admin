"use client";

import { Popover } from "@heroui/react";
import {
  Avatar,
  Button,
  AppBarActions,
  PageShell,
  StatusBadge,
} from "@/components/ui";
import { Suspense } from "react";
import FilterRetailers from "./_components/filter-retailers";
import CustomTable, { TableRow } from "@/components/custom-table";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NewRetailerDrawer from "./_components/new-retailer-drawer";
import DeviceMapDrawer from "./_components/device-map-drawer";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import WritersService from "@/api/writers";
import { formatUsd } from "@/utils/currency";
import { usePageAccess } from "@/hooks/use-page-access";
import {
  LuMap,
  LuChevronDown,
  LuShieldOff,
  LuShieldCheck,
} from "react-icons/lu";
import ToastService from "@/utils/toast-service";
import ApiError from "@/utils/api_error";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function WriterActionMenu({
  writerId,
  status,
  onDone,
}: {
  writerId: string;
  status: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const isBlocked = status === "inactive" || status === "no_use";

  const { mutate: block, isPending: blocking } = useMutation({
    mutationFn: () => WritersService.blockWriter(writerId),
    onSuccess: () => {
      ToastService.success({ text: "Writer blocked successfully." });
      void qc.invalidateQueries({ queryKey: ["writers", "all"] });
      setOpen(false);
      onDone();
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Failed to block writer." });
    },
  });

  const { mutate: unblock, isPending: unblocking } = useMutation({
    mutationFn: () => WritersService.unblockWriter(writerId),
    onSuccess: () => {
      ToastService.success({ text: "Writer unblocked successfully." });
      void qc.invalidateQueries({ queryKey: ["writers", "all"] });
      setOpen(false);
      onDone();
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Failed to unblock writer." });
    },
  });

  const isPending = blocking || unblocking;

  return (
    <Popover isOpen={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground"
        >
          <span className="text-xs font-medium">Actions</span>
          <LuChevronDown className="size-3" />
        </button>
      </Popover.Trigger>
      <Popover.Content className="w-44 rounded-lg border border-border p-1.5 shadow-overlay">
        <Popover.Dialog className="p-0">
          {isBlocked ? (
            <button
              disabled={isPending}
              onClick={(e) => {
                e.stopPropagation();
                unblock();
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
            >
              <LuShieldCheck className="size-3.5 shrink-0" />
              {unblocking ? "Unblocking…" : "Unblock writer"}
            </button>
          ) : (
            <button
              disabled={isPending}
              onClick={(e) => {
                e.stopPropagation();
                block();
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-50"
            >
              <LuShieldOff className="size-3.5 shrink-0" />
              {blocking ? "Blocking…" : "Block writer"}
            </button>
          )}
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function RetailersView() {
  const { hasPage } = usePageAccess();
  const canRegister = hasPage("writers.register");
  const canViewProfile = hasPage("writers.profile");

  const [mapOpen, setMapOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);
  const searchParams = useSearchParams();
  const router = useRouter();

  const nameParam = searchParams.get("name") ?? "";
  const phoneParam = searchParams.get("phone") ?? "";
  const search = [nameParam, phoneParam].filter(Boolean).join(" ").trim();

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["writers", "all", currentPage, currentPageSize, search],
    queryFn: () =>
      WritersService.fetchAllWriters({
        page: currentPage,
        page_size: currentPageSize,
        search: search || undefined,
      }),
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setCurrentPageSize(size);
    setCurrentPage(1);
  };

  const handleSort = (column: string, direction: "asc" | "desc") => {
    void column;
    void direction;
  };

  const rows = data?.results ?? [];

  const handleRowClick = (_row: TableRow, index: number) => {
    if (!canViewProfile) return;
    const w = rows[index];
    if (w) router.push(`/writers/${w.id}`);
  };
  const pagination = data
    ? {
        pageNumber: currentPage,
        pageSize: currentPageSize,
        totalCount: data.count,
      }
    : { pageNumber: 1, pageSize: currentPageSize, totalCount: 0 };

  const tableData: TableRow[] = rows.map((w) => {
    const ytdSales = parseFloat(w.ytd_sales);
    const ytdTop = parseFloat(w.ytd_topups);
    return {
      id: (
        <span className="font-medium tabular-nums text-foreground">
          {w.writer_id}
        </span>
      ),
      name: (
        <div className="flex items-center gap-2.5">
          <Avatar name={w.name} src={w.photo_url ?? undefined} size="sm" />
          <span className="truncate font-medium text-foreground">{w.name}</span>
        </div>
      ),
      contact: <span className="tabular-nums">{w.phone}</span>,
      signUpDate: formatDate(w.created_at),
      dop: <span className="tabular-nums">{w.days_on_task}</span>,
      dot: <span className="tabular-nums">{w.days_on_task}</span>,
      ytdSales: (
        <span className="font-medium tabular-nums text-foreground">
          {formatUsd(Number.isFinite(ytdSales) ? ytdSales : 0)}
        </span>
      ),
      ytdTopUps: (
        <span className="font-medium tabular-nums text-foreground">
          {formatUsd(Number.isFinite(ytdTop) ? ytdTop : 0)}
        </span>
      ),
      lastTransDate: w.last_transaction ? formatDate(w.last_transaction) : "—",
      status: <StatusBadge status={w.status} />,
      actions: (
        <div onClick={(e) => e.stopPropagation()}>
          <WriterActionMenu
            writerId={w.id}
            status={w.status}
            onDone={() => {}}
          />
        </div>
      ),
    };
  });

  return (
    <PageShell fill>
      {/* The registered count that used to sit under the title is already in
          the table's own footer, so it is not repeated here. */}
      <AppBarActions>
        <Button variant="outline" size="sm" onClick={() => setMapOpen(true)}>
          <LuMap />
          Show map
        </Button>
        <FilterRetailers onFilterTap={() => setCurrentPage(1)} />
        {canRegister && <NewRetailerDrawer />}
      </AppBarActions>

      <DeviceMapDrawer isOpen={mapOpen} onClose={() => setMapOpen(false)} />

      <div className="min-h-0 sm:h-full sm:flex-1">
        <div className="h-full overflow-hidden">
          <CustomTable
            columns={[
              { key: "id", label: "ID #", sortable: true },
              { key: "name", label: "Name", sortable: true },
              { key: "contact", label: "Contact", sortable: false },
              { key: "signUpDate", label: "Sign-up date", sortable: true },
              { key: "dop", label: "DoP", sortable: false },
              { key: "dot", label: "DoT", sortable: false },
              {
                key: "ytdSales",
                label: "YTD sales",
                sortable: false,
                align: "right",
              },
              {
                key: "ytdTopUps",
                label: "YTD top-ups",
                sortable: false,
                align: "right",
              },
              {
                key: "lastTransDate",
                label: "Last trans date",
                sortable: false,
              },
              { key: "status", label: "Status", sortable: false },
              { key: "actions", label: "", sortable: false },
            ]}
            data={tableData}
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
      </div>
    </PageShell>
  );
}

export default function WritersPage() {
  return (
    <Suspense>
      <RetailersView />
    </Suspense>
  );
}
