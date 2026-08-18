import { InventoryDocumentLine } from "@/types/inventory/inventory.type";

interface BuildInventoryPayloadOptions {
  data: any;
  lines: InventoryDocumentLine[];
  docEntry?: number;
  lastLoadedDocType?: number | null;
  fromWarehouse?: string;
  toWarehouse?: string;
}

function getValidLines(lines: InventoryDocumentLine[]) {
  return lines.filter(
    (line) => line.ItemCode && String(line.ItemCode).trim() !== ""
  );
}

function attachBaseFields(
  baseFields: Record<string, unknown>,
  line: InventoryDocumentLine
) {
  if (line.BaseType != null && Number(line.BaseType) !== -1) {
    baseFields.BaseType = Number(line.BaseType);
  }
  if (line.BaseEntry != null && Number(line.BaseEntry) !== -1) {
    baseFields.BaseEntry = Number(line.BaseEntry);
  }
  if (line.BaseLine != null && Number(line.BaseLine) !== -1) {
    baseFields.BaseLine = Number(line.BaseLine);
  }
  return baseFields;
}

function buildDocumentLines(
  lines: InventoryDocumentLine[],
  fromWarehouse?: string,
  toWarehouse?: string
) {
  return getValidLines(lines).map((line) => {
    const baseFields: Record<string, unknown> = {
      ItemCode: line.ItemCode,
      Quantity: Number(line.Quantity) || 0,
      WarehouseCode: line.WhsCode || toWarehouse || "",
      FromWarehouseCode: line.FromWhsCode || fromWarehouse || "",
    };

    if (line.LineNum !== undefined && line.LineNum >= 0) {
      baseFields.LineNum = line.LineNum;
    }

    return attachBaseFields(baseFields, line);
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
    StockTransferLines: buildDocumentLines(lines, fromWarehouse, toWarehouse),
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
    StockTransferLines: buildDocumentLines(lines, fromWarehouse, toWarehouse),
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
    StockTransferLines: buildDocumentLines(lines, fromWarehouse, toWarehouse),
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
    StockTransferLines: buildDocumentLines(lines, fromWarehouse, toWarehouse),
  };
}

interface BuildGoodIssuePayloadOptions {
  data: any;
  lines: InventoryDocumentLine[];
}

export function buildGoodIssuePayload({
  data,
  lines,
}: BuildGoodIssuePayloadOptions) {
  return {
    Comments: data.Comments || "",
    JournalMemo: data.JournalMemo || "",
    DocumentLines: buildDocumentLines(lines),
  };
}

export function buildGoodIssuePatchPayload({
  data,
  lines,
}: BuildGoodIssuePayloadOptions) {
  return {
    Comments: data.Comments || "",
    JournalMemo: data.JournalMemo || "",
    DocumentLines: buildDocumentLines(lines),
  };
}
