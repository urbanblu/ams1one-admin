"use client";

import { cn } from "@heroui/react";
import React from "react";
import { Skeleton, toneFill, toneForStatus } from "@/components/ui";
import type {
  ILmcDetailCard,
  ILmcOperational,
} from "@/interfaces/lmc.interface";

const countFormat = new Intl.NumberFormat("en-US");
const moneyFormat = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * The five states a writer can be in, in the order the bar stacks them:
 * working down from the one you want to the one you don't.
 *
 * The colours are not chosen here. Each state is run through the design
 * system's own `toneForStatus`, which already decides that "active" is a
 * success, "passive" is brand, "inactive" is a danger and "recover" is info —
 * so a segment of this bar is the same colour as the badge that state would
 * wear anywhere else in the console.
 */
const WRITER_STATES = [
  { key: "active", label: "active" },
  { key: "passive", label: "passive" },
  { key: "inactive", label: "inactive" },
  { key: "recover", label: "recover" },
  { key: "no_use", label: "no use" },
] as const satisfies readonly { key: keyof ILmcOperational; label: string }[];

/**
 * One supervisor, at list altitude.
 *
 * The card's centre is the writer composition, because that is the only thing
 * on it that differs in *shape* from one supervisor to the next. Every
 * previous version printed the same four labels on twenty cards and left the
 * reader to diff three small numbers; a supervisor with five idle writers and
 * one with five working writers now look different from across the room.
 *
 * `operational` already returns the breakdown, so this costs no extra call —
 * the data was being fetched and thrown away.
 *
 * No avatar: two initials in a circle is what made twenty of these read as a
 * template, and it stood in for a photo almost nobody has.
 */
export function SupervisorCard({
  card,
  onOpen,
}: {
  card: ILmcDetailCard;
  /** Omit to render the card inert — no hover, no keyboard target. */
  onOpen?: () => void;
}) {
  const segments = WRITER_STATES.map((state) => ({
    ...state,
    count: Number(card.operational[state.key]) || 0,
  })).filter((s) => s.count > 0);

  const counted = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (!onOpen) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors",
        onOpen &&
          "cursor-pointer hover:border-brand-300 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500",
      )}
    >
      <div className="px-4 pb-4 pt-3.5">
        <div className="flex items-baseline justify-between gap-2">
          {/* Truncates before the status does — a name can be cut short and
              still be recognised; a status that disappears is a lie. */}
          <p
            className={cn(
              "min-w-0 flex-1 truncate text-base font-medium tracking-tight text-foreground transition-colors",
              onOpen && "group-hover:text-brand-700",
            )}
          >
            {card.name}
          </p>
          <span
            className={cn(
              "shrink-0 text-xs font-medium",
              card.is_active ? "text-emerald-700" : "text-rose-700",
            )}
          >
            {card.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        <p className="mt-0.5 flex items-baseline gap-1.5 text-xs text-foreground-light">
          <span className="truncate tabular-nums">{card.phone}</span>
          <span aria-hidden className="text-foreground-muted">
            ·
          </span>
          <span className="font-ident shrink-0 text-brand-700">
            {card.code}
          </span>
        </p>

        <WriterComposition
          segments={segments}
          counted={counted}
          total={card.operational.writers_total}
        />
      </div>

      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-border bg-surface-100 px-4 py-2">
        <Figure
          value={countFormat.format(card.operational.pos_issued)}
          label="POS issued"
          isZero={card.operational.pos_issued === 0}
        />
        <Figure
          value={moneyFormat.format(card.financial.wallet_balance)}
          label="USD"
          isZero={card.financial.wallet_balance === 0}
        />
      </div>
    </div>
  );
}

type Segment = { key: string; label: string; count: number };

/**
 * The writer roster as one bar.
 *
 * Three states this has to survive, because the API can produce all of them:
 * a real breakdown, a supervisor with no writers at all, and a `writers_total`
 * that no per-state field accounts for. Only the first draws a bar — the
 * other two say what they know in words rather than showing an empty trough
 * and letting the reader guess whether it means zero or means broken.
 */
function WriterComposition({
  segments,
  counted,
  total,
}: {
  segments: Segment[];
  /** What the per-state fields add up to — not necessarily `total`. */
  counted: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <p className="mt-3 text-xs text-foreground-light">No writers assigned</p>
    );
  }

  if (counted === 0) {
    return (
      <p className="mt-3 text-xs text-foreground-light">
        <span className="font-medium tabular-nums text-foreground">
          {countFormat.format(total)}
        </span>{" "}
        {total === 1 ? "writer" : "writers"}
        <span className="text-foreground-lighter">
          {" "}
          · breakdown unavailable
        </span>
      </p>
    );
  }

  return (
    <div className="mt-3">
      {/* The legend below states every number in text, so the bar itself is
          decoration over data the reader already has — and colour is never
          the only carrier. */}
      <div
        aria-hidden
        className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-surface-200"
      >
        {segments.map((s) => (
          <span
            key={s.key}
            style={{ flexGrow: s.count }}
            className={cn("h-full", toneFill[toneForStatus(s.key)])}
          />
        ))}
      </div>

      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-light">
        {segments.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                toneFill[toneForStatus(s.key)],
              )}
            />
            <span className="font-medium tabular-nums text-foreground">
              {countFormat.format(s.count)}
            </span>
            {s.label}
          </span>
        ))}
      </p>
    </div>
  );
}

function Figure({
  value,
  label,
  isZero,
}: {
  value: string;
  label: string;
  /** Dims the figure. A zero is still worth printing, but across the grid it
      should leave the real figures as the dark ones. */
  isZero?: boolean;
}) {
  return (
    <span className="min-w-0 truncate text-xs text-foreground-light">
      <span
        className={cn(
          "font-medium tabular-nums",
          /* `light` rather than `lighter`: on the surface-100 footer fill the
             lighter step is 4.25:1, under AA. */
          isZero ? "text-foreground-light" : "text-foreground",
        )}
      >
        {value}
      </span>{" "}
      {label}
    </span>
  );
}

export function SupervisorCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
      <div className="px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-2.5 w-12 shrink-0" />
        </div>
        <Skeleton className="mt-1.5 h-2.5 w-40" />
        <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
        <Skeleton className="mt-2 h-2.5 w-44" />
      </div>
      <div className="mt-auto flex items-baseline justify-between gap-3 border-t border-border bg-surface-100 px-4 py-2">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  );
}

export default SupervisorCard;
