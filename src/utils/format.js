// Display formatters. Keep these pure — they are the easiest things to unit test.

// Deliberately NOT using { style: "currency", currency: "SGD" }. In an en-SG
// locale, ICU renders SGD as a bare "$", and the symbol shifts between Node and
// the browser depending on which locale data is installed. Formatting the
// number and prefixing "S$" ourselves is unambiguous and identical everywhere.
const NUMBER = new Intl.NumberFormat("en-SG", { maximumFractionDigits: 0 });

/** 530000 -> "S$530,000" */
export function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `S$${NUMBER.format(Number(value))}`;
}

/** 530000 -> "S$530k", for tight spaces like cards and chat replies. */
export function formatPriceShort(value) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  if (n >= 1_000_000) return `S$${(n / 1_000_000).toFixed(2)}m`;
  return `S$${Math.round(n / 1000)}k`;
}

/** 92 -> "92 sqm (990 sqft)" */
export function formatArea(sqm) {
  if (!sqm) return "—";
  const sqft = Math.round(Number(sqm) * 10.7639);
  return `${Number(sqm)} sqm (${sqft.toLocaleString("en-SG")} sqft)`;
}

/** "ANG MO KIO" -> "Ang Mo Kio" */
export function titleCase(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

/** 61.33 -> "61 years 4 months" */
export function formatLease(years) {
  if (years == null) return "—";
  const whole = Math.floor(years);
  const months = Math.round((years - whole) * 12);
  return months ? `${whole} years ${months} months` : `${whole} years`;
}

/** "2026-09-14" -> "14 Sep 2026" */
export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
