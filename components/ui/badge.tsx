"use client";

import { cn } from "@heroui/react";
import React from "react";

export type BadgeTone =
  "neutral" | "brand" | "success" | "warning" | "danger" | "info";

/**
 * Tint fill + a matching border + the -700 text step. The border is what makes
 * these read as badges rather than as coloured text, and it is the reason the
 * fills can stay as pale as they do.
 */
const TONES: Record<BadgeTone, string> = {
  neutral: "border-border-stronger bg-surface-200 text-foreground-light",
  brand: "border-brand-300 bg-brand-100 text-brand-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
};

/**
 * The fill for a tone's dot. Exported because anything that visualises a set
 * of statuses — a dot, a legend key, a segment of a bar — has to agree with
 * the badges beside it, and the only way to guarantee that is to read the
 * same map.
 */
export const toneFill: Record<BadgeTone, string> = {
  neutral: "bg-foreground-muted",
  brand: "bg-brand-500",
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
  if (
    [
      "pending",
      "processing",
      "in_progress",
      "awaiting",
      "review",
      "draft",
    ].includes(s)
  )
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

export function Badge({
  children,
  tone = "neutral",
  dot,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-normal capitalize",
        TONES[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("size-1.5 shrink-0 rounded-full", toneFill[tone])}
        />
      )}
      {children}
    </span>
  );
}

/** Badge that picks its own tone from an API status string. */
export function StatusBadge({
  status,
  dot = true,
  tone,
  className,
}: {
  status?: string | null;
  dot?: boolean;
  /** Override the inferred tone where a status means something domain-specific. */
  tone?: BadgeTone;
  className?: string;
}) {
  if (!status) return <span className="text-foreground-muted">—</span>;
  return (
    <Badge tone={tone ?? toneForStatus(status)} dot={dot} className={className}>
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
        "size-2.5 shrink-0 rounded-full border-2 border-surface",
        toneFill[toneForStatus(status)],
        className,
      )}
    />
  );
}

export default Badge;
