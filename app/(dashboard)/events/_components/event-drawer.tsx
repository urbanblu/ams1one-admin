"use client";

import type { BadgeTone } from "@/components/ui";
import {
  Badge,
  Button as UiButton,
  DrawerTitleBar,
  SegmentedControl,
  StatusBadge,
  Textarea,
  drawerBodyClass,
  drawerDialogClass,
  drawerWidth,
} from "@/components/ui";

import React, { useState } from "react";
import { cn, Drawer, Spinner, Tabs } from "@heroui/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LuCalendarDays,
  LuMapPin,
  LuSend,
  LuTicket,
  LuUsers,
} from "react-icons/lu";
import EventsService from "@/api/events";
import type {
  IEvent,
  IEventTicket,
  ITicketStatus,
} from "@/interfaces/events.interface";
import ApiError from "@/utils/api_error";
import ToastService from "@/utils/toast-service";
import { usePageAccess } from "@/hooks/use-page-access";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

const STATUS_CHIP: Record<ITicketStatus, { label: string; tone: BadgeTone }> = {
  issued: { label: "Issued", tone: "neutral" },
  delivered: { label: "Delivered", tone: "info" },
  scanned: { label: "Scanned", tone: "success" },
  revoked: { label: "Revoked", tone: "danger" },
};

function StatusChip({ status }: { status: ITicketStatus }) {
  // toneForStatus can't know that a delivered ticket is in-flight rather than
  // healthy, so the domain map rides StatusBadge's tone override.
  const { label, tone } = STATUS_CHIP[status] ?? STATUS_CHIP.issued;
  return <StatusBadge status={label} tone={tone} />;
}

// ─── Tickets panel ────────────────────────────────────────────────────────────

const ALL_STATUSES: (ITicketStatus | "all")[] = [
  "all",
  "issued",
  "delivered",
  "scanned",
  "revoked",
];

function TicketsPanel({
  eventId,
  onResend,
  resendingId,
}: {
  eventId: string;
  onResend: (ticketId: string) => void;
  resendingId: string | null;
}) {
  const [filter, setFilter] = useState<ITicketStatus | "all">("all");

  const { data: tickets = [], isFetching } = useQuery({
    queryKey: ["events", eventId, "tickets", filter],
    queryFn: () =>
      EventsService.fetchEventTickets(
        eventId,
        filter !== "all" ? { status: filter } : undefined,
      ),
    enabled: !!eventId,
  });

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Status filter */}
      <SegmentedControl
        className="shrink-0 self-start"
        value={filter}
        onChange={setFilter}
        segments={ALL_STATUSES.map((s) => ({
          key: s,
          label: s === "all" ? "All" : STATUS_CHIP[s].label,
        }))}
      />

      {/* List */}
      {isFetching ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="sm" className="text-brand-700" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-foreground-light">
          <LuTicket className="size-8 text-foreground-muted" />
          <p className="text-xs">
            No tickets{filter !== "all" ? ` with status "${filter}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border overflow-y-auto">
          {tickets.map((t) => (
            <TicketRow
              key={t.id}
              ticket={t}
              onResend={onResend}
              resendingId={resendingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketRow({
  ticket,
  onResend,
  resendingId,
}: {
  ticket: IEventTicket;
  onResend: (id: string) => void;
  resendingId: string | null;
}) {
  const canResend = ticket.status === "issued" || ticket.status === "delivered";
  return (
    <div className="py-3 flex items-start justify-between gap-2">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-medium text-foreground truncate">
          {ticket.player_phone}
        </span>
        <div className="flex items-center gap-2">
          <StatusChip status={ticket.status} />
          {ticket.delivery_error && (
            <span className="text-xs text-rose-600">SMS failed</span>
          )}
        </div>
        {ticket.scanned_at && (
          <span className="text-xs text-foreground-light">
            Scanned {formatDate(ticket.scanned_at)}
          </span>
        )}
      </div>
      {canResend && (
        <UiButton
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          isPending={resendingId === ticket.id}
          disabled={!!resendingId}
          onClick={() => onResend(ticket.id)}
        >
          <LuSend />
          Resend
        </UiButton>
      )}
    </div>
  );
}

// ─── Issue tickets panel ──────────────────────────────────────────────────────

function IssuePanel({ eventId }: { eventId: string }) {
  const [phones, setPhones] = useState("");
  const [result, setResult] = useState<{
    created: number;
    queued: number;
    invalid: string[];
  } | null>(null);
  const qc = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (nums: string[]) => EventsService.issueTickets(eventId, nums),
    onSuccess: (res) => {
      setResult({
        created: res.created,
        queued: res.queued,
        invalid: res.invalid_phones,
      });
      if (res.created > 0) {
        qc.invalidateQueries({ queryKey: ["events"] });
        qc.invalidateQueries({ queryKey: ["events", eventId, "tickets"] });
      }
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Failed to issue tickets." });
    },
  });

  const handleIssue = async () => {
    const nums = phones
      .split(/[\n,]+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (nums.length === 0) {
      ToastService.error({ text: "Enter at least one phone number." });
      return;
    }
    setResult(null);
    await mutateAsync(nums);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-foreground-light">
        Enter phone numbers (one per line or comma-separated). Each number
        receives a unique QR ticket and an SMS invite.
      </p>

      <Textarea
        label="Phone numbers"
        value={phones}
        onChange={(e) => setPhones(e.target.value)}
        placeholder={"+233501234567\n+233200000001\n+233244979958"}
        rows={8}
        className="font-ident"
      />

      <UiButton
        type="button"
        size="lg"
        fullWidth
        isPending={isPending}
        onClick={handleIssue}
      >
        <LuUsers />
        {isPending ? "Issuing…" : "Issue and send tickets"}
      </UiButton>

      {result && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface-100 px-5 py-4">
          <p className="text-sm font-medium text-foreground">
            {result.created} ticket{result.created !== 1 ? "s" : ""} issued ·{" "}
            {result.queued} SMS queued
          </p>
          {result.invalid.length > 0 && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5">
              <p className="mb-1 text-xs font-medium text-rose-700">
                {result.invalid.length} invalid number
                {result.invalid.length !== 1 ? "s" : ""}
              </p>
              <p className="break-all font-ident text-xs text-rose-700">
                {result.invalid.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Send SMS panel ───────────────────────────────────────────────────────────

function SendPanel({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const [resendingId, setResendingId] = useState<string | null>(null);

  const { data: undelivered = [], isFetching } = useQuery({
    queryKey: ["events", eventId, "tickets", "issued"],
    queryFn: () =>
      EventsService.fetchEventTickets(eventId, { status: "issued" }),
    enabled: !!eventId,
  });

  const { mutateAsync: sendAll, isPending: sendingAll } = useMutation({
    mutationFn: () =>
      EventsService.sendTickets(eventId, { all_undelivered: true }),
    onSuccess: (res) => {
      ToastService.success({
        text: `${res.queued} SMS message${res.queued !== 1 ? "s" : ""} queued.`,
      });
      qc.invalidateQueries({ queryKey: ["events", eventId, "tickets"] });
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Failed to send." });
    },
  });

  const { mutateAsync: sendOne } = useMutation({
    mutationFn: (ticketId: string) =>
      EventsService.sendTickets(eventId, { ticket_ids: [ticketId] }),
    onSuccess: (res) => {
      ToastService.success({ text: `${res.queued} SMS queued.` });
      qc.invalidateQueries({ queryKey: ["events", eventId, "tickets"] });
      setResendingId(null);
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Failed to send." });
      setResendingId(null);
    },
  });

  const handleResendOne = async (id: string) => {
    setResendingId(id);
    await sendOne(id);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Resend all undelivered
          </p>
          <p className="mt-0.5 text-xs text-foreground-light">
            {isFetching
              ? "…"
              : `${undelivered.length} ticket${undelivered.length !== 1 ? "s" : ""} awaiting delivery`}
          </p>
        </div>
        <UiButton
          type="button"
          size="sm"
          className="shrink-0"
          isPending={sendingAll}
          disabled={undelivered.length === 0 || isFetching}
          onClick={() => sendAll()}
        >
          <LuSend />
          {sendingAll ? "Sending…" : "Send all"}
        </UiButton>
      </div>

      {isFetching ? (
        <div className="flex justify-center py-6">
          <Spinner size="sm" className="text-brand-700" />
        </div>
      ) : undelivered.length === 0 ? (
        <p className="py-4 text-center text-xs text-foreground-light">
          No undelivered tickets.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {undelivered.map((t) => (
            <div
              key={t.id}
              className="py-2.5 flex items-center justify-between gap-2"
            >
              <div>
                <p className="text-xs font-medium text-foreground">
                  {t.player_phone}
                </p>
                {t.delivery_error && (
                  <p className="text-xs text-rose-600 mt-0.5">
                    Last error: {t.delivery_error}
                  </p>
                )}
              </div>
              <UiButton
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0"
                isPending={resendingId === t.id}
                disabled={!!resendingId || sendingAll}
                onClick={() => handleResendOne(t.id)}
              >
                <LuSend />
                Send
              </UiButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Drawer ─────────────────────────────────────────────────────────────

interface EventDrawerProps {
  event: IEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDrawer({
  event,
  isOpen,
  onClose,
}: EventDrawerProps) {
  const qc = useQueryClient();
  const [resendingId, setResendingId] = useState<string | null>(null);
  const { hasPage } = usePageAccess();

  const canViewTickets = hasPage("events.tickets_list");
  const canIssue = hasPage("events.issue_tickets");
  const canSend = hasPage("events.send_tickets");

  const { mutateAsync: sendOne } = useMutation({
    mutationFn: (ticketId: string) =>
      EventsService.sendTickets(event!.id, { ticket_ids: [ticketId] }),
    onSuccess: (res) => {
      ToastService.success({ text: `${res.queued} SMS queued.` });
      qc.invalidateQueries({ queryKey: ["events", event!.id, "tickets"] });
      setResendingId(null);
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Failed to send." });
      setResendingId(null);
    },
  });

  const handleResend = async (ticketId: string) => {
    if (!event) return;
    setResendingId(ticketId);
    await sendOne(ticketId);
  };

  return (
    <Drawer.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Drawer.Content placement="right">
        <Drawer.Dialog className={cn(drawerDialogClass, drawerWidth.form)}>
          <DrawerTitleBar
            title={event?.name ?? ""}
            description={
              event && (
                <span className="flex flex-col gap-1">
                  <span className="flex flex-wrap gap-x-3 gap-y-0.5">
                    <span className="flex items-center gap-1">
                      <LuCalendarDays className="size-3 shrink-0 text-foreground-muted" />
                      {formatDate(event.event_date)}
                    </span>
                    {event.venue && (
                      <span className="flex items-center gap-1">
                        <LuMapPin className="size-3 shrink-0 text-foreground-muted" />
                        <span className="max-w-[180px] truncate">
                          {event.venue}
                        </span>
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge tone={event.is_active ? "success" : "danger"} dot>
                      {event.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-xs text-foreground-light">
                      {event.ticket_count ?? 0} ticket
                      {event.ticket_count !== 1 ? "s" : ""}
                    </span>
                  </span>
                </span>
              )
            }
            onClose={onClose}
          />

          <Drawer.Body className={drawerBodyClass}>
            {event && (
              <>
                {!canViewTickets && !canIssue && !canSend ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-foreground-light">
                    <LuTicket className="size-8 text-foreground-muted" />
                    <p className="text-center text-xs">
                      You don&apos;t have permission to manage this event&apos;s
                      tickets.
                    </p>
                  </div>
                ) : (
                  <Tabs className="flex flex-col h-full" variant="secondary">
                    <Tabs.ListContainer className="shrink-0">
                      <Tabs.List
                        aria-label="Event management tabs"
                        className="inline-flex! w-max!"
                      >
                        {canViewTickets && (
                          <Tabs.Tab
                            id="tickets"
                            className="h-9 rounded-none px-4 text-sm"
                          >
                            Tickets
                            <Tabs.Indicator className="rounded-none bg-brand-500" />
                          </Tabs.Tab>
                        )}
                        {canIssue && (
                          <Tabs.Tab
                            id="issue"
                            className="h-9 rounded-none px-4 text-sm"
                          >
                            Issue new
                            <Tabs.Indicator className="rounded-none bg-brand-500" />
                          </Tabs.Tab>
                        )}
                        {canSend && (
                          <Tabs.Tab
                            id="send"
                            className="h-9 rounded-none px-4 text-sm"
                          >
                            Send SMS
                            <Tabs.Indicator className="rounded-none bg-brand-500" />
                          </Tabs.Tab>
                        )}
                      </Tabs.List>
                    </Tabs.ListContainer>

                    {canViewTickets && (
                      <Tabs.Panel id="tickets" className="pt-4 flex-1">
                        <TicketsPanel
                          eventId={event.id}
                          onResend={handleResend}
                          resendingId={resendingId}
                        />
                      </Tabs.Panel>
                    )}
                    {canIssue && (
                      <Tabs.Panel id="issue" className="pt-4">
                        <IssuePanel eventId={event.id} />
                      </Tabs.Panel>
                    )}
                    {canSend && (
                      <Tabs.Panel id="send" className="pt-4">
                        <SendPanel eventId={event.id} />
                      </Tabs.Panel>
                    )}
                  </Tabs>
                )}
              </>
            )}
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
