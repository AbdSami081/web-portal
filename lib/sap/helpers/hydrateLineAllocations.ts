import { getDocumentSerialBatchAllocations } from "@/api+/sap/inventory/inventoryService";

/**
 * After an existing document is loaded, fill each line's `BatchNumbers` /
 * `SerialNumbers` from the actual SAP allocation tables (IBT1 / SRI1), because
 * the Service Layer GET does not reliably return them. Shapes match what the
 * selection modals and the save payload expect:
 *   BatchNumbers  -> { BatchNumber: string; Quantity: number }[]
 *   SerialNumbers -> { InternalSerialNumber: string }[]
 *
 * `applyPatch` receives a per-line patch keyed by LineNum (falls back to ItemCode
 * when LineNum is not usable).
 */
export async function hydrateLineAllocations(
  docType: number,
  docEntry: number,
  lines: { LineNum?: number; ItemCode?: string; BatchNumbers?: any[]; SerialNumbers?: any[] }[],
  applyPatch: (
    patch: Map<string | number, {
      BatchNumbers?: { BatchNumber: string; Quantity: number }[];
      SerialNumbers?: { InternalSerialNumber: string }[];
      ManBtchNum?: string;
      ManSerNum?: string;
    }>
  ) => void
): Promise<void> {
  if (!docType || !docEntry || !Array.isArray(lines) || lines.length === 0) return;

  const { batches, serials } = await getDocumentSerialBatchAllocations(docType, docEntry);
  if (batches.length === 0 && serials.length === 0) return;

  // Group by line number; keep an item-code index as a fallback.
  const batchByLine = new Map<number, { BatchNumber: string; Quantity: number }[]>();
  const batchByItem = new Map<string, { BatchNumber: string; Quantity: number }[]>();
  for (const b of batches) {
    const rec = { BatchNumber: String(b.BatchNumber ?? ""), Quantity: Number(b.Quantity ?? 0) };
    if (!rec.BatchNumber) continue;
    const ln = Number(b.LineNum);
    if (!Number.isNaN(ln)) {
      if (!batchByLine.has(ln)) batchByLine.set(ln, []);
      batchByLine.get(ln)!.push(rec);
    }
    const ic = String(b.ItemCode ?? "");
    if (ic) {
      if (!batchByItem.has(ic)) batchByItem.set(ic, []);
      batchByItem.get(ic)!.push(rec);
    }
  }

  const serialByLine = new Map<number, { InternalSerialNumber: string }[]>();
  const serialByItem = new Map<string, { InternalSerialNumber: string }[]>();
  for (const s of serials) {
    const num = String(s.SerialNumber ?? s.InternalSerialNumber ?? "");
    if (!num) continue;
    const rec = { InternalSerialNumber: num };
    const ln = Number(s.LineNum);
    if (!Number.isNaN(ln)) {
      if (!serialByLine.has(ln)) serialByLine.set(ln, []);
      serialByLine.get(ln)!.push(rec);
    }
    const ic = String(s.ItemCode ?? "");
    if (ic) {
      if (!serialByItem.has(ic)) serialByItem.set(ic, []);
      serialByItem.get(ic)!.push(rec);
    }
  }

  const patch = new Map<string | number, any>();

  lines.forEach((line, idx) => {
    const lineKey = line.LineNum ?? idx;
    const b =
      batchByLine.get(Number(lineKey)) ??
      (line.ItemCode ? batchByItem.get(line.ItemCode) : undefined);
    const s =
      serialByLine.get(Number(lineKey)) ??
      (line.ItemCode ? serialByItem.get(line.ItemCode) : undefined);

    const entry: any = {};
    if (b && b.length > 0 && (!line.BatchNumbers || line.BatchNumbers.length === 0)) {
      entry.BatchNumbers = b;
      entry.ManBtchNum = "Y";
    }
    if (s && s.length > 0 && (!line.SerialNumbers || line.SerialNumbers.length === 0)) {
      entry.SerialNumbers = s;
      entry.ManSerNum = "Y";
    }
    if (Object.keys(entry).length > 0) patch.set(lineKey, entry);
  });

  if (patch.size > 0) applyPatch(patch);
}
