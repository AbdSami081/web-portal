import { InventoryDocumentLine } from "@/types/inventory/inventory.type";
import { InventoryTransferLine } from "@/api+/sap/inventory/inventoryService";
import { withDefaultBPLId } from "./documentPayloadHelper";

interface BuildInventoryPayloadOptions {
  data: any;
  lines: InventoryDocumentLine[];
  docEntry?: number;
  lastLoadedDocType?: number | null;
  fromWarehouse?: string;
  toWarehouse?: string;
}

function getValidLines(lines: InventoryDocumentLine[]) {
  return (lines || []).filter(
    (line) => line.ItemCode && String(line.ItemCode).trim() !== ""
  );
}

function attachBaseFields(
  baseFields: Record<string, any>,
  line: InventoryDocumentLine
) {
  if (
    line.BaseType != null &&
    Number(line.BaseType) !== -1 &&
    line.BaseEntry != null &&
    Number(line.BaseEntry) !== -1 &&
    line.BaseLine != null &&
    Number(line.BaseLine) !== -1
  ) {
    baseFields.BaseType = Number(line.BaseType);
    baseFields.BaseEntry = Number(line.BaseEntry);
    baseFields.BaseLine = Number(line.BaseLine);
  }
  return baseFields;
}

function withBaseLineNumber<T extends object>(entries: T[] | undefined, lineIndex: number): T[] | undefined {
  if (!entries || entries.length === 0) return undefined;
  return entries.map((entry) => ({ ...entry, BaseLineNumber: lineIndex }));
}

function buildDocumentLines(
  lines: InventoryDocumentLine[],
  fromWarehouse?: string,
  toWarehouse?: string,
  isPatch: boolean = false
): InventoryTransferLine[] {
  return getValidLines(lines).map((line, index) => {
    const baseFields: Record<string, any> = {
      ItemCode: line.ItemCode,
      Quantity: Number(line.Quantity) || 0,
      WarehouseCode: line.WhsCode || toWarehouse || "",
      FromWarehouseCode: line.FromWhsCode || fromWarehouse || "",
    };

    if (line.ItemCost !== undefined && Number(line.ItemCost) > 0) {
      baseFields.UnitPrice = Number(line.ItemCost);
    }

    if (line.UoMCode && String(line.UoMCode).trim() !== "") {
      baseFields.UoMCode = line.UoMCode;
    }

    if (isPatch) {
      // Existing lines carry their SAP LineNum - the backend sends
      // B1S-ReplaceCollectionsOnPatch so omitted lines get deleted.
      // New lines must NOT carry LineNum ("-1" is rejected by SAP).
      if (line.LineNum !== undefined && line.LineNum !== null && Number(line.LineNum) >= 0) {
        baseFields.LineNum = Number(line.LineNum);
      }
    } else {
      attachBaseFields(baseFields, line);
    }

    const serialNumbers = withBaseLineNumber(line.SerialNumbers, index);
    if (serialNumbers) baseFields.SerialNumbers = serialNumbers;
    const batchNumbers = withBaseLineNumber(line.BatchNumbers, index);
    if (batchNumbers) baseFields.BatchNumbers = batchNumbers;

    return baseFields as InventoryTransferLine;
  });
}

export function buildInventoryTransferRequestPayload({
  data,
  lines,
  fromWarehouse,
  toWarehouse,
}: BuildInventoryPayloadOptions) {
  return {
    CardCode: data.CardCode || "",
    FromWarehouse: fromWarehouse || "",
    ToWarehouse: toWarehouse || "",
    Comments: data.Comments || "",
    JournalMemo: data.JournalMemo || "",
    StockTransferLines: buildDocumentLines(lines, fromWarehouse, toWarehouse, false),
  };
}

export function buildInventoryTransferRequestPatchPayload({
  data,
  lines,
  fromWarehouse,
  toWarehouse,
}: Pick<BuildInventoryPayloadOptions, "data" | "lines" | "fromWarehouse" | "toWarehouse">) {
  return {
    Comments: data.Comments || "",
    JournalMemo: data.JournalMemo || "",
    StockTransferLines: buildDocumentLines(lines, fromWarehouse, toWarehouse, true),
  };
}

export function buildInventoryTransferPayload({
  data,
  lines,
  fromWarehouse,
  toWarehouse,
}: BuildInventoryPayloadOptions) {
  return {
    CardCode: data.CardCode || "",
    FromWarehouse: fromWarehouse || "",
    ToWarehouse: toWarehouse || "",
    Comments: data.Comments || "",
    JournalMemo: data.JournalMemo || "",
    StockTransferLines: buildDocumentLines(lines, fromWarehouse, toWarehouse, false),
  };
}

export function buildInventoryTransferPatchPayload({
  data,
  lines,
  fromWarehouse,
  toWarehouse,
}: Pick<BuildInventoryPayloadOptions, "data" | "lines" | "fromWarehouse" | "toWarehouse">) {
  return {
    Comments: data.Comments || "",
    JournalMemo: data.JournalMemo || "",
    StockTransferLines: buildDocumentLines(lines, fromWarehouse, toWarehouse, true),
  };
}

interface BuildGoodIssuePayloadOptions {
  data: any;
  lines: InventoryDocumentLine[];
}

function buildGoodIssueLines(
  lines: InventoryDocumentLine[],
  isPatch: boolean = false
): InventoryTransferLine[] {
  return getValidLines(lines).map((line, index) => {
    const baseFields: Record<string, any> = {
      ItemCode: line.ItemCode,
      Quantity: Number(line.Quantity) || 0,
      // Good Issue uses a single line-level warehouse only (no From/To).
      WarehouseCode: line.WhsCode || "",
    };

    if (line.ItemCost !== undefined && Number(line.ItemCost) > 0) {
      baseFields.UnitPrice = Number(line.ItemCost);
    }

    if (line.UoMCode && String(line.UoMCode).trim() !== "") {
      baseFields.UoMCode = line.UoMCode;
    }

    if (isPatch) {
      if (line.LineNum !== undefined && line.LineNum !== null && Number(line.LineNum) >= 0) {
        baseFields.LineNum = Number(line.LineNum);
      }
    } else {
      attachBaseFields(baseFields, line);
    }

    const serialNumbers = withBaseLineNumber(line.SerialNumbers, index);
    if (serialNumbers) baseFields.SerialNumbers = serialNumbers;
    const batchNumbers = withBaseLineNumber(line.BatchNumbers, index);
    if (batchNumbers) baseFields.BatchNumbers = batchNumbers;

    return baseFields as InventoryTransferLine;
  });
}

export function buildGoodIssuePayload({
  data,
  lines,
}: BuildGoodIssuePayloadOptions) {
  return withDefaultBPLId({
    Comments: data.Comments || "",
    JournalMemo: data.JournalMemo || "",
    DocumentLines: buildGoodIssueLines(lines, false),
  });
}

export function buildGoodIssuePatchPayload({
  data,
  lines,
}: BuildGoodIssuePayloadOptions) {
  return {
    Comments: data.Comments || "",
    JournalMemo: data.JournalMemo || "",
    DocumentLines: buildGoodIssueLines(lines, true),
  };
}
