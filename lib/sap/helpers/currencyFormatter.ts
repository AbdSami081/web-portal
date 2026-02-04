export function formatCurrency(value: any) {
  const num = Number(value);
  if (isNaN(num) || value === undefined || value === null) return "0.00";

  return num.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
