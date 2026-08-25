import { getItemsList } from "@/api+/sap/master-data/items";

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

// SAP Service Layer's marketing DocumentLines never include ManSerNum/ManBtchNum - those
// are item-master fields, not document-line fields (confirmed against a captured live
// Service Layer response) - so a document loaded FROM SAP (re-opened for edit, or copied
// via Copy From/Copy To) silently loses the "this item is serial/batch managed" flag even
// though a freshly-added line (which reads it straight from the item picker) has it. That
// breaks both the submit-time allocation popup and the line's right-click serial/batch
// menu for any copied/reloaded document. This re-resolves the flags from the item master
// for lines that arrived without them, and reports the correction via `applyPatch` once
// the lookup completes (item lookups are cached, so re-loading the same items is cheap).
export async function resolveSerialBatchFlags(
  lines: { ItemCode?: string; ManSerNum?: string | null; ManBtchNum?: string | null }[],
  applyPatch: (patch: Map<string, { ManSerNum?: string; ManBtchNum?: string }>) => void
): Promise<void> {
  const codes = Array.from(
    new Set(
      lines
        .filter((l) => !l.ManSerNum && !l.ManBtchNum && l.ItemCode)
        .map((l) => l.ItemCode as string)
    )
  );
  if (codes.length === 0) return;

  try {
    // top=20: GetItems does a LIKE %search% on both ItemCode and ItemName, so an exact
    // code can be pushed past a small page if several codes/names contain it as a
    // substring - the exact-match filter below still needs it to actually be in the page.
    const results = await Promise.all(codes.map((code) => getItemsList(code, 0, 20).catch(() => [])));
    const patch = new Map<string, { ManSerNum?: string; ManBtchNum?: string }>();

    results.forEach((items, idx) => {
      const code = codes[idx];
      const match = (items || []).find((it: any) => it.ItemCode === code) || (items || [])[0];
      if (match && (match.ManSerNum || match.ManBtchNum)) {
        patch.set(code, { ManSerNum: match.ManSerNum || "", ManBtchNum: match.ManBtchNum || "" });
      }
    });

    if (patch.size > 0) applyPatch(patch);
  } catch {
    /* best-effort - submit-time validation still runs against whatever is already known */
  }
}
