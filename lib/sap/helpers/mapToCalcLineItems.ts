export function mapToCalcLineItems(
    lines: Array<{
      Quantity: number;
      Price: number;
      TaxCode?: string;
    }>,
    taxRateMap: Record<string, number>
  ): Array<{ lineTotal: number; tax: number }> {
    return lines.map((line) => {
      const lineTotal = (line.Quantity || 0) * (line.Price || 0);
      const taxRate = taxRateMap[line.TaxCode || ""] ?? 0;
      const tax = lineTotal * (taxRate / 100);
      return { lineTotal, tax };
    });
  }
  