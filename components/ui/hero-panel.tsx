"use client";

import { cn } from "@heroui/react";
import React from "react";

type HeroPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Set false when the panel is built from zones that need to reach its
   * edges. The zones then carry the `px-5` gutter themselves.
   */
  padded?: boolean;
};

/**
 * The dark panel used to head a primary screen.
 *
 * The old version was a violet gradient with blurred highlights. This design
 * language has no gradients, so emphasis comes from inverting the surface
 * instead: near-black fill, faint line grid, white type. The brand still
 * appears inside it, on the figures that matter.
 *
 * It is the only loud surface in the system, so it has to carry something
 * worth being loud about — a figure people watch, and what that figure is
 * made of. A row of small numbers spread across a wide black slab is the
 * failure mode, and the cure is zones: two or three groups, each internally
 * coherent, divided by a hairline. Never `justify-between` with two children,
 * which parks every fact on an edge and fills the middle with nothing.
 */
export function HeroPanel({
  className,
  children,
  padded = true,
  ...rest
}: HeroPanelProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border border-foreground bg-foreground",
        padded && "p-5",
        className,
      )}
      {...rest}
    >
      <div className="bg-line-grid pointer-events-none absolute inset-0" />
      <div className="relative">{children}</div>
    </div>
  );
}

/**
 * The hairline between two zones of a panel — vertical once they sit side by
 * side, horizontal while they are still stacked.
 */
export function HeroDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "h-px w-full shrink-0 bg-white/15 lg:h-auto lg:w-px lg:self-stretch",
        className,
      )}
    />
  );
}

/** Heads a zone. Every zone in a panel gets one, so the split reads as intent. */
function HeroZoneLabel({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && (
        <span className="shrink-0 text-white/40 [&>svg]:size-3.5">{icon}</span>
      )}
      <p className="truncate text-xs text-white/60">{children}</p>
    </div>
  );
}

type HeroStatProps = {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  /**
   * The line under the figure: what the figure covers and what it is made of.
   * These belong beneath it rather than across the panel — a ticket count
   * parked on the far edge is a fact the reader has to carry back.
   */
  scope?: React.ReactNode;
  /**
   * Dims the figure. For a true but uneventful number — a day that has not
   * started. A zero is not news, and shouting it reads as an outage.
   */
  isMuted?: boolean;
  isLoading?: boolean;
  className?: string;
};

/** The headline figure a HeroPanel opens with. A panel carries exactly one. */
export function HeroStat({
  label,
  value,
  icon,
  scope,
  isMuted,
  isLoading,
  className,
}: HeroStatProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2.5", className)}>
      <HeroZoneLabel icon={icon}>{label}</HeroZoneLabel>

      {isLoading ? (
        <div className="h-9 w-56 animate-pulse rounded bg-white/15" />
      ) : (
        <p
          className={cn(
            "text-3xl font-medium leading-none tracking-tight tabular-nums sm:text-4xl",
            isMuted ? "text-white/45" : "text-white",
          )}
        >
          {value}
        </p>
      )}

      {scope !== undefined &&
        (isLoading ? (
          <div className="h-4 w-64 animate-pulse rounded bg-white/10" />
        ) : (
          <div className="text-xs text-white/55">{scope}</div>
        ))}
    </div>
  );
}

/**
 * A fact in a panel's scope line. The figure carries the emphasis; the noun
 * after it does not. `HeroScope`'s sibling for the inverted surface, where
 * the slate greys the rest of the app uses are too loud.
 */
export function HeroFact({
  value,
  label,
}: {
  value: React.ReactNode;
  label?: string;
}) {
  return (
    <span>
      <span className="font-medium tabular-nums text-white/90">{value}</span>
      {label ? ` ${label}` : null}
    </span>
  );
}

/**
 * The line under a headline figure: what it covers and what it is made of.
 *
 * Each separator travels with the fact it introduces, so a line that wraps
 * never ends on a dangling middot. Falsy entries drop out, which lets a
 * caller gate a fact on a permission inline without leaving a gap behind.
 */
export function HeroScope({ facts }: { facts: React.ReactNode[] }) {
  const visible = facts.filter(Boolean);

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {visible.map((fact, index) => (
        <span key={index} className="flex items-center gap-x-2">
          {index > 0 && (
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
          )}
          {fact}
        </span>
      ))}
    </span>
  );
}

const TONE_FILL = {
  brand: "bg-brand-400",
  muted: "bg-white/30",
  danger: "bg-rose-400/80",
} as const;

export type HeroLedgerEntry = {
  key: string;
  label: string;
  value: React.ReactNode;
  /** A second fact riding after the value — a share, a count. */
  hint?: React.ReactNode;
  /** Share of the track, 0–1. Shares over 1 in total are scaled to fit. */
  share: number;
  tone?: keyof typeof TONE_FILL;
};

/**
 * The zone that answers where a HeroPanel's headline figure went.
 *
 * The figures here are not independent KPIs — sales less payouts is revenue —
 * and a row of tiles throws that away, then fills the leftover width with
 * air. One track carries the proportion, so it is legible before a single
 * number is read, and the entries under it are a ledger rather than a
 * sentence: labels in one column, figures in the next, the trailing fact
 * flush right. Three columns that line up read as arithmetic; the same facts
 * strung along a line read as prose.
 *
 * The track is decoration over the ledger, which carries every figure as
 * text, so it is hidden from assistive tech rather than described twice.
 *
 * On a day with nothing to divide, `empty` replaces the whole ledger. A row
 * of zeroes under a flat grey rail is four facts the reader has to work
 * through to learn there are none.
 */
export function HeroLedger({
  label,
  icon,
  entries,
  isEmpty,
  empty,
  isLoading,
  className,
}: {
  label: string;
  icon?: React.ReactNode;
  entries: HeroLedgerEntry[];
  isEmpty?: boolean;
  empty?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}) {
  /* A track that renders past its own end is worse than one that rounds: if
     the shares are inconsistent, scale them rather than overflow. */
  const total = entries.reduce((sum, e) => sum + Math.max(0, e.share), 0);
  const scale = total > 1 ? 1 / total : 1;

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      <HeroZoneLabel icon={icon}>{label}</HeroZoneLabel>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <div className="h-1.5 w-full animate-pulse rounded-full bg-white/10" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-2/5 animate-pulse rounded bg-white/10" />
        </div>
      ) : isEmpty && empty !== undefined ? (
        empty
      ) : (
        <>
          <div
            aria-hidden="true"
            className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10"
          >
            {entries.map((entry) => {
              const width = Math.max(0, entry.share) * scale * 100;
              if (width <= 0) return null;
              return (
                <div
                  key={entry.key}
                  style={{ width: `${width}%` }}
                  /* A sliver still has to be visible. */
                  className={cn("min-w-0.5", TONE_FILL[entry.tone ?? "brand"])}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-[auto_auto_1fr] items-baseline gap-x-4 gap-y-2">
            {entries.map((entry) => (
              <React.Fragment key={entry.key}>
                <span className="flex items-baseline gap-2 whitespace-nowrap text-xs text-white/60">
                  <span
                    className={cn(
                      "size-1.5 shrink-0 translate-y-[-1px] rounded-full",
                      TONE_FILL[entry.tone ?? "brand"],
                    )}
                  />
                  {entry.label}
                </span>
                <span className="whitespace-nowrap text-sm font-medium tabular-nums text-white">
                  {entry.value}
                </span>
                {/* white/50 is the floor that still clears 4.5:1 on the
                    near-black fill — white/40 reads as 3.8:1. */}
                <span className="min-w-0 text-xs text-white/50">
                  {entry.hint}
                </span>
              </React.Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default HeroPanel;
