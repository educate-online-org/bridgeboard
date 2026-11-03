// SITS-style date displays. Both are unambiguous (no 05/03 vs 03/05 confusion).
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/** v1: 27/Nov/2026 */
export function dateV1(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${MONTHS[Number(m) - 1]}/${y}`;
}

/** v2: Friday 27 November 2026 */
export function dateV2(iso: string | null): string {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}
