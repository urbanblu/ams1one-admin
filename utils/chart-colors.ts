/**
 * Chart palette, aligned with the design tokens in `app/globals.css`.
 * Recharts needs literal colour values, so they are mirrored here rather
 * than read from CSS variables.
 */
const ChartColors = {
  brand: "#9387eb",
  brandStrong: "#7d6fe5",
  brandSoft: "#c4bcf5",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",

  /** Gridlines, axis ticks and reference lines. */
  grid: "#f1f1f3",
  reference: "#e4e4e7",
  axis: "#a1a1aa",
  label: "#52525b",
  track: "#f1f1f3",
} as const;

export default ChartColors;
