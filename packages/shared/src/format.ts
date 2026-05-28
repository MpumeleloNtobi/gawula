export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  })
    .format(cents / 100)
    .replace(/\s+/g, "");
}
