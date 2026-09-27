/**
 * Indian Rupee formatting for the doctor's Finance/Insights pages.
 * All money values are stored as `numeric` in the database; this only
 * affects display. No multi-currency support (spec).
 */
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrExact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "₹0";
  return inr.format(n);
}

export function formatINRExact(value: number | string | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "₹0.00";
  return inrExact.format(n);
}