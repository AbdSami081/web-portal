export function formatCurrency(value: number) {
  if (value === undefined || value === null) return "0.00";
  return value.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
