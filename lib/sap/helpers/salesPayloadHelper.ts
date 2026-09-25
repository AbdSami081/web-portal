import { SalesDocumentLine } from "@/types/sales/salesDocuments.type";
import { QuotationFormData } from "@/lib/schemas/quotationSchema";
import { DocumentType } from "@/types/master/DocumentType";

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

  return {
    CardCode: data.CardCode,
    CardName: data.CardName,
      DocType:
    documentMode === "service"
      ? "dDocument_Service"
      : "dDocument_Items",

    DocDate: data.DocDate,
    DocDueDate: data.DocDueDate,
    TaxDate: data.TaxDate,
    Comments: data.Comments,
    ...(downPaymentType
      ? { DownPaymentType: downPaymentType, DownPaymentPercentage: discountPercent || 0 }
      : { DiscountPercent: discountPercent || 0 }),
    ...(salesPersonCode !== undefined && salesPersonCode !== null && { SalesPersonCode: salesPersonCode }),
    DocumentLines: lines.map((line, index) => {
      // const baseFields: Record<string, unknown> = {
      //   ItemCode: line.ItemCode,
      //   Quantity: Number(line.Quantity) || 0,
      //   UnitPrice: Number(line.Price) || 0,
      //   DiscountPercent: Number(line.DiscountPercent) || 0,
      //   VatGroup: line.TaxCode || "",
      //   WarehouseCode: line.WarehouseCode || "",
      //   UoMCode: line.UoMCode || "",
      //   AccountCode: line.AccountCode || "",
      //  AccountName: line.AccountName || "",
      //  Description: line.Description || "",
      // };
const baseFields: Record<string, unknown> =
  documentMode === "service"
    ? {
        AccountCode: line.AccountCode || "",
        AccountName: line.AccountName || "",
        Description: line.Description || "",
        LineTotal: Number(line.LineTotal) || 0,
          ItemDescription: line.Description || "",
        UnitPrice: Number(line.LineTotal) || 0,
        DiscountPercent: Number(line.DiscountPercent) || 0,
        VatGroup: line.TaxCode || "",
      }
    : {
        ItemCode: line.ItemCode || "",
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
    ...(freight > 0 && { Freight: freight }),
    ...(targetDocType === DocumentType.ARInvoice &&
      data.FatherType && {
        FatherType: data.FatherType,
        FatherCard: data.FatherCard || "",
      }),
  };
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
  return {
      DocType:
    documentMode === "service"
      ? "dDocument_Service"
      : "dDocument_Items",
    Comments: data.Comments,
    ...(data.DocDate && { DocDate: data.DocDate }),
    ...(data.DocDueDate && { DocDueDate: data.DocDueDate }),
    ...(data.TaxDate && { TaxDate: data.TaxDate }),
     ...(downPaymentType
      ? { DownPaymentType: downPaymentType, DownPaymentPercentage: discountPercent || 0 }
      : includeLines
        ? { DiscountPercent: discountPercent || 0 }
        : {}),
    ...(salesPersonCode !== undefined && salesPersonCode !== null && { SalesPersonCode: salesPersonCode }),
    ...(includeLines && {
      DocumentLines: lines.map((line, index) => {
        // const baseFields: Record<string, unknown> = {
        //   ItemCode: line.ItemCode,
        //   Quantity: Number(line.Quantity) || 0,
        //   UnitPrice: Number(line.Price) || 0,
        //   DiscountPercent: Number(line.DiscountPercent) || 0,
        //   VatGroup: line.TaxCode || "",
        //   WarehouseCode: line.WarehouseCode || "",
        //   UoMCode: line.UoMCode || "",
        // };
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
        ItemCode: line.ItemCode || "",
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
    ...(includeLines && freight > 0 && { Freight: freight }),
    ...(targetDocType === DocumentType.ARInvoice &&
      data.FatherType && {
        FatherType: data.FatherType,
        FatherCard: data.FatherCard || "",
      }),
  };
}
