/**
 * The trading day in words. Read off the server's `date` rather than the
 * browser's clock — the day these figures cover is the server's, and near
 * midnight the two disagree.
 */
export function formatTradingDay(isoDate?: string) {
  if (!isoDate) return "";
  const d = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
