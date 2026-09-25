"use client";

import { cn, Pagination, Table } from "@heroui/react";
import React, { useEffect, useState } from "react";
import NProgress from "nprogress";
import { IPagination } from "@/interfaces/general.interface";
import { LuChevronsUpDown, LuInbox, LuLoaderCircle } from "react-icons/lu";

/** Matches React Aria's SortDescriptor without depending on its nested package. */
type SortDescriptor = {
  column: string | number;
  direction: "ascending" | "descending";
};

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
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
    <div className={cn("flex min-w-0 flex-col sm:h-full", className)}>
      <div className="flex min-w-0 flex-col sm:min-h-0 sm:flex-1">
        <Table
          className={cn(
            "flex w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-surface sm:h-full",
            addTableBorder && "border border-border-subtle",
          )}
        >
          <Table.ScrollContainer className="min-h-0 w-full min-w-0 flex-1 overflow-x-auto overflow-y-auto max-h-[min(58dvh,26rem)] md:max-h-[min(62dvh,30rem)]">
            <Table.Content
              aria-label="Data table"
              sortDescriptor={sortDescriptor ?? undefined}
              onSortChange={handleSortChange}
              className={cn(
                "w-full min-w-[720px] bg-transparent",
                "[&_td]:px-5 [&_td]:py-3.5 [&_td]:text-sm [&_td]:text-muted-foreground [&_td]:tabular-nums",
                "[&_tbody_tr]:border-b [&_tbody_tr]:border-border-subtle [&_tbody_tr:last-child]:border-b-0",
              )}
            >
              <Table.Header className="sticky top-0 z-10 border-b border-border-subtle bg-surface-muted">
                {columns.map((column) => (
                  <Table.Column
                    key={column.key}
                    id={column.key}
                    isRowHeader={columns[0].key === column.key}
                    allowsSorting={column.sortable}
                    className="group bg-surface-muted px-5 py-3.5 data-[allows-sorting=true]:cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        {column.label}
                      </span>
                      {column.sortable && (
                        <LuChevronsUpDown
                          aria-hidden
                          className="size-3.5 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500"
                        />
                      )}
                    </div>
                  </Table.Column>
                ))}
              </Table.Header>
              <Table.Body
                renderEmptyState={() =>
                  loading ? (
                    <div className="flex items-center justify-center py-14">
                      <LuLoaderCircle className="size-5 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-subtle text-zinc-300">
                        <LuInbox className="size-5" />
                      </div>
                      <p className="text-sm font-medium text-foreground">
                        {emptyMessage}
                      </p>
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
                        className="cursor-pointer transition-colors data-[hovered=true]:bg-subtle hover:bg-subtle"
                        onAction={() => {
                          onRowClick?.(row, index);
                        }}
                      >
                        {columns.map((column) => (
                          <Table.Cell key={column.key}>
                            <div className="flex w-full min-w-0 items-center gap-2">
                              <span className="min-w-0 flex-1 truncate">
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

          {!loading && enablePagination && (
            <Table.Footer className="border-t border-border-subtle bg-surface px-5 py-2.5">
              <Pagination size="sm">
                <Pagination.Summary className="text-xs text-muted-foreground">
                  {start} to {end} of {pagination.totalCount} results
                </Pagination.Summary>
                <Pagination.Content className="gap-1">
                  <Pagination.Item>
                    <Pagination.Previous
                      className="cursor-pointer rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40"
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
                          <Pagination.Ellipsis className="text-zinc-300" />
                        </Pagination.Item>
                      );
                    }

                    return (
                      <Pagination.Item key={item}>
                        <Pagination.Link
                          className={cn(
                            "cursor-pointer rounded-lg text-xs font-medium transition-colors",
                            item === internalCurrentPage
                              ? "bg-primary-soft text-primary-strong"
                              : "text-muted-foreground hover:bg-subtle hover:text-foreground",
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
                      className="cursor-pointer rounded-lg text-xs font-medium text-muted-foreground transition-colors hover:bg-subtle hover:text-foreground data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-40"
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
    </div>
  );
}

export default CustomTable;
