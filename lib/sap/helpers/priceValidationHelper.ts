export interface PricedLine {
  ItemCode?: string;
  Price?: number;
}

export const hasInvalidPrice = (line: PricedLine): boolean => {
  const price = Number(line.Price);
  return !Number.isFinite(price) || price <= 0;
};

export const linesHaveInvalidPrice = (lines: PricedLine[]): boolean => lines.some(hasInvalidPrice);

export const hasInvalidQuantity = (
  line: Record<string, any>,
  field: string = "Quantity"
): boolean => {
  const qty = Number(line[field]);
  return !Number.isFinite(qty) || qty <= 0;
};

export const linesHaveInvalidQuantity = (
  lines: Record<string, any>[],
  field: string = "Quantity"
): boolean => lines.some((line) => hasInvalidQuantity(line, field));
