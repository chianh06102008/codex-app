// Format a number of Vietnamese dong for display, e.g. 120000 -> "120,000 ₫".
// We add the thousands separators by hand so it looks the same on every phone.
export function formatVnd(amount: number): string {
  const withCommas = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withCommas} ₫`;
}
