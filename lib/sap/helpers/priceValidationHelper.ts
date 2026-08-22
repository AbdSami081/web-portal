export interface PricedLine {
  ItemCode?: string;
  Price?: number;
}

export const hasInvalidPrice = (line: PricedLine): boolean => {
  const price = Number(line.Price);
  return !Number.isFinite(price) || price <= 0;
};

export const linesHaveInvalidPrice = (lines: PricedLine[]): boolean => lines.some(hasInvalidPrice);
