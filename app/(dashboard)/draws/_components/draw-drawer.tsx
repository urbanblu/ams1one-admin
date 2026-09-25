"use client";

import { drawerDialogClass, drawerWidth } from "@/components/ui";

import CustomTable, { TableRow } from "@/components/custom-table";
import { CloseButton, cn, Drawer, Table } from "@heroui/react";
import React from "react";
import { useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import { useQuery } from "@tanstack/react-query";
import GamesService from "@/api/games";
import { formatGhs, parseStakeAmount } from "@/utils/currency";

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
      <Drawer.Content
        placement="right"
        className={drawerWidth.wide}
      >
        <Drawer.Dialog className={cn(drawerDialogClass, "w-full")}>
          <Drawer.Header>
            <div className="flex justify-between items-center">
              <Drawer.Heading className="text-sm font-semibold">
                {drawerMode === "post1"
                  ? "Post Draw I"
                  : drawerMode === "post2"
                    ? "Post Draw II"
                    : "Pre Draw Tickets"}
              </Drawer.Heading>
              <CloseButton
                className="bg-transparent text-black"
                onClick={onCloseTap}
              />
            </div>
          </Drawer.Header>
          <Drawer.Body>
            {showPostPlaceholder ? (
              <div className="p-6 text-sm text-muted-foreground">
                Post-draw ticket detail is not available from the API yet. Use
                the live endpoint when it is published.
              </div>
            ) : (
              <div className="flex flex-col space-y-5 sm:h-[calc(100vh-6rem)] sm:overflow-hidden">
                <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface">
                  {/* Gradient header */}
                  <div className="bg-brand-gradient px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-white/60 uppercase tracking-wider">
                          Event
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-lg font-semibold tabular-nums text-white leading-none">
                            #{event?.event_no ?? "—"}
                          </span>
                          <span className="text-[11px] font-normal text-white/70 truncate max-w-[140px]">
                            {event?.event_name ?? ""}
                          </span>
                        </div>
                      </div>
                      {/* Draw numbers */}
                      <div className="flex flex-wrap gap-1.5 justify-end pt-3">
                        {(event?.draw_numbers ?? []).map((n, i) => (
                          <span
                            key={i}
                            className="bg-white/20 text-white font-semibold tabular-nums text-xs px-2 py-1 rounded-md"
                          >
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Stats row */}
                  <div className="grid grid-cols-3 divide-x divide-border-subtle">
                    {[
                      {
                        label: "Total Wins",
                        value: event?.total_wins ?? "—",
                      },
                      {
                        label: "Payout Ratio",
                        value: event?.payout_ratio ?? "—",
                      },
                      {
                        label: "Date & Time",
                        value: event
                          ? `${event.draw_date} ${event?.draw_time ? `@ ${event?.draw_time}` : ""}`
                          : "—",
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex flex-col items-start px-4 py-3"
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                          {label}
                        </span>
                        <span className="text-xs font-semibold tabular-nums mt-0.5 truncate w-full">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-[500px] sm:h-full sm:flex-1 sm:min-h-0 mt-2">
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
                          label: "Stake Value",
                          sortable: false,
                        },
                        {
                          key: "Datetime",
                          label: "datetime",
                          sortable: true,
                        },
                        {
                          key: "stakedBy",
                          label: "Staked By",
                          sortable: false,
                        },
                        {
                          key: "phoneNumber",
                          label: "Phone Number",
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
                              className="hover:bg-surface-muted cursor-pointer"
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
                                        ? "font-semibold tabular-nums text-sm"
                                        : "",
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-2 w-full min-w-0">
                                      <span className="truncate flex-1 min-w-0 text-xs">
                                        {row[col.key]}
                                      </span>
                                      {col.key === "phoneNumber" && (
                                        <IoChevronDown
                                          size={15}
                                          className="shrink-0 cursor-pointer text-muted-foreground hover:text-black transition-colors"
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
                                <Table.Row className="bg-surface-muted/50">
                                  <Table.Cell
                                    colSpan={columns.length}
                                    className="p-0"
                                  >
                                    <div className="grid w-full grid-cols-6 border-b border-border-subtle px-4 py-3 pl-10">
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
                                          className="text-[10px] font-semibold text-muted-foreground uppercase"
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
                                      className="bg-surface-muted/50"
                                    >
                                      <Table.Cell
                                        colSpan={columns.length}
                                        className="p-0"
                                      >
                                        <div className="grid grid-cols-6 w-full min-w-0 py-3 px-6 hover:bg-white transition-colors border-b border-border-subtle pl-10">
                                          <span className="text-xs font-normal min-w-0 block truncate pr-2">
                                            {ticketNo ?? "—"}
                                          </span>
                                          <span className="text-xs font-normal min-w-0 block truncate pr-2">
                                            {st.play}
                                          </span>
                                          <div>
                                            <div className="flex gap-2 items-center flex-wrap mr-0.5">
                                              {nums.map((num, ni) => (
                                                <span
                                                  key={ni}
                                                  className="rounded bg-primary text-white p-1 px-1.5 text-xs font-medium"
                                                >
                                                  {num}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          <span className="text-xs font-semibold tabular-nums">
                                            {MOCK_STAKE_TIME}
                                          </span>
                                          <span className="text-xs font-semibold tabular-nums">
                                            {formatGhs(
                                              parseStakeAmount(st.stake_amount),
                                            )}
                                          </span>
                                          <span className="text-xs font-semibold tabular-nums">
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
