"use client";

import CustomInputComponent from "@/components/custom-input-component";
import CustomCheckboxItem from "@/components/custom-checkbox";
import CustomTable from "@/components/custom-table";
import FinancialsService from "@/api/financials";
import type { IReportDefinition } from "@/interfaces/financials.interface";
import ToastService from "@/utils/toast-service";
import EmptyImage from "@/public/images/new/empty-page.jpg";
import Image from "next/image";
import { Header, Label, ListBox, Select } from "@heroui/react";
import { Button, Card, CardHeader, PageHeader, PageShell } from "@/components/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { usePageAccess } from "@/hooks/use-page-access";
import { LuDownload, LuFileText } from "react-icons/lu";
import ApiError from "@/utils/api_error";

const PAGE_SIZE = 20;

function ReportsView() {
  const { hasPage } = usePageAccess();
  const canExecute = hasPage("reports.execute");
  const canDownload = hasPage("reports.download");

  const { data: reports = [] } = useQuery({
    queryKey: ["financials", "reports"],
    queryFn: FinancialsService.fetchReports,
  });
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [optionalSelectedColumns, setOptionalSelectedColumns] = useState<
    Record<string, boolean>
  >({});
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [previewPage, setPreviewPage] = useState(1);
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

  const visibleColumns = useMemo(() => {
    if (!selectedReport) return [];
    return selectedReport.schema.columns.filter(
      (col) => col.required || optionalSelectedColumns[col.key],
    );
  }, [optionalSelectedColumns, selectedReport]);

  const totalPreviewPages = Math.max(
    1,
    Math.ceil(previewRows.length / PAGE_SIZE),
  );

  const pagedRows = useMemo(() => {
    const start = (previewPage - 1) * PAGE_SIZE;
    return previewRows.slice(start, start + PAGE_SIZE);
  }, [previewRows, previewPage]);

  const groupedReports = useMemo(() => {
    const groups = new Map<string, IReportDefinition[]>();
    for (const report of reports) {
      const category = report.schema.category || "General";
      const current = groups.get(category) ?? [];
      current.push(report);
      groups.set(category, current);
    }
    return Array.from(groups.entries()).map(([key, values]) => ({
      key,
      values,
    }));
  }, [reports]);

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
    const required = selectedReport.schema.filters.filter((f) => f.required);
    for (const req of required) {
      const val = filters[req.key]?.trim();
      if (!val) {
        ToastService.error({ text: `${req.label} is required.` });
        return;
      }
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
      if (!result.status) {
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

  return (
    <PageShell fill>
      <PageHeader
        className="shrink-0"
        title="Reports"
        description="Build, preview and export operational reports."
      />

      {/* Two-column layout */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-hidden lg:grid-cols-2">
        {/* ── Left column ── */}
        <div className="flex flex-col gap-4 h-full min-h-0">
          {/* Report selector */}
          <div className="shrink-0">
            <ReportsSelection
              reports={groupedReports}
              onSelected={(val) => {
                setSelectedReportId(val.reportId);
                setOptionalSelectedColumns({});
                setFilters({});
                setPreviewPage(1);
                executeMutation.reset();
              }}
              selectedValue={selectedReport}
            />
          </div>

          {/* Config card — scrolls internally */}
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardHeader
              className="shrink-0"
              icon={<LuFileText />}
              title={selectedReport?.name ?? "Report configuration"}
              description={selectedReport?.schema.category ?? "General"}
            />

            {/* Scrollable filters + columns */}
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
              {/* Filters */}
              {(selectedReport?.schema.filters ?? []).length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Filters
                  </p>
                  {(selectedReport?.schema.filters ?? []).map((filter) => {
                    if (filter.type === "date") {
                      return (
                        <div key={filter.key} className="max-w-[240px]">
                          <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                            {filter.label}
                          </Label>
                          <input
                            type="date"
                            value={filters[filter.key] ?? ""}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                [filter.key]: e.target.value,
                              }))
                            }
                            className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none transition-colors focus:border-primary"
                          />
                        </div>
                      );
                    }
                    return (
                      <CustomInputComponent
                        key={filter.key}
                        className="max-w-[240px]"
                        label={filter.label}
                        placeholder={`Input ${filter.label}`}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            [filter.key]: e.target.value,
                          }))
                        }
                      />
                    );
                  })}
                </div>
              )}

              {/* Columns */}
              {(selectedReport?.schema.columns ?? []).length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    Columns
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {(selectedReport?.schema.columns ?? []).map((column) => (
                      <CustomCheckboxItem
                        key={column.key}
                        selected={
                          column.required || optionalSelectedColumns[column.key]
                        }
                        label={column.label}
                        labelClassName="font-normal"
                        isDisabled={column.required}
                        setIsSelected={(checked) =>
                          setOptionalSelectedColumns((prev) => ({
                            ...prev,
                            [column.key]: Boolean(checked),
                          }))
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Generate button pinned to bottom */}
            {canExecute && (
              <div className="shrink-0 border-t border-border-subtle px-5 py-4">
                <Button
                  size="lg"
                  fullWidth
                  disabled={!selectedReport}
                  onClick={onGenerate}
                  isPending={executeMutation.isPending}
                >
                  {executeMutation.isPending
                    ? "Generating…"
                    : "Generate report"}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* ── Right column — preview ── */}
        <Card className="flex h-full min-h-0 flex-col">
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
            <div className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold text-foreground">
                Preview
              </span>
              {executeMutation.data && (
                <span className="mt-0.5 truncate text-[11px] text-zinc-400">
                  {executeMutation.data.report_name}
                  {` · ${previewRows.length.toLocaleString("en-US")} records`}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {canDownload && (
                <Button
                  size="sm"
                  disabled={!previewRows.length}
                  onClick={onDownloadCsv}
                >
                  <LuDownload />
                  Download
                </Button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-hidden">
            {!executeMutation.data ? (
              /* Empty state */
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6">
                <div className="relative size-44">
                  <Image
                    src={EmptyImage}
                    alt=""
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="text-sm font-medium text-foreground">
                  No report generated yet
                </p>
                <p className="max-w-[220px] text-center text-xs text-muted-foreground">
                  Pick a report, set its filters, then generate it.
                </p>
              </div>
            ) : (
              /* Data state — CustomTable */
              <div className="h-full overflow-hidden">
                <CustomTable
                  columns={tableColumns}
                  data={tableData}
                  pagination={tablePagination}
                  pageSize={PAGE_SIZE}
                  onPageChange={(page) => setPreviewPage(page)}
                  onPageSizeChange={() => {}}
                  onRowClick={() => {}}
                  onSort={() => {}}
                  loading={executeMutation.isPending}
                  isRefetching={false}
                  addTableBorder={false}
                  emptyMessage={
                    totalPreviewPages === 0
                      ? "No rows returned"
                      : "No data available"
                  }
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

type Props = {
  reports: Array<{ key: string; values: IReportDefinition[] }>;
  onSelected: (value: IReportDefinition) => void;
  selectedValue: IReportDefinition | null;
};

const ReportsSelection = ({ reports, onSelected, selectedValue }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = selectedValue?.name ?? "";

  function handleAction(payload: IReportDefinition) {
    setIsOpen(false);
    onSelected(payload);
  }

  return (
    <Select
      placeholder="Select a Report"
      isOpen={isOpen}
      onOpenChange={setIsOpen}
    >
      <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        Select a report
      </Label>
      <Select.Trigger
        className="h-11 w-full cursor-pointer rounded-xl border border-border bg-surface px-4 text-sm shadow-none transition-colors hover:border-zinc-300 data-[focused=true]:border-primary"
        onClick={() => setIsOpen(true)}
      >
        <Select.Value className="text-sm text-foreground">
          {selectedLabel || "Select a report"}
        </Select.Value>
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="rounded-2xl border border-border-subtle p-1.5 shadow-lg shadow-zinc-200/60">
        <ListBox>
          {reports.map((section, sIndex) => (
            <ListBox.Section key={section.key}>
              <Header className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                {section.key}
              </Header>
              {section.values.map((report) => (
                <ListBox.Item
                  key={report.reportId}
                  id={report.name.toLowerCase().replace(/\s+/g, "-")}
                  textValue={report.name}
                  onAction={() => handleAction(report)}
                  className="flex cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm text-muted-foreground outline-none transition-colors data-[hovered=true]:bg-subtle data-[hovered=true]:text-foreground"
                >
                  <div className="flex items-center gap-3 w-full">
                    <span className="flex-1 truncate group-selected:font-medium">
                      {report.name}
                    </span>
                  </div>
                </ListBox.Item>
              ))}
              {sIndex < reports.length - 1 && (
                <div className="mx-2 my-1 h-px bg-border-subtle" />
              )}
            </ListBox.Section>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
};
