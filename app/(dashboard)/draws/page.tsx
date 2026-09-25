"use client";

import CustomTable from "@/components/custom-table";
import { useState } from "react";
import React from "react";
import DrawDrawer from "./_components/draw-drawer";
import CreateDrawModal from "./_components/create-draw-modal";
import { useQuery } from "@tanstack/react-query";
import FinancialsService from "@/api/financials";
import GamesService from "@/api/games";
import { LuShoppingBag, LuTrophy, LuTrendingUp } from "react-icons/lu";
import { MetricCard, NumberBallRow, PageHeader } from "@/components/ui";
import { usePageAccess } from "@/hooks/use-page-access";

function DrawView() {
  const { hasPage, hasAnyPage } = usePageAccess();
  const canCreateDraw = hasAnyPage("autodraw.drawable_today", "autodraw.event");
  const canViewTickets = hasPage("draw.draw_event_tickets");
  const canViewCards = hasPage("draw.draws_winnings_card");
  const canViewTable = hasPage("draw.draws_winnings_table");

  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(20);
  const [isDrawOpen, setDrawnIsOpen] = React.useState(false);
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(
    null,
  );
  const [drawerMode, setDrawerMode] = React.useState<
    "pre" | "post1" | "post2" | null
  >(null);

  const { data: dash, isPending: dashPending } = useQuery({
    queryKey: ["financials", "draws-and-winnings-dashboard"],
    queryFn: FinancialsService.fetchDrawsAndWinningsDashboard,
  });

  const { data: tableData, isPending: tablePending } = useQuery({
    queryKey: [
      "games",
      "draws-and-winnings-table",
      currentPage,
      currentPageSize,
    ],
    queryFn: () =>
      GamesService.fetchDrawsAndWinningsTable({
        page: currentPage,
        page_size: currentPageSize,
      }),
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

  const onPreDrawClick = (eventId: string) => {
    setSelectedEventId(eventId);
    setDrawerMode("pre");
    setDrawnIsOpen(true);
  };

  const closeDrawer = () => {
    setDrawnIsOpen(false);
    setSelectedEventId(null);
    setDrawerMode(null);
  };

  const rows = tableData?.results ?? [];
  const pagination = tableData
    ? {
        pageNumber: currentPage,
        pageSize: currentPageSize,
        totalCount: tableData.count,
      }
    : {
        pageNumber: 1,
        pageSize: currentPageSize,
        totalCount: 0,
      };

  const loading = dashPending || tablePending;

  const ytdSales = dash?.ytd_sales;
  const ytdWin = dash?.ytd_winnings;
  const ytdGgr = dash?.ytd_ggr;
  const ytdPlayers = ytdSales?.unique_players;
  const ytdTickets = ytdSales?.total_tickets;
  const ytdStakes = ytdSales?.total_stakes;

  return (
    <div className="flex flex-col gap-5 px-5 py-6 lg:px-8 lg:py-7 md:h-full md:overflow-hidden">
      <PageHeader
        className="shrink-0"
        title="Draws & winnings"
        description="Year-to-date performance and the full draw history."
        actions={canCreateDraw ? <CreateDrawModal /> : null}
      />

      {canViewCards && (
        <div className="grid shrink-0 gap-3 md:grid-cols-3">
          <MetricCard
            title="YTD sales"
            value={ytdSales?.total_sales ?? "—"}
            icon={<LuShoppingBag />}
            tone="brand"
            isLoading={dashPending}
            rows={[
              {
                label: "Players",
                value:
                  ytdPlayers != null ? ytdPlayers.toLocaleString("en-US") : "—",
              },
              {
                label: "Tickets",
                value:
                  ytdTickets != null ? ytdTickets.toLocaleString("en-US") : "—",
              },
              {
                label: "Stakes",
                value:
                  ytdStakes != null ? ytdStakes.toLocaleString("en-US") : "—",
              },
            ]}
          />
          <MetricCard
            title="YTD winnings"
            value={ytdWin?.total_winnings ?? "—"}
            icon={<LuTrophy />}
            tone="warning"
            isLoading={dashPending}
            rows={[
              { label: "Claimed", value: ytdWin?.claimed ?? "—" },
              { label: "Unclaimed", value: ytdWin?.unclaimed ?? "—" },
            ]}
          />
          <MetricCard
            title="YTD gross gaming revenue"
            value={ytdGgr?.gross_gaming_revenue ?? "—"}
            icon={<LuTrendingUp />}
            tone="success"
            isLoading={dashPending}
            rows={[
              { label: "Retention rate", value: ytdGgr?.retention_rate ?? "—" },
              {
                label: "Retention value",
                value: ytdGgr?.retention_value ?? "—",
              },
            ]}
          />
        </div>
      )}

      {canViewTable && (
        <div className="h-[500px] md:flex-1 md:min-h-0 overflow-hidden">
          <div className="h-full overflow-hidden">
            <CustomTable
              columns={[
                { key: "event", label: "Event #", sortable: true },
                { key: "drawDate", label: "Draw Date", sortable: true },
                { key: "eventName", label: "Event Name", sortable: false },
                { key: "drawTime", label: "Draw Time", sortable: true },
                { key: "preDraw", label: "Pre-Draw", sortable: false },
                { key: "drawNumbers", label: "Draw Numbers", sortable: false },
                { key: "payoutRatio", label: "Payout Ratio", sortable: false },
              ]}
              data={
                rows.map((r) => ({
                  event: (
                    <span className="font-medium tabular-nums text-foreground">
                      {r.event_no}
                    </span>
                  ),
                  drawDate: r.draw_date,
                  eventName: (
                    <span className="font-medium text-foreground">
                      {r.event_name}
                    </span>
                  ),
                  drawTime: <span className="tabular-nums">{r.draw_time}</span>,
                  preDraw: canViewTickets ? (
                    <button
                      className="cursor-pointer font-semibold tabular-nums text-primary underline decoration-dashed underline-offset-4 transition-colors hover:text-primary-strong"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreDrawClick(r.event_id);
                      }}
                    >
                      {r.pre_draw}
                    </button>
                  ) : (
                    <span className="tabular-nums text-zinc-400">
                      {r.pre_draw}
                    </span>
                  ),
                  drawNumbers: (
                    <NumberBallRow
                      values={r.draw_numbers}
                      variant="solid"
                      size="sm"
                    />
                  ),
                  payoutRatio: (
                    <span className="font-semibold tabular-nums text-foreground">
                      {r.payout_ratio}
                    </span>
                  ),
                })) ?? []
              }
              pagination={pagination}
              pageSize={currentPageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onRowClick={handleRowClick}
              onSort={handleSort}
              loading={loading}
              isRefetching={false}
            />
          </div>
        </div>
      )}

      <DrawDrawer
        isOpen={isDrawOpen}
        onCloseTap={closeDrawer}
        eventId={selectedEventId}
        drawerMode={drawerMode}
      />
    </div>
  );
}

export default DrawView;
