export interface SerialBatchLine {
  ManSerNum?: string | null;
  ManBtchNum?: string | null;
  SerialNumbers?: unknown[] | null;
  BatchNumbers?: { Quantity: number }[] | null;
  Quantity: number;
}

const isManaged = (flag: string | null | undefined): boolean => {
  const normalized = String(flag ?? "").toLowerCase();
  return normalized === "y" || normalized === "tyes";
};

export const itemNeedsSerial = (line: SerialBatchLine): boolean => {
  if (!isManaged(line.ManSerNum)) return false;
  return !line.SerialNumbers || line.SerialNumbers.length < line.Quantity;
};

export const itemNeedsBatch = (line: SerialBatchLine): boolean => {
  if (!isManaged(line.ManBtchNum)) return false;
  const totalBatch = (line.BatchNumbers || []).reduce((sum, b) => sum + (b.Quantity || 0), 0);
  return totalBatch < line.Quantity;
};

export const linesNeedSerialAllocation = (lines: SerialBatchLine[]): boolean => lines.some(itemNeedsSerial);

export const linesNeedBatchAllocation = (lines: SerialBatchLine[]): boolean => lines.some(itemNeedsBatch);
