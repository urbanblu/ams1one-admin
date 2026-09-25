"use client";

import { cn } from "@heroui/react";
import React from "react";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-zinc-100 text-zinc-600",
  brand: "bg-primary-soft text-primary-strong",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-rose-50 text-rose-600",
  info: "bg-blue-50 text-blue-600",
};

const DOTS: Record<BadgeTone, string> = {
  neutral: "bg-zinc-400",
  brand: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-blue-500",
};

/** Maps free-text API statuses onto the palette. */
export function toneForStatus(status?: string | null): BadgeTone {
  const s = (status ?? "").toLowerCase().trim();
  if (
    [
      "active",
      "approved",
      "success",
      "successful",
      "completed",
      "paid",
      "confirmed",
      "delivered",
      "won",
      "published",
      "verified",
      "open",
    ].includes(s)
  )
    return "success";
  if (["pending", "processing", "in_progress", "awaiting", "review", "draft"].includes(s))
    return "warning";
  if (
    [
      "rejected",
      "failed",
      "inactive",
      "cancelled",
      "canceled",
      "expired",
      "blocked",
      "lost",
      "suspended",
      "closed",
    ].includes(s)
  )
    return "danger";
  if (["recover", "scheduled", "sent", "queued"].includes(s)) return "info";
  if (["passive"].includes(s)) return "brand";
  return "neutral";
}

type BadgeProps = {
  children: React.ReactNode;
  tone?: BadgeTone;
  /** Show a leading status dot. */
  dot?: boolean;
  className?: string;
};

export function Badge({ children, tone = "neutral", dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium capitalize whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", DOTS[tone])} />
      )}
      {children}
    </span>
  );
}

/** Badge that picks its own tone from an API status string. */
export function StatusBadge({
  status,
  dot = true,
  className,
}: {
  status?: string | null;
  dot?: boolean;
  className?: string;
}) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge tone={toneForStatus(status)} dot={dot} className={className}>
      {String(status).replace(/_/g, " ")}
    </Badge>
  );
}

export function StatusDot({
  status,
  className,
}: {
  status?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "w-2.5 h-2.5 rounded-full border-2 border-white shrink-0",
        DOTS[toneForStatus(status)],
        className,
      )}
    />
  );
}

export default Badge;
