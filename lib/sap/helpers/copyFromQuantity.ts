export function openLinesForCopyFrom<T extends Record<string, any>>(lines: T[] | null | undefined): T[] {
  return (lines || [])
    .filter((line) => {
      if (!line) return false;
      if (line.LineStatus === "bost_Close" || line.IsClosed === "tYES") return false;

      const remaining = line.RemainingOpenQuantity ?? line.OpenQuantity ?? line.OpenQty ?? line.RemainingOpenInventoryQuantity;
      if (remaining !== undefined && remaining !== null && remaining !== "") {
        const remainingNum = Number(remaining);
        if (!isNaN(remainingNum) && remainingNum <= 0) return false;
      }
      return true;
    })
    .map((line) => {
      const remaining = line.RemainingOpenQuantity ?? line.OpenQuantity ?? line.OpenQty ?? line.RemainingOpenInventoryQuantity;
      if (remaining === undefined || remaining === null || remaining === "") return line;

      const remainingNum = Number(remaining);
      const originalQty = Number(line.Quantity ?? 0);
      if (isNaN(remainingNum) || remainingNum <= 0) return line;
      if (remainingNum >= originalQty) return line;

      const qty = remainingNum;
      const price = Number(line.Price ?? line.UnitPrice ?? line.ItemCost ?? 0);
      const discount = Number(line.DiscountPercent ?? 0);
      const taxRate = Number(line.TaxRate ?? line.TaxPercentagePerRow ?? line.VatPrcnt ?? 0);

      const lineSubtotal = qty * price;
      const discountAmount = (lineSubtotal * discount) / 100;
      const calculatedTax = (lineSubtotal - discountAmount) * (taxRate / 100);

      return {
        ...line,
        Quantity: remainingNum,
        LineTotal: lineSubtotal - discountAmount + calculatedTax,
        TaxAmount: calculatedTax,
      };
    });
}
