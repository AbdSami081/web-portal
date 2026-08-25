export function openLinesForCopyFrom<T extends Record<string, any>>(lines: T[] | null | undefined): T[] {
  return (lines || [])
    .filter((line) => line?.LineStatus !== "bost_Close")
    .map((line) => {
      const remaining = line?.RemainingOpenQuantity;
      if (remaining === undefined || remaining === null || remaining === "") return line;

      const remainingNum = Number(remaining);
      const originalQty = Number(line?.Quantity ?? 0);
      if (isNaN(remainingNum) || remainingNum < 0) return line;
      if (remainingNum >= originalQty) return line;

      return { ...line, Quantity: remainingNum };
    });
}
