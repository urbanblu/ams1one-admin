/**
 * Chart palette, aligned with the design tokens in `app/globals.css`.
 * Recharts needs literal colour values, so they are mirrored here rather
 * than read from CSS variables.
 *
 * Series colours are the -500/-600 steps so they hold up as 2px strokes and
 * as small fills; chrome uses the slate neutrals the rest of the console is
 * built on, with gridlines deliberately quieter than panel borders so a chart
 * doesn't read as a table.
 */
const ChartColors = {
  brand: "#9387eb",
  brandStrong: "#6355d8",
  brandSoft: "#cdc5f8",
  success: "#059669",
  warning: "#d97706",
  danger: "#e11d48",
  info: "#2563eb",

  /** Gridlines, axis ticks and reference lines. */
  grid: "#eceef0",
  reference: "#dfe3e6",
  axis: "#a8b0b6",
  label: "#5b6166",
  track: "#f1f3f5",
} as const;

export default ChartColors;
