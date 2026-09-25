import { PurchaseDocumentLine } from "@/types/purchase/purchaseDocuments.type";
import { resolveBranchId } from "./documentPayloadHelper";

interface BuildPurchasePayloadOptions {
  data: any;
  lines: PurchaseDocumentLine[];
  docEntry?: number;
  lastLoadedDocType?: number | null;
  targetDocType: number;
  discountPercent?: number;
  freight?: number;
  rounding?: number;
  additionalExpenses?: Array<{ ExpenseCode: number; LineTotal: number; VatGroup?: string; TaxCode?: string }>;
  documentMode?: "items" | "service";
}

export interface BuildPurchasePatchPayloadOptions {
  data: any;
  lines?: PurchaseDocumentLine[];
  discountPercent?: number;
  freight?: number;
  rounding?: number;
  additionalExpenses?: Array<{ ExpenseCode: number; LineTotal: number; VatGroup?: string; TaxCode?: string }>;
  includeLines?: boolean;
  documentMode?: "items" | "service";
}

function withBaseLineNumber<T extends object>(entries: T[] | undefined, lineIndex: number): T[] | undefined {
  if (!entries || entries.length === 0) return undefined;
  return entries.map((entry) => ({ ...entry, BaseLineNumber: lineIndex }));
}

function mapLineExpenses(line: PurchaseDocumentLine) {
  const expenses: Array<{ ExpenseCode: number; LineTotal: number; VatGroup: string }> = [];

  if (line.Freight1Type && Number(line.Freight1LCAmount) > 0) {
    expenses.push({
      ExpenseCode: Number(line.Freight1Type),
      LineTotal: Number(line.Freight1LCAmount),
      VatGroup: line.Freight1TaxGroup || "",
    });
  }
  if (line.Freight2Type && Number(line.Freight2LCAmount) > 0) {
    expenses.push({
      ExpenseCode: Number(line.Freight2Type),
      LineTotal: Number(line.Freight2LCAmount),
      VatGroup: line.Freight2TaxGroup || "",
    });
  }
  if (line.Freight3Type && Number(line.Freight3LCAmount) > 0) {
    expenses.push({
      ExpenseCode: Number(line.Freight3Type),
      LineTotal: Number(line.Freight3LCAmount),
      VatGroup: line.Freight3TaxGroup || "",
    });
  }

  return expenses;
}

export function buildPurchaseDocumentPayload({
  data,
  lines,
  docEntry,
  lastLoadedDocType,
  targetDocType,
  discountPercent = 0,
  freight = 0,
  rounding = 0,
  additionalExpenses = [],
  documentMode,
}: BuildPurchasePayloadOptions) {
  const hasCopyFrom =
    docEntry &&
    Number(docEntry) > 0 &&
    lastLoadedDocType &&
    lastLoadedDocType !== targetDocType;

  const isPurchaseRequest = !!data.Requester;

  return {
    ...(!isPurchaseRequest && {
      CardCode: data.CardCode,
      CardName: data.CardName,
    }),
    ...(isPurchaseRequest && {
      Requester: data.Requester,
      RequesterName: data.RequesterName,
      ...(data.RequesterEmail && { RequesterEmail: data.RequesterEmail }),
      ...(data.SendNotification && { SendNotification: data.SendNotification }),
    }),
    ...(data.RequiredDate && { RequriedDate: data.RequiredDate }),
    DocDate: data.DocDate,
    DocDueDate: data.DocDueDate,
    TaxDate: data.TaxDate,
    Comments: data.Comments,
    ...(() => {
      const branchId = resolveBranchId(data.BPL_IDAssignedToInvoice ?? data.BPLId);
      return branchId === undefined ? {} : { BPL_IDAssignedToInvoice: branchId, BPLId: branchId };
    })(),
    DocType: documentMode === "service" ? "dDocument_Service" : "dDocument_Items",
    DiscountPercent: discountPercent || 0,
    Freight: freight || 0,
    Rounding: rounding || 0,
    DocumentLines: lines.map((line, index) => {
      const baseFields: Record<string, unknown> =
        documentMode === "service"
          ? {
              AccountCode: line.AccountCode || "",
              AccountName: line.AccountName || "",
              ItemDescription: line.Description || "",
              UnitPrice: Number(line.LineTotal) || 0,
              LineTotal: Number(line.LineTotal) || 0,
              DiscountPercent: Number(line.DiscountPercent) || 0,
              VatGroup: line.TaxCode || "",
            }
          : {
              ItemCode: line.ItemCode,
              Quantity: Number(line.Quantity) || 0,
              UnitPrice: Number(line.Price) || 0,
              DiscountPercent: Number(line.DiscountPercent) || 0,
              VatGroup: line.TaxCode || "",
              WarehouseCode: line.WarehouseCode || "",
              UoMCode: line.UoMCode || "",
            };

      if (hasCopyFrom) {
        baseFields.BaseType = lastLoadedDocType;
        baseFields.BaseEntry = docEntry;
        baseFields.BaseLine = line.LineNum;
      } else if (!docEntry || Number(docEntry) <= 0) {
        baseFields.BaseType = -1;
        baseFields.BaseEntry = null;
        baseFields.BaseLine = null;
      }

      if (line.RequiredDate) {
        baseFields.RequiredDate = line.RequiredDate;
      }

      const lineExpenses = mapLineExpenses(line);
      if (lineExpenses.length > 0) {
        baseFields.DocumentLineAdditionalExpenses = lineExpenses;
      }

      const serialNumbers = withBaseLineNumber(line.SerialNumbers, index);
      if (serialNumbers) baseFields.SerialNumbers = serialNumbers;
      const batchNumbers = withBaseLineNumber(line.BatchNumbers, index);
      if (batchNumbers) baseFields.BatchNumbers = batchNumbers;

      return baseFields;
    }),
    ...(additionalExpenses.length > 0 && {
      DocumentAdditionalExpenses: additionalExpenses.map((e) => ({
        ExpenseCode: e.ExpenseCode,
        LineTotal: e.LineTotal,
        VatGroup: e.VatGroup || e.TaxCode || "",
      })),
    }),
  };
}

export function buildPurchaseDocumentPatchPayload({
  data,
  lines = [],
  discountPercent = 0,
  freight = 0,
  rounding = 0,
  additionalExpenses = [],
  includeLines = true,
  documentMode,
}: BuildPurchasePatchPayloadOptions) {
  const isPurchaseRequest = !!data.Requester;

  return {
    DocType: documentMode === "service" ? "dDocument_Service" : "dDocument_Items",
    Comments: data.Comments,
    ...(data.DocDate && { DocDate: data.DocDate }),
    ...(data.DocDueDate && { DocDueDate: data.DocDueDate }),
    ...(data.TaxDate && { TaxDate: data.TaxDate }),
    ...(data.RequiredDate && { RequriedDate: data.RequiredDate }),
    ...(data.RequesterEmail && { RequesterEmail: data.RequesterEmail }),
    ...(data.SendNotification && { SendNotification: data.SendNotification }),
    ...(includeLines && {
      DiscountPercent: discountPercent || 0,
      Freight: freight || 0,
      Rounding: rounding || 0,
    }),
    ...(includeLines && lines.length > 0 && {
      DocumentLines: lines.map((line, index) => {
        const baseFields: Record<string, unknown> =
          documentMode === "service"
            ? {
                AccountCode: line.AccountCode || "",
                AccountName: line.AccountName || "",
                ItemDescription: line.Description || "",
                UnitPrice: Number(line.LineTotal) || 0,
                LineTotal: Number(line.LineTotal) || 0,
                DiscountPercent: Number(line.DiscountPercent) || 0,
                VatGroup: line.TaxCode || "",
              }
            : {
                ItemCode: line.ItemCode,
                Quantity: Number(line.Quantity) || 0,
                UnitPrice: Number(line.Price) || 0,
                DiscountPercent: Number(line.DiscountPercent) || 0,
                VatGroup: line.TaxCode || "",
                WarehouseCode: line.WarehouseCode || "",
                UoMCode: line.UoMCode || "",
              };

        if (line.LineNum !== undefined && line.LineNum >= 0) {
          baseFields.LineNum = line.LineNum;
        }

        const lineExpenses = mapLineExpenses(line);
        if (lineExpenses.length > 0) {
          baseFields.DocumentLineAdditionalExpenses = lineExpenses;
        }

        const serialNumbers = withBaseLineNumber(line.SerialNumbers, index);
        if (serialNumbers) baseFields.SerialNumbers = serialNumbers;
        const batchNumbers = withBaseLineNumber(line.BatchNumbers, index);
        if (batchNumbers) baseFields.BatchNumbers = batchNumbers;

        return baseFields;
      }),
    }),
    ...(includeLines && additionalExpenses.length > 0 && {
      DocumentAdditionalExpenses: additionalExpenses.map((e) => ({
        ExpenseCode: e.ExpenseCode,
        LineTotal: e.LineTotal,
        VatGroup: e.VatGroup || e.TaxCode || "",
      })),
    }),
  };
}

