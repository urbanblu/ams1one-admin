"use client";

import CustomInputComponent from "@/components/custom-input-component";
import CustomTable from "@/components/custom-table";
import FinancialsService from "@/api/financials";
import type {
  IReportDefinition,
  IReportFilterSchema,
} from "@/interfaces/financials.interface";
import ToastService from "@/utils/toast-service";
import ApiError from "@/utils/api_error";
import { cn } from "@heroui/react";
import {
  Button,
  Card,
  CardFooter,
  CardHeader,
  EmptyState,
  FieldLabel,
  PageShell,
  SearchInput,
  Skeleton,
} from "@/components/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { usePageAccess } from "@/hooks/use-page-access";
import {
  LuCheck,
  LuChevronDown,
  LuColumns3,
  LuDownload,
  LuFileText,
  LuLoaderCircle,
  LuLock,
  LuPlus,
  LuSlidersHorizontal,
  LuTableProperties,
} from "react-icons/lu";

const PAGE_SIZE = 20;

/**
 * Reports is a three-step task — pick a report, shape it, read the result —
 * so the page is laid out in those three zones: a rail that lists every
 * report, a collapsible strip that holds the shaping controls, and the
 * result table underneath. The strip folds away once a report has run so the
 * rows, which are the reason the page exists, get the whole panel.
 */
function ReportsView() {
  const { hasPage } = usePageAccess();
  const canExecute = hasPage("reports.execute");
  const canDownload = hasPage("reports.download");

  const { data: reports = [], isPending: reportsLoading } = useQuery({
    queryKey: ["financials", "reports"],
    queryFn: FinancialsService.fetchReports,
  });

  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  /** `null` means "every column" — the default for a freshly picked report. */
  const [columnOverrides, setColumnOverrides] = useState<Record<
    string,
    boolean
  > | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  /** Bumped to remount the uncontrolled filter fields when they are cleared. */
  const [filterEpoch, setFilterEpoch] = useState(0);
  const [previewPage, setPreviewPage] = useState(1);
  const [reportSearch, setReportSearch] = useState("");
  const [configOpen, setConfigOpen] = useState(true);

  const resolvedReportId = selectedReportId ?? reports[0]?.reportId ?? null;

  const selectedReport = useMemo(
    () => reports.find((r) => r.reportId === resolvedReportId) ?? null,
    [reports, resolvedReportId],
  );

  const executeMutation = useMutation({
    mutationKey: ["financials", "execute-report"],
    mutationFn: (payload: {
      reportId: number;
      filters: Record<string, string | number>;
    }) => FinancialsService.executeReport(payload.reportId, payload.filters),
    onError: (error: ApiError) => {
      ToastService.error({
        text: error?.message ?? "Unable to generate report",
      });
    },
  });

  const previewRows = useMemo(
    () => executeMutation.data?.data ?? [],
    [executeMutation.data?.data],
  );

  const reportColumns = selectedReport?.schema.columns ?? [];
  const reportFilters = selectedReport?.schema.filters ?? [];

  const visibleColumns = useMemo(() => {
    if (!selectedReport) return [];
    return selectedReport.schema.columns.filter(
      (column) => column.required || (columnOverrides?.[column.key] ?? true),
    );
  }, [columnOverrides, selectedReport]);

  const missingRequiredFilters = useMemo(() => {
    if (!selectedReport) return [];
    return selectedReport.schema.filters.filter(
      (filter) => filter.required && !(filters[filter.key] ?? "").trim(),
    );
  }, [filters, selectedReport]);

  const activeFilterCount = useMemo(
    () => Object.values(filters).filter((value) => value.trim()).length,
    [filters],
  );

  const pagedRows = useMemo(() => {
    const start = (previewPage - 1) * PAGE_SIZE;
    return previewRows.slice(start, start + PAGE_SIZE);
  }, [previewRows, previewPage]);

  const groupedReports = useMemo(() => {
    const query = reportSearch.trim().toLowerCase();
    const groups = new Map<string, IReportDefinition[]>();
    for (const report of reports) {
      const category = report.schema.category || "General";
      if (
        query &&
        !report.name.toLowerCase().includes(query) &&
        !category.toLowerCase().includes(query)
      ) {
        continue;
      }
      const current = groups.get(category) ?? [];
      current.push(report);
      groups.set(category, current);
    }
    return Array.from(groups.entries()).map(([key, values]) => ({
      key,
      values,
    }));
  }, [reports, reportSearch]);

  const matchedCount = groupedReports.reduce(
    (total, group) => total + group.values.length,
    0,
  );

  const onSelectReport = (report: IReportDefinition) => {
    setSelectedReportId(report.reportId);
    setColumnOverrides(null);
    setFilters({});
    setFilterEpoch((epoch) => epoch + 1);
    setPreviewPage(1);
    setConfigOpen(true);
    executeMutation.reset();
  };

  const onClearFilters = () => {
    setFilters({});
    setFilterEpoch((epoch) => epoch + 1);
  };

  const onDownloadCsv = () => {
    if (!previewRows.length || !visibleColumns.length) return;
    const escape = (val: unknown) => {
      const str = String(val ?? "");
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };
    const header = visibleColumns.map((c) => escape(c.label)).join(",");
    const rows = previewRows
      .map((row) => visibleColumns.map((c) => escape(row[c.key])).join(","))
      .join("\n");
    const blob = new Blob([`${header}\n${rows}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${executeMutation.data?.report_name ?? "report"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onGenerate = async () => {
    if (!selectedReport) return;
    if (missingRequiredFilters.length) {
      setConfigOpen(true);
      ToastService.error({
        text: `${missingRequiredFilters[0].label} is required.`,
      });
      return;
    }
    const payload: Record<string, string | number> = {};
    Object.entries(filters).forEach(([k, v]) => {
      const trimmed = v.trim();
      if (trimmed) payload[k] = trimmed;
    });
    try {
      const result = await executeMutation.mutateAsync({
        reportId: selectedReport.reportId,
        filters: payload,
      });
      setPreviewPage(1);
      if (result.status) {
        // Hand the panel over to the rows now that there are some.
        setConfigOpen(false);
      } else {
        ToastService.error({
          text: result.message || "Report execution failed",
        });
      }
    } catch (error) {
      ToastService.error({
        text:
          error instanceof Error ? error.message : "Report execution failed",
      });
    }
  };

  const tableColumns = visibleColumns.map((col) => ({
    key: col.key,
    label: col.label,
    sortable: false,
  }));

  const tableData = pagedRows.map((row) =>
    Object.fromEntries(
      visibleColumns.map((col) => [col.key, String(row[col.key] ?? "")]),
    ),
  );

  const tablePagination = {
    pageNumber: previewPage,
    pageSize: PAGE_SIZE,
    totalCount: previewRows.length,
  };

  const headerDescription = (() => {
    if (!selectedReport) return "Pick a report from the list";
    const parts = [selectedReport.schema.category || "General"];
    parts.push(
      visibleColumns.length === reportColumns.length
        ? `${reportColumns.length} columns`
        : `${visibleColumns.length} of ${reportColumns.length} columns`,
    );
    if (executeMutation.data) {
      parts.push(
        `${previewRows.length.toLocaleString("en-US")} ${
          previewRows.length === 1 ? "row" : "rows"
        }`,
      );
    }
    return parts.join(" · ");
  })();

  const configSummary = (() => {
    const parts: string[] = [];
    if (activeFilterCount) {
      parts.push(
        `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"}`,
      );
    }
    if (reportColumns.length) {
      parts.push(
        visibleColumns.length === reportColumns.length
          ? "all columns"
          : `${visibleColumns.length} of ${reportColumns.length} columns`,
      );
    }
    return parts.join(" · ");
  })();

  const allColumnsOn = visibleColumns.length === reportColumns.length;
  const onlyRequiredOn = visibleColumns.every((column) => column.required);

  return (
    <PageShell fill>
      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
        {/* ── Report rail ── */}
        <ReportRail
          groups={groupedReports}
          total={reports.length}
          matched={matchedCount}
          loading={reportsLoading}
          search={reportSearch}
          onSearch={setReportSearch}
          selectedId={resolvedReportId}
          onSelect={onSelectReport}
        />

        {/* ── Working panel ── */}
        <Card className="flex min-h-0 flex-col lg:h-full">
          <CardHeader
            className="shrink-0"
            icon={<LuFileText />}
            title={selectedReport?.name ?? "No report selected"}
            description={headerDescription}
            action={
              <div className="flex items-center gap-2">
                {canDownload && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!previewRows.length || !visibleColumns.length}
                    onClick={onDownloadCsv}
                  >
                    <LuDownload />
                    Export CSV
                  </Button>
                )}
                {canExecute && (
                  <Button
                    size="sm"
                    disabled={!selectedReport}
                    isPending={executeMutation.isPending}
                    onClick={onGenerate}
                  >
                    {executeMutation.isPending ? "Running…" : "Run report"}
                  </Button>
                )}
              </div>
            }
          />

          {/* Shaping controls — folded away once the rows arrive. */}
          {selectedReport &&
            (reportFilters.length > 0 || reportColumns.length > 0) && (
              <div className="shrink-0 border-b border-border bg-surface-100">
                <button
                  type="button"
                  aria-expanded={configOpen}
                  onClick={() => setConfigOpen((open) => !open)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 px-5 py-2.5 text-left transition-colors hover:bg-surface-200"
                >
                  <span className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <LuSlidersHorizontal className="size-3.5 text-foreground-muted" />
                    Filters &amp; columns
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    {missingRequiredFilters.length > 0 && (
                      <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        {missingRequiredFilters.length} required
                      </span>
                    )}
                    {configSummary && (
                      <span className="hidden truncate text-xs text-foreground-light sm:inline">
                        {configSummary}
                      </span>
                    )}
                    <LuChevronDown
                      className={cn(
                        "size-3.5 shrink-0 text-foreground-muted transition-transform",
                        configOpen && "rotate-180",
                      )}
                    />
                  </span>
                </button>

                {configOpen && (
                  <div className="space-y-5 border-t border-border px-5 py-4">
                    {reportFilters.length > 0 && (
                      <section className="space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <SectionLabel>Filters</SectionLabel>
                          <TextAction
                            disabled={activeFilterCount === 0}
                            onClick={onClearFilters}
                          >
                            Clear
                          </TextAction>
                        </div>
                        <div
                          key={`${resolvedReportId}-${filterEpoch}`}
                          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                        >
                          {reportFilters.map((filter) => (
                            <FilterField
                              key={filter.key}
                              filter={filter}
                              value={filters[filter.key] ?? ""}
                              onChange={(value) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  [filter.key]: value,
                                }))
                              }
                            />
                          ))}
                        </div>
                      </section>
                    )}

                    {reportColumns.length > 0 && (
                      <section className="space-y-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <SectionLabel>Columns</SectionLabel>
                          <div className="flex items-center gap-2">
                            <TextAction
                              disabled={allColumnsOn}
                              onClick={() => setColumnOverrides(null)}
                            >
                              Select all
                            </TextAction>
                            <span className="text-foreground-muted">·</span>
                            <TextAction
                              disabled={onlyRequiredOn}
                              onClick={() =>
                                setColumnOverrides(
                                  Object.fromEntries(
                                    reportColumns.map((column) => [
                                      column.key,
                                      false,
                                    ]),
                                  ),
                                )
                              }
                            >
                              Clear
                            </TextAction>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {reportColumns.map((column) => {
                            const on =
                              column.required ||
                              (columnOverrides?.[column.key] ?? true);
                            return (
                              <button
                                key={column.key}
                                type="button"
                                disabled={column.required}
                                aria-pressed={on}
                                title={
                                  column.required
                                    ? `${column.label} is always included`
                                    : undefined
                                }
                                onClick={() =>
                                  setColumnOverrides((prev) => ({
                                    ...(prev ?? {}),
                                    [column.key]: !on,
                                  }))
                                }
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
                                  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500",
                                  on
                                    ? "border-brand-300 bg-brand-100 text-brand-800"
                                    : "border-border-strong bg-surface text-foreground-light hover:bg-surface-200 hover:text-foreground",
                                  column.required
                                    ? "cursor-default"
                                    : "cursor-pointer",
                                )}
                              >
                                {on ? (
                                  <LuCheck className="size-3 shrink-0" />
                                ) : (
                                  <LuPlus className="size-3 shrink-0" />
                                )}
                                {column.label}
                                {column.required && (
                                  <LuLock className="size-2.5 shrink-0 opacity-70" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </div>
            )}

          {/* Result */}
          <div className="min-h-0 flex-1 overflow-hidden">
            {executeMutation.isPending ? (
              <div className="flex h-full min-h-48 items-center justify-center gap-2 text-xs text-foreground-light">
                <LuLoaderCircle className="size-4 animate-spin" />
                Running {selectedReport?.name}…
              </div>
            ) : !selectedReport ? (
              <ResultPlaceholder
                icon={<LuFileText />}
                title={
                  reportsLoading ? "Loading reports…" : "No reports available"
                }
                description={
                  reportsLoading
                    ? undefined
                    : "No report definitions have been published for your account."
                }
              />
            ) : !executeMutation.data ? (
              <ResultPlaceholder
                icon={<LuTableProperties />}
                title="No rows yet"
                description={
                  missingRequiredFilters.length
                    ? `Set ${missingRequiredFilters
                        .map((filter) => filter.label)
                        .join(", ")} to run this report.`
                    : "Shape the filters and columns you need, then run the report."
                }
                action={
                  canExecute ? (
                    <Button size="sm" onClick={onGenerate}>
                      Run report
                    </Button>
                  ) : undefined
                }
              />
            ) : visibleColumns.length === 0 ? (
              <ResultPlaceholder
                icon={<LuColumns3 />}
                title="Every column is hidden"
                description={`${previewRows.length.toLocaleString(
                  "en-US",
                )} rows are ready — turn a column back on to read them.`}
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setColumnOverrides(null);
                      setConfigOpen(true);
                    }}
                  >
                    Select all columns
                  </Button>
                }
              />
            ) : (
              <div className="h-full overflow-hidden">
                <CustomTable
                  columns={tableColumns}
                  data={tableData}
                  pagination={tablePagination}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) => setPreviewPage(page)}
                  onPageSizeChange={() => {}}
                  onSort={() => {}}
                  loading={false}
                  isRefetching={false}
                  addTableBorder={false}
                  emptyMessage="This report returned no rows"
                />
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

export default ReportsView;

/* ------------------------------------------------------------------ rail */

type RailProps = {
  groups: Array<{ key: string; values: IReportDefinition[] }>;
  total: number;
  matched: number;
  loading: boolean;
  search: string;
  onSearch: (value: string) => void;
  selectedId: number | null;
  onSelect: (report: IReportDefinition) => void;
};

/**
 * Every report, always on screen. A dropdown hid the catalogue behind a click
 * and gave no sense of how much there was to choose from; a rail makes the
 * set browsable and the current choice permanently visible.
 */
function ReportRail({
  groups,
  total,
  matched,
  loading,
  search,
  onSearch,
  selectedId,
  onSelect,
}: RailProps) {
  return (
    <Card className="flex min-h-0 flex-col lg:h-full">
      <div className="shrink-0 border-b border-border p-2.5">
        <SearchInput
          placeholder="Search reports"
          value={search}
          onChange={onSearch}
        />
      </div>

      <div className="max-h-72 min-h-0 flex-1 overflow-y-auto p-1.5 lg:max-h-none">
        {loading && (
          <div className="space-y-1.5 p-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full rounded-md" />
            ))}
          </div>
        )}

        {!loading && matched === 0 && (
          <p className="px-2.5 py-8 text-center text-xs text-foreground-light">
            {total === 0
              ? "No reports available."
              : "No reports match that search."}
          </p>
        )}

        {!loading &&
          groups.map((group) => (
            <div key={group.key} className="mb-1.5 last:mb-0">
              <p className="px-2.5 py-1.5 text-xs font-medium text-foreground-light">
                {group.key}
              </p>
              <div className="space-y-0.5">
                {group.values.map((report) => {
                  const isActive = report.reportId === selectedId;
                  return (
                    <button
                      key={report.reportId}
                      type="button"
                      aria-current={isActive ? "true" : undefined}
                      onClick={() => onSelect(report)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors",
                        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500",
                        isActive
                          ? "bg-brand-100 font-medium text-brand-800"
                          : "text-foreground-light hover:bg-surface-200 hover:text-foreground",
                      )}
                    >
                      <LuFileText
                        className={cn(
                          "size-3.5 shrink-0",
                          isActive ? "text-brand-700" : "text-foreground-muted",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {report.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {!loading && total > 0 && (
        <CardFooter className="shrink-0 tabular-nums">
          {matched === total
            ? `${total} report${total === 1 ? "" : "s"}`
            : `${matched} of ${total} reports`}
        </CardFooter>
      )}
    </Card>
  );
}

/* ---------------------------------------------------------------- pieces */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-foreground-light">{children}</p>
  );
}

function TextAction({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer rounded-sm text-xs font-medium text-foreground-light transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-foreground-light"
    >
      {children}
    </button>
  );
}

/**
 * Date filters are a native field rather than `CustomDatePicker` because that
 * component seeds itself with today's date and offers no way back to empty —
 * a report filter has to be able to stay unset.
 */
function FilterField({
  filter,
  value,
  onChange,
}: {
  filter: IReportFilterSchema;
  value: string;
  onChange: (value: string) => void;
}) {
  const label = filter.required ? `${filter.label} *` : filter.label;

  if (filter.type === "date") {
    return (
      <div>
        <FieldLabel htmlFor={`filter-${filter.key}`}>{label}</FieldLabel>
        <input
          id={`filter-${filter.key}`}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground outline-none transition-colors duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
    );
  }

  return (
    <CustomInputComponent
      label={label}
      type={filter.type === "number" ? "number" : "text"}
      placeholder={`Any ${filter.label.toLowerCase()}`}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ResultPlaceholder({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <EmptyState
      className="h-full min-h-48"
      icon={icon}
      title={title}
      description={description}
      action={action}
    />
  );
}
