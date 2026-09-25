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
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
        <LuCircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm font-medium leading-snug">
          This ticket was already used
          {scannedAt ? ` on ${formatScannedAt(scannedAt)}` : ""}.
        </p>
      </div>
    );
  }

  if (type === "revoked") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
        <LuCircleX className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
        <p className="text-sm font-medium leading-snug">
          This ticket has been cancelled.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600">
      <LuCircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
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
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg p-8 flex flex-col items-center gap-6">
        {/* Event info */}
        <div className="w-full text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {event.name}
          </h1>
          <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 pt-1">
            <LuCalendarDays className="h-4 w-4 shrink-0" />
            <span>{formatEventDate(event.event_date)}</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-sm text-gray-400">
            <LuMapPin className="h-4 w-4 shrink-0" />
            <span>{event.venue}</span>
          </div>
        </div>

        {/* Status banner */}
        {bannerType && (
          <div className="w-full">
            <StatusBanner type={bannerType} scannedAt={ticket.scanned_at} />
          </div>
        )}

        {/* QR code */}
        <QRCodeDisplay token={ticket.token} dimmed={isInvalid} />

        {/* Footer note */}
        <p className="text-xs text-gray-400 text-center">
          {isInvalid
            ? "This QR code is no longer valid."
            : "Show this QR at the gate. Don't share it — single use only."}
        </p>
      </div>
    </main>
  );
}
