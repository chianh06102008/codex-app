// Show times in Vietnam time (UTC+7) whatever the phone's own time zone is,
// because official bulletins state Vietnam time.
const VN_OFFSET_MS = 7 * 3_600_000;
const pad = (n: number) => String(n).padStart(2, '0');

/** "23:20 13/11" in Vietnam time, or null if the value is missing or unreadable. */
export function formatVnTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  const d = new Date(ms + VN_OFFSET_MS); // read the shifted value through UTC getters
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`;
}
