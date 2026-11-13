import { SalesDocumentLine } from "@/types/sales/salesDocuments.type";
import { QuotationFormData } from "@/lib/schemas/quotationSchema";
import { DocumentType } from "@/types/master/DocumentType";
import { pickLineUdfs } from "./lineUdfHelper";
import { resolveBranchId } from "./documentPayloadHelper";

interface BuildSalesPayloadOptions {
  data: QuotationFormData;
  lines: SalesDocumentLine[];
  docEntry?: number;
  lastLoadedDocType?: DocumentType | null;
  targetDocType: DocumentType;
  discountPercent?: number;
  freight?: number;
  additionalExpenses?: Array<{ ExpenseCode: number; LineTotal: number; VatGroup?: string; TaxCode?: string }>;
  downPaymentType?: string;
  salesPersonCode?: number | null;
  documentMode?: "items" | "service";
}

function withBaseLineNumber<T extends object>(entries: T[] | undefined, lineIndex: number): T[] | undefined {
  if (!entries || entries.length === 0) return undefined;
  return entries.map((entry) => ({ ...entry, BaseLineNumber: lineIndex }));
}

function mapLineExpenses(line: SalesDocumentLine) {
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

function getSalesDocumentBranchId(data: QuotationFormData): number | undefined {
  const rawBranchId = data.BPL_IDAssignedToInvoice ?? (data as any).BPLId;
  const parsedBranchId = rawBranchId == null || rawBranchId === "" ? undefined : Number(rawBranchId);
  return resolveBranchId(
    parsedBranchId !== undefined && Number.isFinite(parsedBranchId)
      ? parsedBranchId
      : undefined,
  );
}

function mapDocumentHeaderFields(data: QuotationFormData) {
  const payload: Record<string, any> = {};

  const excludedFields = new Set([
    "CardCode",
    "CardName",
    "DocDate",
    "DocDueDate",
    "ManualDueDate",
    "TaxDate",
    "Comments",
    "BranchRegNo",
    "BPL_IDAssignedToInvoice",
    "BPLId",
    "FatherType",
    "FatherCard",
  ]);

  const booleanFields = [
    "Confirmed",
    "ProcureNonDropShip",
    "ProcureDropShip",
    "UseShpdGoodsAct",
  ];

  const numericFields = [
    "TransportationCode",
    "LanguageCode",
    "BPChannelContact",
    "PaymentGroupCode",
    "CashDiscountDateOffset",
    "ExtraMonth",
    "ExtraDays",
  ];

  Object.entries(data).forEach(([key, value]) => {
    if (
      excludedFields.has(key) ||
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return;
    }

    if (booleanFields.includes(key)) {
      payload[key] = value ? "tYES" : "tNO";
      return;
    }

    if (numericFields.includes(key)) {
      const numericValue = Number(value);
      payload[key] = Number.isFinite(numericValue) ? numericValue : value;
      return;
    }

    if (key === "BillToAddress") {
      payload.Address = value;
      return;
    }

    if (key === "ShipToAddress") {
      payload.Address2 = value;
      return;
    }

    payload[key] = value;
  });

  return payload;
}

function applyDocumentDueDate(
  payload: Record<string, any>,
  docDueDate?: string | null,
) {
  const apiPayload = { ...payload };

  if (docDueDate) {
    apiPayload.DocDueDate = docDueDate;
  } else {
    delete apiPayload.DocDueDate;
  }

  return apiPayload;
}

function buildLineBaseFields(
  line: SalesDocumentLine,
  documentMode: "items" | "service" | undefined,
): Record<string, unknown> {
  if (documentMode === "service") {
    return {
      AccountCode: line.AccountCode || "",
      AccountName: line.AccountName || "",
      ItemDescription: line.Description || "",
      LineTotal: Number(line.LineTotal) || 0,
      UnitPrice: Number(line.LineTotal) || 0,
      DiscountPercent: Number(line.DiscountPercent) || 0,
      VatGroup: line.TaxCode || "",
    };
  }

  return {
    ItemCode: line.ItemCode || "",
    Quantity: Number(line.Quantity) || 0,
    UnitPrice: Number(line.Price) || 0,
    DiscountPercent: Number(line.DiscountPercent) || 0,
    VatGroup: line.TaxCode || "",
    WarehouseCode: line.WarehouseCode || "",
    UoMCode: line.UoMCode || "",
  };
}

export function buildSalesDocumentPayload({
  data,
  lines,
  docEntry,
  lastLoadedDocType,
  targetDocType,
  discountPercent = 0,
  freight = 0,
  additionalExpenses = [],
  downPaymentType,
  salesPersonCode,
  documentMode,
}: BuildSalesPayloadOptions) {
  const hasCopyFrom =
    docEntry &&
    Number(docEntry) > 0 &&
    lastLoadedDocType &&
    lastLoadedDocType !== targetDocType;
  const branchId = getSalesDocumentBranchId(data);

  const payload = {
    ...(branchId !== undefined && {
      BPL_IDAssignedToInvoice: branchId,
    }),
    ...pickLineUdfs(data),
    ...mapDocumentHeaderFields(data),
    CardCode: data.CardCode,
    ...(targetDocType !== DocumentType.ARInvoice && data.CardName && { CardName: data.CardName }),
    DocType: documentMode === "service" ? "dDocument_Service" : "dDocument_Items",
    DocDate: data.DocDate,
    DocDueDate: data.ManualDueDate || data.DocDueDate,
    TaxDate: data.TaxDate,
    BranchRegNo: data.BranchRegNo,
    Comments: data.Comments,
    ...(downPaymentType
      ? { DownPaymentType: downPaymentType, DownPaymentPercentage: discountPercent || 0 }
      : discountPercent > 0 ? { DiscountPercent: discountPercent } : {}),
    ...(salesPersonCode !== undefined && salesPersonCode !== null && { SalesPersonCode: salesPersonCode }),
    DocumentLines: lines.map((line, index) => {
      const baseFields = buildLineBaseFields(line, documentMode);

      if (hasCopyFrom) {
        baseFields.BaseType = lastLoadedDocType;
        baseFields.BaseEntry = docEntry;
        baseFields.BaseLine = line.LineNum;
      } else if ((!docEntry || Number(docEntry) <= 0) && targetDocType !== DocumentType.ARInvoice) {
        baseFields.BaseType = -1;
        baseFields.BaseEntry = null;
        baseFields.BaseLine = null;
      }

      if (targetDocType === DocumentType.ARInvoice) {
        delete baseFields.UoMCode;
        if (Number(line.DiscountPercent) === 0) delete baseFields.DiscountPercent;
      }

      const lineExpenses = mapLineExpenses(line);
      if (lineExpenses.length > 0) {
        baseFields.DocumentLineAdditionalExpenses = lineExpenses;
      }

      const serialNumbers = withBaseLineNumber(line.SerialNumbers, index);
      if (serialNumbers) baseFields.SerialNumbers = serialNumbers;
      const batchNumbers = withBaseLineNumber(line.BatchNumbers, index);
      if (batchNumbers) baseFields.BatchNumbers = batchNumbers;

      Object.assign(baseFields, pickLineUdfs(line));

      return baseFields;
    }),
    ...(additionalExpenses.length > 0 && {
      DocumentAdditionalExpenses: additionalExpenses.map((e) => ({
        ExpenseCode: e.ExpenseCode,
        LineTotal: e.LineTotal,
        VatGroup: e.VatGroup || e.TaxCode || "",
      })),
    }),
    ...(freight > 0 && { Freight: freight }),
    ...(targetDocType === DocumentType.ARInvoice &&
      data.FatherType && {
        FatherType: data.FatherType,
        FatherCard: data.FatherCard || "",
      }),
  };

  const finalPayload = applyDocumentDueDate(payload, data.DocDueDate);
  console.log("Full SAP sales document payload:", {
    ...data,
    ...finalPayload,
    DocumentLines: lines,
  });
  return finalPayload;
}

export function buildSalesDocumentPatchPayload({
  data,
  lines,
  discountPercent = 0,
  freight = 0,
  additionalExpenses = [],
  downPaymentType,
  includeLines = true,
  targetDocType,
  salesPersonCode,
  documentMode = "items",
}: Pick<
  BuildSalesPayloadOptions,
  "data" | "lines" | "discountPercent" | "freight" | "additionalExpenses" | "downPaymentType" | "salesPersonCode"
> & { includeLines?: boolean; targetDocType?: DocumentType; documentMode?: "items" | "service" }) {
  const branchId = getSalesDocumentBranchId(data);

  const payload = {
    ...(branchId !== undefined && {
      BPL_IDAssignedToInvoice: branchId,
    }),
    ...pickLineUdfs(data),
    ...mapDocumentHeaderFields(data),
    DocType: documentMode === "service" ? "dDocument_Service" : "dDocument_Items",
    Comments: data.Comments,
    ...(data.JournalMemo !== undefined && { JournalMemo: data.JournalMemo }),
    ...(data.DocDate && { DocDate: data.DocDate }),
    ...((data.ManualDueDate || data.DocDueDate) && { DocDueDate: data.ManualDueDate || data.DocDueDate }),
    ...(data.TaxDate && { TaxDate: data.TaxDate }),
    ...(data.BranchRegNo && { BranchRegNo: data.BranchRegNo }),
    ...(downPaymentType
      ? { DownPaymentType: downPaymentType, DownPaymentPercentage: discountPercent || 0 }
      : includeLines
        ? { DiscountPercent: discountPercent || 0 }
        : {}),
    ...(salesPersonCode !== undefined && salesPersonCode !== null && { SalesPersonCode: salesPersonCode }),
    ...(includeLines && {
      DocumentLines: lines.map((line, index) => {
        const baseFields = buildLineBaseFields(line, documentMode);

        if (targetDocType === DocumentType.ARInvoice) {
          delete baseFields.UoMCode;
          if (Number(line.DiscountPercent) === 0) delete baseFields.DiscountPercent;
        }

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

        Object.assign(baseFields, pickLineUdfs(line));

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
    ...(includeLines && freight > 0 && { Freight: freight }),
    ...(targetDocType === DocumentType.ARInvoice &&
      data.FatherType && {
        FatherType: data.FatherType,
        FatherCard: data.FatherCard || "",
      }),
  };

  const finalPayload = applyDocumentDueDate(payload, data.DocDueDate);
  console.log("Full SAP sales document patch payload:", {
    ...data,
    ...finalPayload,
    DocumentLines: lines,
  });
  return finalPayload;
}
