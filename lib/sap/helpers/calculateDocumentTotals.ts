export function calculateDocumentTotals({
    lines,
    headerDiscountPercent,
    freight,
    rounding,
  }: {
    lines: { lineTotal: number; tax: number }[];
    headerDiscountPercent: number;
    freight: number;
    rounding: number;
  }) {
    const totalBeforeDiscount = lines.reduce((sum, line) => sum + line.lineTotal, 0);
    const discountAmount = totalBeforeDiscount * (headerDiscountPercent / 100);
    const tax = lines.reduce((sum, line) => sum + line.tax, 0);
    const docTotal = totalBeforeDiscount - discountAmount + tax + freight + rounding;
  
    return {
      totalBeforeDiscount,
      tax,
      docTotal,
    };
  }
  