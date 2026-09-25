"use client";

import type { BadgeTone } from "@/components/ui";
import {
  Badge,
  drawerDialogClass,
  drawerWidth,
} from "@/components/ui";

import React, { useState } from "react";
import { Button, CloseButton, cn, Drawer, Spinner, Tabs } from "@heroui/react";
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
  const { label, tone } = STATUS_CHIP[status] ?? STATUS_CHIP.issued;
  return <Badge tone={tone}>{label}</Badge>;
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
      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 shrink-0">
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-colors",
              filter === s
                ? "bg-primary text-white border-primary"
                : "bg-white text-muted-foreground border-border hover:border-border",
            )}
          >
            {s === "all" ? "All" : STATUS_CHIP[s].label}
          </button>
        ))}
      </div>

      {/* List */}
      {isFetching ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="sm" className="text-primary" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-zinc-400 py-8">
          <LuTicket className="w-8 h-8" />
          <p className="text-xs">
            No tickets{filter !== "all" ? ` with status "${filter}"` : ""}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle overflow-y-auto">
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
        <span className="text-sm font-semibold text-foreground truncate">
          {ticket.player_phone}
        </span>
        <div className="flex items-center gap-2">
          <StatusChip status={ticket.status} />
          {ticket.delivery_error && (
            <span className="text-[10px] text-rose-500">SMS failed</span>
          )}
        </div>
        {ticket.scanned_at && (
          <span className="text-[10px] text-zinc-400">
            Scanned {formatDate(ticket.scanned_at)}
          </span>
        )}
      </div>
      {canResend && (
        <Button
          size="sm"
          isPending={resendingId === ticket.id}
          isDisabled={!!resendingId}
          onClick={() => onResend(ticket.id)}
          className="shrink-0 text-[10px] font-semibold text-primary bg-primary-soft h-7 px-2.5"
        >
          <LuSend className="w-3 h-3" />
          Resend
        </Button>
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
      <p className="text-xs text-muted-foreground">
        Enter phone numbers (one per line or comma-separated). Each number
        receives a unique QR ticket and an SMS invite.
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground font-semibold">
          Phone Numbers
        </label>
        <textarea
          value={phones}
          onChange={(e) => setPhones(e.target.value)}
          placeholder={"+233501234567\n+233200000001\n+233244979958"}
          rows={8}
          className="w-full border border-border rounded-md px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:border-primary"
        />
      </div>

      <Button
        onClick={handleIssue}
        isPending={isPending}
        isDisabled={isPending}
        className="h-11 w-full cursor-pointer rounded-xl bg-brand-gradient text-sm font-semibold text-white transition-all hover:opacity-95 disabled:opacity-60"
      >
        {isPending ? (
          <Spinner size="sm" color="current" />
        ) : (
          <>
            <LuUsers className="w-3.5 h-3.5" />
            Issue &amp; Send Tickets
          </>
        )}
      </Button>

      {result && (
        <div className="rounded-xl border border-border bg-surface-muted p-4 flex flex-col gap-2">
          <p className="text-sm font-semibold text-foreground">
            {result.created} ticket{result.created !== 1 ? "s" : ""} issued ·{" "}
            {result.queued} SMS queued
          </p>
          {result.invalid.length > 0 && (
            <div>
              <p className="text-xs text-rose-600 font-semibold mb-1">
                {result.invalid.length} invalid number
                {result.invalid.length !== 1 ? "s" : ""}:
              </p>
              <p className="text-xs text-rose-500 font-mono break-all">
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
      <div className="rounded-xl border border-border p-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Resend all undelivered
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isFetching
              ? "…"
              : `${undelivered.length} ticket${undelivered.length !== 1 ? "s" : ""} awaiting delivery`}
          </p>
        </div>
        <Button
          size="sm"
          isPending={sendingAll}
          isDisabled={undelivered.length === 0 || isFetching}
          onClick={() => sendAll()}
          className="bg-primary text-white text-xs font-semibold rounded-lg shrink-0"
        >
          {sendingAll ? (
            <Spinner size="sm" color="current" />
          ) : (
            <>
              <LuSend className="w-3.5 h-3.5" /> Send All
            </>
          )}
        </Button>
      </div>

      {isFetching ? (
        <div className="flex justify-center py-6">
          <Spinner size="sm" className="text-primary" />
        </div>
      ) : undelivered.length === 0 ? (
        <p className="text-xs text-zinc-400 text-center py-4">
          No undelivered tickets.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle">
          {undelivered.map((t) => (
            <div
              key={t.id}
              className="py-2.5 flex items-center justify-between gap-2"
            >
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {t.player_phone}
                </p>
                {t.delivery_error && (
                  <p className="text-[10px] text-rose-500 mt-0.5">
                    Last error: {t.delivery_error}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                isPending={resendingId === t.id}
                isDisabled={!!resendingId || sendingAll}
                onClick={() => handleResendOne(t.id)}
                className="shrink-0 text-[10px] font-semibold text-primary bg-primary-soft h-7 px-2.5"
              >
                <LuSend className="w-3 h-3" />
                Send
              </Button>
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
      <Drawer.Content
        placement="right"
        className={drawerWidth.form}
      >
        <Drawer.Dialog className={cn(drawerDialogClass, "flex h-full w-full flex-col")}>
          <Drawer.Header className="border-b border-border-subtle pb-4 shrink-0">
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="flex flex-col gap-0.5 min-w-0">
                <Drawer.Heading className="text-sm font-bold text-foreground">
                  {event?.name ?? ""}
                </Drawer.Heading>
                {event && (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <LuCalendarDays className="w-3 h-3 shrink-0" />
                      {formatDate(event.event_date)}
                    </span>
                    {event.venue && (
                      <span className="flex items-center gap-1 text-xs text-zinc-400">
                        <LuMapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[180px]">
                          {event.venue}
                        </span>
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1.5">
<Badge tone={event?.is_active ? "success" : "danger"} dot>
                    {event?.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-[10px] text-zinc-400">
                    {event?.ticket_count ?? 0} ticket
                    {event?.ticket_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <CloseButton
                className="bg-transparent text-black shrink-0"
                onClick={onClose}
              />
            </div>
          </Drawer.Header>

          <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
            {event && (
              <>
                {!canViewTickets && !canIssue && !canSend ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400 py-16">
                    <LuTicket className="w-8 h-8" />
                    <p className="text-xs text-center">
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
                            className="h-9 rounded-xl px-4 text-sm"
                          >
                            Tickets
                            <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
                          </Tabs.Tab>
                        )}
                        {canIssue && (
                          <Tabs.Tab
                            id="issue"
                            className="h-9 rounded-xl px-4 text-sm"
                          >
                            Issue new
                            <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
                          </Tabs.Tab>
                        )}
                        {canSend && (
                          <Tabs.Tab
                            id="send"
                            className="h-9 rounded-xl px-4 text-sm"
                          >
                            Send SMS
                            <Tabs.Indicator className="rounded-xl bg-brand-gradient" />
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
