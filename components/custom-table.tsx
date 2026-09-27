"use client";

import { cn, Pagination, Table } from "@heroui/react";
import React, { useEffect, useState } from "react";
import NProgress from "nprogress";
import { IPagination } from "@/interfaces/general.interface";
import { LuChevronsUpDown } from "react-icons/lu";
import { EmptyState, Skeleton } from "@/components/ui";

/** Matches React Aria's SortDescriptor without depending on its nested package. */
type SortDescriptor = {
  column: string | number;
  direction: "ascending" | "descending";
};

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  /** Figures read as a column when they share a right edge. */
  align?: "left" | "right";
}

export interface TableRow {
  [key: string]: React.ReactNode;
}

export interface CustomTableProps {
  columns: TableColumn[];
  data: TableRow[];
  pageSize?: number;
  pagination?: IPagination;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onRowClick?: (row: TableRow, index: number) => void;
  onSort?: (column: string, direction: "asc" | "desc") => void;
  enablePagination?: boolean;
  onRender?: (
    row: TableRow,
    index: number,
    columns: TableColumn[],
  ) => React.ReactNode;
  loading?: boolean;
  isRefetching: boolean;
  emptyMessage?: string;
  /**
   * Replaces the default empty state. For when the page knows *why* the table
   * is empty — a filter it applied, a date with nothing in it — and can say so
   * and offer a way out, which "No data available" cannot.
   */
  emptyState?: React.ReactNode;
  className?: string;
  addTableBorder?: boolean;
}

function CustomTable({
  columns,
  data,
  pagination = {
    totalCount: 1,
    pageNumber: 1,
    pageSize: 1,
  },
  onPageChange,
  onRowClick,
  onSort,
  addTableBorder = true,
  onRender,
  enablePagination = true,
  loading = false,
  isRefetching = false,
  emptyMessage = "No data available",
  emptyState,
  className = "",
}: CustomTableProps) {
  const totalPages = pagination
    ? Math.ceil(pagination.totalCount / pagination.pageSize)
    : 1;

  const backendCurrentPage = pagination?.pageNumber || 1;
  const [internalCurrentPage, setInternalCurrentPage] =
    useState(backendCurrentPage);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const getVisiblePages = () => {
    if (totalPages <= 7) return pages;

    const current = internalCurrentPage;
    const visible: Array<number | "ellipsis-left" | "ellipsis-right"> = [1];

    const left = Math.max(2, current - 1);
    const right = Math.min(totalPages - 1, current + 1);

    if (left > 2) {
      visible.push("ellipsis-left");
    }

    for (let p = left; p <= right; p += 1) {
      visible.push(p);
    }

    if (right < totalPages - 1) {
      visible.push("ellipsis-right");
    }

    visible.push(totalPages);
    return visible;
  };

  const start = (internalCurrentPage - 1) * pagination.pageSize + 1;
  const end = Math.min(
    internalCurrentPage * pagination.pageSize,
    pagination.totalCount,
  );

  const handlePageChange = (page: number) => {
    setInternalCurrentPage(page);
    onPageChange?.(page);
  };

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor | null>(
    null,
  );

  const handleSortChange = (descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
    onSort?.(
      String(descriptor.column),
      descriptor.direction === "ascending" ? "asc" : "desc",
    );
  };

  useEffect(() => {
    if (isRefetching) {
      NProgress.start();
    } else {
      NProgress.done();
    }
    return () => {
      NProgress.done();
    };
  }, [isRefetching]);

  return (
    <div
      className={cn("flex min-w-0 flex-col sm:h-full sm:min-h-0", className)}
    >
      {/* The card takes the height it is given and the rows take what is left
          of it, so the footer sits on the bottom edge. The scroll area carries
          no max-height: a cap would stop it filling and leave the dead strip
          under the footer that this layout used to show. */}
      <Table
        className={cn(
          // HeroUI insets the root by 4px on three sides, which leaves a white
          // sliver around the header fill and a gap under the footer. In this
          // language a panel's header and footer meet its border, as Card's do.
          "flex w-full min-w-0 flex-col overflow-hidden rounded-lg bg-surface p-0 sm:h-full sm:min-h-0",
          addTableBorder && "border border-border",
        )}
      >
        {/* The scroll box is its own clipping context, so the card's radius
            does not reach the sticky header's fill — it has to carry the top
            corners itself or grey squares off against the rounded border. */}
        <Table.ScrollContainer className="w-full min-w-0 flex-1 overflow-x-auto overflow-y-auto rounded-t-lg sm:min-h-0">
          <Table.Content
            aria-label="Data table"
            sortDescriptor={sortDescriptor ?? undefined}
            onSortChange={handleSortChange}
            className={cn(
              "w-full min-w-[720px] bg-transparent",
              // Only stretch when the body is a single placeholder row: with
              // real rows the browser hands the slack to the first one.
              data.length === 0 && "h-full",
              // px-5 is the gutter every Card header and body uses, so a
              // table lines up with the panels it sits beside.
              "[&_td]:px-5 [&_td]:py-3.5 [&_td]:text-xs [&_td]:text-foreground-light [&_td]:tabular-nums",
              "[&_tbody_tr]:border-b [&_tbody_tr]:border-border-subtle [&_tbody_tr:last-child]:border-b-0",
            )}
          >
            <Table.Header className="sticky top-0 z-10 border-b border-border bg-surface-100">
              {columns.map((column) => (
                <Table.Column
                  key={column.key}
                  id={column.key}
                  isRowHeader={columns[0].key === column.key}
                  allowsSorting={column.sortable}
                  // `after:hidden` kills HeroUI's vertical column rule: this
                  // language separates rows, never columns.
                  className={cn(
                    "group bg-surface-100 px-5 py-3.5 after:hidden data-[allows-sorting=true]:cursor-pointer",
                    column.align === "right" && "text-right",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1.5",
                      column.align === "right" && "justify-end",
                    )}
                  >
                    <span className="text-xs font-medium text-foreground-light">
                      {column.label}
                    </span>
                    {column.sortable && (
                      <LuChevronsUpDown
                        aria-hidden
                        className="size-3.5 shrink-0 text-foreground-muted transition-colors group-hover:text-foreground-light"
                      />
                    )}
                  </div>
                </Table.Column>
              ))}
            </Table.Header>
            <Table.Body
              renderEmptyState={() =>
                loading ? (
                  <div className="divide-y divide-border-subtle">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-5 px-5">
                        {columns.map((column) => (
                          <div
                            key={column.key}
                            className={cn(
                              "flex flex-1 py-3.5",
                              column.align === "right" && "justify-end",
                            )}
                          >
                            <Skeleton className="h-2.5 w-full max-w-28" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    {emptyState ?? <EmptyState title={emptyMessage} />}
                  </div>
                )
              }
            >
              {!loading &&
                data.map((row, index) => {
                  if (onRender) {
                    return onRender(row, index, columns);
                  }

                  return (
                    <Table.Row
                      key={index}
                      id={index}
                      className="cursor-pointer transition-colors data-[hovered=true]:bg-surface-100 hover:bg-surface-100"
                      onAction={() => {
                        onRowClick?.(row, index);
                      }}
                    >
                      {columns.map((column) => (
                        <Table.Cell key={column.key}>
                          <div
                            className={cn(
                              "flex w-full min-w-0 items-center gap-2",
                              column.align === "right" && "justify-end",
                            )}
                          >
                            <span
                              className={cn(
                                "min-w-0 truncate",
                                column.align === "right"
                                  ? "text-right"
                                  : "flex-1",
                              )}
                            >
                              {row[column.key]}
                            </span>
                          </div>
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  );
                })}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>

        {/* An empty table says so once, in the body — a pager reading
            "1 to 0 of 0 results" beside two dead arrows is just chrome. */}
        {!loading && enablePagination && data.length > 0 && (
          <Table.Footer className="border-t border-border bg-surface-100 px-5 py-2.5">
            <Pagination size="sm">
              <Pagination.Summary className="text-xs text-foreground-light">
                {start} to {end} of {pagination.totalCount} results
              </Pagination.Summary>
              <Pagination.Content className="gap-1">
                <Pagination.Item>
                  <Pagination.Previous
                    className="cursor-pointer rounded-md text-xs font-medium text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40"
                    isDisabled={internalCurrentPage <= 1}
                    onPress={() =>
                      handlePageChange(Math.max(1, internalCurrentPage - 1))
                    }
                  >
                    <Pagination.PreviousIcon />
                    Prev
                  </Pagination.Previous>
                </Pagination.Item>
                {getVisiblePages().map((item, index) => {
                  if (typeof item !== "number") {
                    return (
                      <Pagination.Item key={`${item}-${index}`}>
                        <Pagination.Ellipsis className="text-foreground-muted" />
                      </Pagination.Item>
                    );
                  }

                  return (
                    <Pagination.Item key={item}>
                      <Pagination.Link
                        className={cn(
                          "cursor-pointer rounded-md text-xs font-medium transition-colors",
                          item === internalCurrentPage
                            ? "border border-border bg-surface text-foreground"
                            : "text-foreground-light hover:bg-surface-200 hover:text-foreground",
                        )}
                        isActive={item === internalCurrentPage}
                        onPress={() => handlePageChange(item)}
                      >
                        {item}
                      </Pagination.Link>
                    </Pagination.Item>
                  );
                })}
                <Pagination.Item>
                  <Pagination.Next
                    className="cursor-pointer rounded-md text-xs font-medium text-foreground-light transition-colors hover:bg-surface-200 hover:text-foreground data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40"
                    isDisabled={internalCurrentPage >= totalPages}
                    onPress={() =>
                      handlePageChange(
                        Math.min(totalPages, internalCurrentPage + 1),
                      )
                    }
                  >
                    Next
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </Table.Footer>
        )}
      </Table>
    </div>
  );
}

export default CustomTable;
