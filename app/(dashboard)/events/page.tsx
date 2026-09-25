"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LuCalendarDays, LuMapPin, LuScanLine, LuTicket } from "react-icons/lu";
import { Badge, Button, EmptyState, PageHeader, PageShell, SegmentedControl, Skeleton } from "@/components/ui";
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
    <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-4 transition-colors hover:border-border sm:flex-row sm:items-center">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <LuCalendarDays className="size-5" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
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
            <span className="flex max-w-xs items-center gap-1.5 truncate text-xs text-zinc-400">
              <LuMapPin className="size-3 shrink-0" />
              {event.venue}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-1.5">
          <LuTicket className="size-4 text-zinc-400" />
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {event.ticket_count}
          </span>
          <span className="text-xs text-zinc-400">tickets</span>
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
              className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-4"
            >
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-2.5 w-32" />
              </div>
              <Skeleton className="h-8 w-20 rounded-xl" />
            </div>
          ))
        ) : events.length === 0 ? (
          <EmptyState
            icon={<LuCalendarDays />}
            title="No events yet"
            description="Create your first event to start issuing QR tickets."
          />
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
      <PageHeader
        className="shrink-0"
        title="Events & QR tickets"
        description="Publish events, issue tickets and scan them at the gate."
        actions={
          tab === "events" && canCreate ? <CreateEventModal /> : undefined
        }
      />

      {(showEventTab || showScannerTab) && (
        <SegmentedControl
          className="shrink-0 self-start"
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

      {/* Content */}
      {tab === "events" && showEventTab && <EventsList canManage={canManage} />}
      {tab === "scanner" && showScannerTab && <ScanTab />}
    </PageShell>
  );
}
