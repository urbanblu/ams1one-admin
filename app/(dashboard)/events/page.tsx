"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LuCalendarDays, LuMapPin, LuScanLine, LuTicket } from "react-icons/lu";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  AppBarActions,
  PageShell,
  SegmentedControl,
  Skeleton,
} from "@/components/ui";
import EventsService from "@/api/events";
import type { IEvent } from "@/interfaces/events.interface";
import CreateEventModal from "./_components/create-event-modal";
import EventDrawer from "./_components/event-drawer";
import ScanTab from "./_components/scan-tab";
import { usePageAccess } from "@/hooks/use-page-access";

type Tab = "events" | "scanner";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// ─── Events list ──────────────────────────────────────────────────────────────

function EventCard({
  event,
  onManage,
  canManage,
}: {
  event: IEvent;
  onManage: (e: IEvent) => void;
  canManage: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface px-5 py-4 transition-colors hover:bg-surface-100 sm:flex-row sm:items-center">
      <LuCalendarDays className="size-4 shrink-0 text-foreground-muted" />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {event.name}
          </span>
          <Badge tone={event.is_active ? "success" : "neutral"} dot>
            {event.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LuCalendarDays className="size-3 shrink-0" />
            {formatDate(event.event_date)}
          </span>
          {event.venue && (
            <span className="flex max-w-xs items-center gap-1.5 truncate text-xs text-foreground-muted">
              <LuMapPin className="size-3 shrink-0" />
              {event.venue}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-1.5">
          <LuTicket className="size-4 text-foreground-muted" />
          <span className="text-sm font-medium tabular-nums text-foreground">
            {event.ticket_count}
          </span>
          <span className="text-xs text-foreground-muted">tickets</span>
        </div>
        {canManage && (
          <Button variant="secondary" size="sm" onClick={() => onManage(event)}>
            Manage
          </Button>
        )}
      </div>
    </div>
  );
}

function EventsList({ canManage }: { canManage: boolean }) {
  const [selectedEvent, setSelectedEvent] = useState<IEvent | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ["events"],
    queryFn: EventsService.fetchEvents,
  });
  const events = data?.results ?? [];

  return (
    <>
      <div className="flex flex-col gap-3">
        {isPending ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface px-5 py-4"
            >
              <Skeleton className="size-4 shrink-0 rounded-sm" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-2.5 w-32" />
              </div>
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          ))
        ) : events.length === 0 ? (
          /* What CustomTable does when it has no rows: keep the panel, and
             centre the message in the space the rows would have filled. The
             min-height is the four-row skeleton above, so resolving to empty
             does not change the page's shape. */
          <Card className="flex min-h-72 items-center justify-center">
            <EmptyState
              icon={<LuCalendarDays />}
              title="No events yet"
              description="Create your first event to start issuing QR tickets."
            />
          </Card>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onManage={setSelectedEvent}
              canManage={canManage}
            />
          ))
        )}
      </div>

      <EventDrawer
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const { hasPage } = usePageAccess();

  const canList = hasPage("events.list");
  const canCreate = hasPage("events.create");
  const canManage = hasPage("events.detail");
  const canScan = hasPage("events.scan");

  const defaultTab: Tab = canList ? "events" : "scanner";
  const [tab, setTab] = useState<Tab>(defaultTab);

  const showEventTab = canList;
  const showScannerTab = canScan;

  return (
    <PageShell>
      <AppBarActions>
        {(showEventTab || showScannerTab) && (
          <SegmentedControl
            segments={
              [
                showEventTab && {
                  key: "events" as const,
                  label: "Events",
                  icon: <LuCalendarDays />,
                },
                showScannerTab && {
                  key: "scanner" as const,
                  label: "Gate scanner",
                  icon: <LuScanLine />,
                },
              ].filter(Boolean) as {
                key: Tab;
                label: string;
                icon: React.ReactNode;
              }[]
            }
            value={tab}
            onChange={setTab}
          />
        )}
        {tab === "events" && canCreate && <CreateEventModal />}
      </AppBarActions>

      {/* Content */}
      {tab === "events" && showEventTab && <EventsList canManage={canManage} />}
      {tab === "scanner" && showScannerTab && <ScanTab />}
    </PageShell>
  );
}
