"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LuChartSpline } from "react-icons/lu";

import SalesService from "@/api/sales";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui";
import ChartColors from "@/utils/chart-colors";
import { formatUsd } from "@/utils/currency";

/** The plot itself. Still short — the table below it is the page's main event
 *  — but a line needs more room than bars did, or every hour slopes into the
 *  one beside it and the shape of the day flattens out. */
const PLOT_HEIGHT = 148;
/** Roughly what the hour ticks take out of the bottom of the plot. */
const AXIS_ROW_HEIGHT = 24;

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/* The server can't know the preference, so it assumes the cautious answer. */
const usePrefersReducedMotion = () =>
  React.useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(MOTION_QUERY).matches,
    () => true,
  );

/**
 * The hour a ticket was sold, read straight off the server's string rather
 * than through `new Date`.
 *
 * `"2026-04-27 22:16:00"` carries no offset, so parsing it yields a local
 * timestamp whose wall clock happens to round-trip unchanged — but only by
 * accident. Slicing the hour out is the same answer with none of the drift,
 * and it is the hour the table beside this chart prints.
 */
function hourOf(time: string): number | null {
  const hour = Number(time.slice(11, 13));
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

/** `9am`, `12pm` — the hour as people say it, short of the `:00` a tick
 *  doesn't need. */
function hourTick(hour: number) {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${hour < 12 ? "am" : "pm"}`;
}

/** `8:00 PM` — the hour on a clock, for prose rather than for an axis. */
function clockHour(hour: number) {
  const wrapped = hour % 24;
  const h12 = wrapped % 12 === 0 ? 12 : wrapped % 12;
  return `${h12}:00 ${wrapped < 12 ? "AM" : "PM"}`;
}

/** `8:00 PM – 9:00 PM`. A point covers an hour, so the tooltip names both ends. */
function hourRange(hour: number) {
  return `${clockHour(hour)} – ${clockHour(hour + 1)}`;
}

/** Axis ticks get `1.2k`, not `USD 1,200.00`. The tooltip carries the exact figure. */
function compactAmount(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  }
  return Math.round(value).toLocaleString("en-US");
}

type HourBucket = {
  hour: number;
  label: string;
  amount: number;
  tickets: number;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: HourBucket }>;
}) {
  if (!active || !payload?.length) return null;
  const { hour, amount, tickets } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-overlay">
      <p className="font-medium text-foreground">{hourRange(hour)}</p>
      <p className="mt-1 font-medium tabular-nums text-foreground">
        {formatUsd(amount)}
      </p>
      <p className="mt-0.5 text-foreground-light">
        <span className="tabular-nums">{tickets.toLocaleString("en-US")}</span>
        {tickets === 1 ? " ticket" : " tickets"}
      </p>
    </div>
  );
}

/**
 * The busiest hour, written above its own point.
 *
 * The brand violet only reaches 2.96:1 against white, which is under the 3:1
 * floor, so the chart owes the reader relief that isn't colour: a labelled
 * axis, this label on the point people are looking for, and the table below.
 *
 * It matches on the value rather than on the row index — a `LabelList`
 * content renderer numbers the labels it draws, which is not the same
 * sequence as the data when an hour sold nothing.
 *
 * `hourCount` is only here to keep the text off the plot's edges. A peak in
 * the first or last hour sits directly on the y-axis or the right margin, so
 * those two anchor their text inward instead of centring it on the point.
 */
function makePeakLabel(peakAmount: number, hourCount: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function PeakLabel(props: any) {
    const {
      x = 0,
      y = 0,
      value = 0,
      index = 0,
    } = props as { x: number; y: number; value: number; index: number };
    if (value !== peakAmount || value <= 0) return <g />;
    const anchor =
      index === 0 ? "start" : index === hourCount - 1 ? "end" : "middle";
    return (
      <text
        x={x}
        /* Clear of the dot and its ring, not merely of the line. */
        y={y - 11}
        textAnchor={anchor}
        fontSize={10}
        fill={ChartColors.label}
      >
        {compactAmount(value)}
      </text>
    );
  };
}

/**
 * A point on the line.
 *
 * Every hour carries one while the day is short enough to hold them, and on a
 * day with a single selling hour the dot *is* the chart — a line drawn through
 * one point renders nothing at all. Once the hours outnumber the room the dots
 * turn into beading along the line, so only the peak keeps its own, which is
 * also the one the direct label needs to sit on.
 *
 * The white ring is the spacer: it keeps a dot legible where the line passes
 * beneath it without a border adding ink that isn't data.
 */
function makePointDot(showEveryPoint: boolean, peakHour: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function PointDot(props: any) {
    const { cx, cy, index, payload } = props as {
      cx?: number;
      cy?: number;
      index: number;
      payload?: HourBucket;
    };
    const isPeak = payload?.hour === peakHour;
    if (cx == null || cy == null || (!showEveryPoint && !isPeak)) {
      return <g key={`dot-${index}`} />;
    }
    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={isPeak ? 4 : 3}
        fill={ChartColors.brandStrong}
        stroke="#ffffff"
        strokeWidth={2}
      />
    );
  };
}

/** The silhouette the skeleton traces, as percentages of the plot's height. */
const SKELETON_SHAPE = [28, 46, 34, 62, 88, 71, 96, 58, 44, 66, 39, 24];

/**
 * The shape of the answer while the sweep runs.
 *
 * It traces a plausible day rather than filling the row: a skeleton that
 * resolves into a differently proportioned chart reads as a layout correction,
 * not as loading. Now that the chart is a line, so is this — a block here
 * would promise a solid the plot never delivers.
 */
function PlotSkeleton() {
  const plotHeight = PLOT_HEIGHT - AXIS_ROW_HEIGHT;
  /* Traced in a 100×100 box and stretched to the plot's own, so the silhouette
     holds its proportions at any card width. */
  const step = 100 / (SKELETON_SHAPE.length - 1);
  const points = SKELETON_SHAPE.map(
    (height, index) => `${index * step},${100 - height}`,
  ).join(" ");

  return (
    <div aria-hidden="true">
      {/* Indented past the room the y-axis ticks will take, so the line starts
          where the real one will. */}
      <div className="animate-pulse pl-[38px]" style={{ height: plotHeight }}>
        <svg
          className="h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polygon
            points={`0,100 ${points} 100,100`}
            className="fill-surface-200"
          />
        </svg>
      </div>
      <div style={{ height: AXIS_ROW_HEIGHT }} />
      {/* Holds the row the average legend will occupy, so the card doesn't
          grow by a line the moment the figures land. */}
      <div className="mt-1.5 h-4 w-44 animate-pulse rounded bg-surface-200" />
    </div>
  );
}

function PlotMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center text-xs text-foreground-light"
      style={{ height: PLOT_HEIGHT }}
    >
      {children}
    </div>
  );
}

/**
 * How today's sales arrived, hour by hour.
 *
 * The panel above answers *how much*; this answers *when*, which is the only
 * other question an operator asks of a trading day — where the peak sits,
 * whether the afternoon went quiet, whether the day is still running.
 *
 * Money per hour is the single measure, drawn as a line because the question
 * is the day's shape — where it climbed, where it went quiet — and a run of
 * bars makes the reader assemble that shape from twelve separate heights. A
 * cumulative second line over the same plot would need a second y-scale, and a
 * second y-scale is a chart that can be read two ways; the running total
 * already has the largest figure on the screen directly above.
 */
function IntradaySalesChart() {
  const reducedMotion = usePrefersReducedMotion();

  const {
    data: timeline,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["sales", "today-timeline"],
    queryFn: SalesService.fetchTodayTicketTimeline,
    /* The sweep is several requests on a busy day. A minute of staleness is
       cheap next to re-walking the whole list on every tab switch. */
    staleTime: 60_000,
  });

  const buckets: HourBucket[] = useMemo(() => {
    const points = timeline?.points ?? [];
    if (points.length === 0) return [];

    const amounts = new Map<number, number>();
    const counts = new Map<number, number>();

    for (const point of points) {
      const hour = hourOf(point.time);
      if (hour === null) continue;
      amounts.set(hour, (amounts.get(hour) ?? 0) + point.amount);
      counts.set(hour, (counts.get(hour) ?? 0) + 1);
    }
    if (amounts.size === 0) return [];

    /* Span the first selling hour to the last and fill what lies between,
       zeros included: an hour that sold nothing is a fact about the day, and
       dropping it would pull the line straight across the gap and hide the
       lull. */
    const hours = [...amounts.keys()];
    const firstHour = Math.min(...hours);
    const lastHour = Math.max(...hours);

    const series: HourBucket[] = [];
    for (let hour = firstHour; hour <= lastHour; hour += 1) {
      series.push({
        hour,
        label: hourTick(hour),
        amount: amounts.get(hour) ?? 0,
        tickets: counts.get(hour) ?? 0,
      });
    }
    return series;
  }, [timeline?.points]);

  const { peakHour, peakAmount, averageAmount } = useMemo(() => {
    if (buckets.length === 0) {
      return { peakHour: -1, peakAmount: 0, averageAmount: 0 };
    }
    let best = 0;
    for (let i = 1; i < buckets.length; i += 1) {
      if (buckets[i].amount > buckets[best].amount) best = i;
    }
    const total = buckets.reduce((sum, b) => sum + b.amount, 0);
    return {
      peakHour: buckets[best].hour,
      peakAmount: buckets[best].amount,
      averageAmount: total / buckets.length,
    };
  }, [buckets]);

  /* One hour is a figure, not a distribution — an average line across it
     says nothing the point doesn't. */
  const showAverage = buckets.length > 2 && averageAmount > 0;

  /* Every tick on a 16-hour day collides well before tablet width, and `10am`
     is twice the tick `10a` was; thin them until roughly six survive. */
  const tickInterval = Math.max(0, Math.ceil(buckets.length / 6) - 1);

  /* Past a dozen hours the dots stop marking readings and start beading the
     line, so beyond that only the peak keeps one. */
  const showEveryPoint = buckets.length <= 12;

  return (
    <Card>
      <CardHeader
        icon={<LuChartSpline />}
        title="Sales through the day"
        description="Ticket value per hour"
      />

      <CardBody className="py-3">
        {isPending ? (
          <PlotSkeleton />
        ) : isError ? (
          <PlotMessage>
            The day’s hourly breakdown couldn’t be loaded.
          </PlotMessage>
        ) : buckets.length === 0 ? (
          <PlotMessage>
            Nothing sold yet today — the shape of the day builds here.
          </PlotMessage>
        ) : (
          <>
            <div style={{ height: PLOT_HEIGHT }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={buckets}
                  /* Room at the top for the peak's label, and enough on the
                     right that the last point's dot isn't halved by the card. */
                  margin={{ top: 18, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    stroke={ChartColors.grid}
                    strokeDasharray="0"
                  />
                  <XAxis
                    dataKey="label"
                    interval={tickInterval}
                    tickLine={false}
                    axisLine={{ stroke: ChartColors.grid }}
                    tick={{ fontSize: 10, fill: ChartColors.axis }}
                    tickMargin={6}
                    /* A line runs to the edges of its plot where bars sat
                       inside theirs; without this the first and last dots
                       straddle the axis. */
                    padding={{ left: 12, right: 12 }}
                  />
                  <YAxis
                    width={38}
                    tickCount={3}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10, fill: ChartColors.axis }}
                    tickFormatter={compactAmount}
                  />
                  <Tooltip
                    content={<ChartTooltip />}
                    /* A band under a line points at nothing in particular; a
                       crosshair names the hour the tooltip is describing. */
                    cursor={{
                      stroke: ChartColors.reference,
                      strokeWidth: 1,
                    }}
                  />
                  {showAverage && (
                    <ReferenceLine
                      y={averageAmount}
                      stroke={ChartColors.reference}
                      strokeDasharray="3 3"
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="amount"
                    /* The stroke carries the reading, so it takes the darker
                       step; the wash underneath only gives the line a side to
                       belong to and stays well out of the gridlines' way. */
                    stroke={ChartColors.brandStrong}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill={ChartColors.brand}
                    fillOpacity={0.12}
                    dot={makePointDot(showEveryPoint, peakHour)}
                    activeDot={{
                      r: 4,
                      fill: ChartColors.brandStrong,
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                    isAnimationActive={!reducedMotion}
                    animationDuration={520}
                  >
                    <LabelList
                      dataKey="amount"
                      content={makePeakLabel(peakAmount, buckets.length)}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* The plot's annotations, on one line that wraps.
                Neither belongs on the plot or in the header: Recharts writes
                a ReferenceLine's label over the plot it ends in,
                and `CardHeader` renders its action in a `shrink-0` slot, so a
                figure this long would sit there refusing to give ground. Down
                here the pair wraps onto two lines on a narrow card, and the
                dashed swatch doubles as the average line's legend. */}
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-light">
              {showAverage && (
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="inline-block w-4 shrink-0 border-t border-dashed border-border-strong"
                  />
                  <span>
                    Hourly average{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {formatUsd(averageAmount)}
                    </span>
                  </span>
                </span>
              )}

              {peakHour >= 0 && (
                <span>
                  Busiest{" "}
                  <span className="font-medium text-foreground">
                    {clockHour(peakHour)}
                  </span>
                  <span aria-hidden="true"> · </span>
                  <span className="font-medium tabular-nums text-foreground">
                    {formatUsd(peakAmount)}
                  </span>
                </span>
              )}
            </div>

            {/* The figures as a table, for anyone the line doesn't reach. */}
            <table className="sr-only">
              <caption>Ticket value per hour, today</caption>
              <thead>
                <tr>
                  <th scope="col">Hour</th>
                  <th scope="col">Sales</th>
                  <th scope="col">Tickets</th>
                </tr>
              </thead>
              <tbody>
                {buckets.map((bucket) => (
                  <tr key={bucket.hour}>
                    <th scope="row">{hourRange(bucket.hour)}</th>
                    <td>{formatUsd(bucket.amount)}</td>
                    <td>{bucket.tickets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </CardBody>

      {/* A day too big to sweep is drawn from its most recent stretch. Saying
          so is the difference between a partial chart and a wrong one. */}
      {timeline && !timeline.complete && (
        <CardFooter>
          Drawn from the most recent{" "}
          <span className="font-medium tabular-nums text-foreground">
            {timeline.fetchedCount.toLocaleString("en-US")}
          </span>{" "}
          of{" "}
          <span className="font-medium tabular-nums text-foreground">
            {timeline.totalCount.toLocaleString("en-US")}
          </span>{" "}
          tickets — earlier hours aren’t shown.
        </CardFooter>
      )}
    </Card>
  );
}

export default IntradaySalesChart;
