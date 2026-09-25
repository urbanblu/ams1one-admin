import { notFound } from "next/navigation";
import EnvConstants from "@/constants/env_constants";
import QRCodeDisplay from "./_components/qr-code";
import {
  LuCalendarDays,
  LuMapPin,
  LuCircleAlert,
  LuCircleCheck,
  LuCircleX,
} from "react-icons/lu";

interface TicketPageProps {
  params: Promise<{ token: string }>;
}

interface TicketResponse {
  event: {
    name: string;
    event_date: string;
    venue: string;
    is_active: boolean;
  };
  ticket: {
    token: string;
    status: "delivered" | "scanned" | "revoked";
    scanned_at: string | null;
  };
}

async function getTicket(token: string): Promise<TicketResponse | null> {
  try {
    const res = await fetch(
      `${EnvConstants.API_BASE_URL}/api/v1/events/public/${token}/`,
      { cache: "no-store" },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed to fetch ticket");
    return res.json();
  } catch {
    return null;
  }
}

function formatEventDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatScannedAt(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type StatusBannerProps = {
  type: "scanned" | "revoked" | "inactive";
  scannedAt?: string | null;
};

function StatusBanner({ type, scannedAt }: StatusBannerProps) {
  if (type === "scanned") {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-amber-700">
        <LuCircleCheck className="mt-0.5 size-5 shrink-0 text-amber-500" />
        <p className="text-sm font-medium leading-snug">
          This ticket was already used
          {scannedAt ? ` on ${formatScannedAt(scannedAt)}` : ""}.
        </p>
      </div>
    );
  }

  if (type === "revoked") {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-rose-50 px-4 py-3 text-rose-700">
        <LuCircleX className="mt-0.5 size-5 shrink-0 text-rose-500" />
        <p className="text-sm font-medium leading-snug">
          This ticket has been cancelled.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-subtle px-4 py-3 text-muted-foreground">
      <LuCircleAlert className="mt-0.5 size-5 shrink-0 text-zinc-400" />
      <p className="text-sm font-medium leading-snug">
        This event is no longer active.
      </p>
    </div>
  );
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { token } = await params;
  const data = await getTicket(token);

  if (!data) notFound();

  const { event, ticket } = data;

  const isInvalid =
    ticket.status === "scanned" ||
    ticket.status === "revoked" ||
    !event.is_active;

  const bannerType: "scanned" | "revoked" | "inactive" | null =
    ticket.status === "scanned"
      ? "scanned"
      : ticket.status === "revoked"
        ? "revoked"
        : !event.is_active
          ? "inactive"
          : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border-subtle bg-surface">
        {/* Event info */}
        <div className="relative overflow-hidden bg-brand-gradient px-8 py-7 text-center">
          <div className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full bg-white/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-dot-grid opacity-[0.06]" />
          <div className="relative space-y-1">
            <h1 className="text-2xl font-bold leading-tight text-white">
              {event.name}
            </h1>
            <div className="flex items-center justify-center gap-1.5 pt-1 text-sm text-white/80">
              <LuCalendarDays className="size-4 shrink-0" />
              <span>{formatEventDate(event.event_date)}</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-sm text-white/60">
              <LuMapPin className="size-4 shrink-0" />
              <span>{event.venue}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 p-6 sm:p-8">
          {/* Status banner */}
          {bannerType && (
            <div className="w-full">
              <StatusBanner type={bannerType} scannedAt={ticket.scanned_at} />
            </div>
          )}

          {/* QR code */}
          <QRCodeDisplay token={ticket.token} dimmed={isInvalid} />

          {/* Footer note */}
          <p className="text-center text-xs text-muted-foreground">
            {isInvalid
              ? "This QR code is no longer valid."
              : "Show this QR at the gate. Don\u2019t share it — single use only."}
          </p>
        </div>
      </div>
    </main>
  );
}
