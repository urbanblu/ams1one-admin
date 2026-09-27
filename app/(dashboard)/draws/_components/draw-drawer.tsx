"use client";

import {
  DrawerTitleBar,
  drawerBodyClass,
  drawerDialogClass,
  drawerWidth,
  NumberBall,
} from "@/components/ui";

import CustomTable, { TableRow } from "@/components/custom-table";
import { cn, Drawer, Table } from "@heroui/react";
import React from "react";
import { useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import { useQuery } from "@tanstack/react-query";
import GamesService from "@/api/games";
import { formatUsd, parseStakeAmount } from "@/utils/currency";

const MOCK_STAKE_TIME = "12:45:01 PM";
const MOCK_WINNING = "USD 0.00";

type DrawerMode = "pre" | "post1" | "post2" | null;

function DrawDrawer({
  isOpen,
  onCloseTap,
  eventId,
  drawerMode,
}: {
  isOpen: boolean;
  onCloseTap: () => void;
  eventId: string | null;
  drawerMode: DrawerMode;
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [openedRows, setOpenedRows] = useState<number[]>([]);
  const [currentPageSize, setCurrentPageSize] = useState(20);

  const fetchPreTickets = drawerMode === "pre" && !!eventId && isOpen;

  const { data: ticketPayload, isPending } = useQuery({
    queryKey: [
      "games",
      "draw-event-tickets",
      eventId,
      currentPage,
      currentPageSize,
    ],
    queryFn: () =>
      GamesService.fetchDrawEventTickets(eventId!, {
        page: currentPage,
        page_size: currentPageSize,
      }),
    enabled: fetchPreTickets,
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

  const handleRowExpansion = (index: number) => {
    setOpenedRows((state) => {
      if (state.includes(index)) {
        return state.filter((i) => i !== index);
      }
      return [...state, index];
    });
  };

  const event = ticketPayload?.event;
  const tickets = ticketPayload?.tickets;
  const results = tickets?.results ?? [];

  const pagination = tickets
    ? {
        pageNumber: currentPage,
        pageSize: currentPageSize,
        totalCount: tickets.count,
      }
    : { pageNumber: 1, pageSize: currentPageSize, totalCount: 0 };

  const ticketMeta = results.map((t) => ({
    stakes: t.stakes,
    ticketNo: t.ticket_no,
  }));

  const tableRows: TableRow[] = results.map((t) => ({
    ticket: t.ticket_no,
    stake: String(t.stake_count),
    stakeValue: t.stake_value,
    Datetime: t.datetime,
    stakedBy: t.staked_by,
    phoneNumber: t.phone_number,
  }));

  const showPostPlaceholder =
    isOpen && (drawerMode === "post1" || drawerMode === "post2");

  return (
    <Drawer.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onCloseTap();
      }}
      isDismissable={true}
    >
      <Drawer.Content placement="right">
        <Drawer.Dialog className={cn(drawerDialogClass, drawerWidth.wide)}>
          <DrawerTitleBar
            title={
              drawerMode === "post1"
                ? "Post Draw I"
                : drawerMode === "post2"
                  ? "Post Draw II"
                  : "Pre Draw Tickets"
            }
            onClose={onCloseTap}
          />
          <Drawer.Body className={drawerBodyClass}>
            {showPostPlaceholder ? (
              <div className="text-sm text-foreground-light">
                Post-draw ticket detail is not available from the API yet. Use
                the live endpoint when it is published.
              </div>
            ) : (
              <div className="flex flex-col space-y-5 sm:h-[calc(100vh-6rem)] sm:overflow-hidden">
                <div className="overflow-hidden rounded-lg border border-border bg-surface">
                  {/* Header strip */}
                  <div className="border-b border-border bg-surface-100 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-foreground-light">
                          Event
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-ident text-lg font-medium leading-none tabular-nums text-foreground">
                            #{event?.event_no ?? "—"}
                          </span>
                          <span className="max-w-[140px] truncate text-xs font-normal text-foreground-light">
                            {event?.event_name ?? ""}
                          </span>
                        </div>
                      </div>
                      {/* Draw numbers */}
                      <div className="flex flex-wrap gap-1.5 justify-end pt-3">
                        {(event?.draw_numbers ?? []).map((n, i) => (
                          <span
                            key={i}
                            className="font-ident rounded-md border border-brand-300 bg-brand-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-brand-800"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Stats row */}
                  <div className="grid grid-cols-3 divide-x divide-border">
                    {[
                      {
                        label: "Total wins",
                        value: event?.total_wins ?? "—",
                      },
                      {
                        label: "Payout ratio",
                        value: event?.payout_ratio ?? "—",
                      },
                      {
                        label: "Date & time",
                        value: event
                          ? `${event.draw_date} ${event?.draw_time ? `@ ${event?.draw_time}` : ""}`
                          : "—",
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex flex-col items-start px-4 py-3"
                      >
                        <span className="text-xs font-medium text-foreground-light">
                          {label}
                        </span>
                        <span className="text-xs font-medium tabular-nums mt-0.5 truncate w-full">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="min-h-0 sm:h-full sm:flex-1 mt-3">
                  <div className="h-full overflow-hidden">
                    <CustomTable
                      columns={[
                        {
                          key: "ticket",
                          label: "Ticket #",
                          sortable: false,
                        },
                        {
                          key: "stake",
                          label: "Stake",
                          sortable: false,
                        },
                        {
                          key: "stakeValue",
                          label: "Stake value",
                          sortable: false,
                        },
                        {
                          key: "Datetime",
                          label: "datetime",
                          sortable: true,
                        },
                        {
                          key: "stakedBy",
                          label: "Staked by",
                          sortable: false,
                        },
                        {
                          key: "phoneNumber",
                          label: "Phone number",
                          sortable: false,
                        },
                      ]}
                      data={tableRows}
                      pagination={pagination}
                      onRender={(row, index, columns) => {
                        const meta = ticketMeta[index];
                        const stakes = meta?.stakes;
                        const ticketNo = meta?.ticketNo;
                        return (
                          <React.Fragment key={index}>
                            <Table.Row
                              id={`row-${index}`}
                              className="cursor-pointer hover:bg-surface-100"
                            >
                              {columns.map((col) => (
                                <Table.Cell key={col.key}>
                                  <div
                                    className={cn(
                                      "flex justify-between items-center",
                                      [
                                        "stakeValue",
                                        "stake",
                                        "stackedBy",
                                        "phoneNumber",
                                      ].includes(col.key)
                                        ? "font-medium tabular-nums text-sm"
                                        : "",
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-2 w-full min-w-0">
                                      <span className="truncate flex-1 min-w-0 text-xs">
                                        {row[col.key]}
                                      </span>
                                      {col.key === "phoneNumber" && (
                                        <LuChevronDown
                                          className="size-3.5 shrink-0 cursor-pointer text-foreground-muted transition-colors hover:text-foreground"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRowExpansion(index);
                                          }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </Table.Cell>
                              ))}
                            </Table.Row>
                            {openedRows.includes(index) && stakes && (
                              <>
                                <Table.Row className="bg-surface-100">
                                  <Table.Cell
                                    colSpan={columns.length}
                                    className="p-0"
                                  >
                                    <div className="grid w-full grid-cols-6 border-b border-border-subtle py-3 pr-5 pl-10">
                                      {[
                                        "Ticket #",
                                        "Play",
                                        "Stake",
                                        "Stake Time",
                                        "Stake Amount",
                                        "Winning",
                                      ].map((header, hIndex) => (
                                        <span
                                          key={hIndex}
                                          className="text-xs font-medium text-foreground-light"
                                        >
                                          {header}
                                        </span>
                                      ))}
                                    </div>
                                  </Table.Cell>
                                </Table.Row>
                                {stakes.map((st) => {
                                  const nums = st.numbers
                                    .split(",")
                                    .map((x) => x.trim());
                                  return (
                                    <Table.Row
                                      key={st.stake_id}
                                      className="bg-surface-100"
                                    >
                                      <Table.Cell
                                        colSpan={columns.length}
                                        className="p-0"
                                      >
                                        <div className="grid w-full min-w-0 grid-cols-6 border-b border-border-subtle py-3 pr-5 pl-10 transition-colors hover:bg-surface">
                                          <span className="text-xs font-normal min-w-0 block truncate pr-2">
                                            {ticketNo ?? "—"}
                                          </span>
                                          <span className="text-xs font-normal min-w-0 block truncate pr-2">
                                            {st.play}
                                          </span>
                                          <div>
                                            <div className="flex gap-2 items-center flex-wrap mr-0.5">
                                              {nums.map((num, ni) => (
                                                <NumberBall
                                                  key={ni}
                                                  variant="solid"
                                                  size="sm"
                                                >
                                                  {num}
                                                </NumberBall>
                                              ))}
                                            </div>
                                          </div>
                                          <span className="text-xs font-medium tabular-nums">
                                            {MOCK_STAKE_TIME}
                                          </span>
                                          <span className="text-xs font-medium tabular-nums">
                                            {formatUsd(
                                              parseStakeAmount(st.stake_amount),
                                            )}
                                          </span>
                                          <span className="text-xs font-medium tabular-nums">
                                            {MOCK_WINNING}
                                          </span>
                                        </div>
                                      </Table.Cell>
                                    </Table.Row>
                                  );
                                })}
                              </>
                            )}
                          </React.Fragment>
                        );
                      }}
                      pageSize={currentPageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      onRowClick={handleRowClick}
                      onSort={handleSort}
                      loading={fetchPreTickets && isPending}
                      isRefetching={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

export default DrawDrawer;
