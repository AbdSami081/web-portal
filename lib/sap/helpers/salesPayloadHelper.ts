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
  // Set only for A/R Down Payment Request ("dptRequest") / Invoice ("dptInvoice") — the
  // DownPayments Service Layer entity is shared by both, so this line-level field is what
  // tells SAP which one each record actually is.
  downPaymentType?: string;
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
}: BuildSalesPayloadOptions) {
  const hasCopyFrom =
    docEntry &&
    Number(docEntry) > 0 &&
    lastLoadedDocType &&
    lastLoadedDocType !== targetDocType;

  return {
    CardCode: data.CardCode,
    CardName: data.CardName,
    DocDate: data.DocDate,
    DocDueDate: data.DocDueDate,
    TaxDate: data.TaxDate,
    Comments: data.Comments,
    DiscountPercent: discountPercent || 0,
    DocumentLines: lines.map((line) => {
      const baseFields: Record<string, unknown> = {
        ItemCode: line.ItemCode,
        Quantity: Number(line.Quantity) || 0,
        UnitPrice: Number(line.Price) || 0,
        DiscountPercent: Number(line.DiscountPercent) || 0,
        VatGroup: line.TaxCode || "",
        WarehouseCode: line.WarehouseCode || "",
        UoMCode: line.UoMCode || "",
      };

      if (downPaymentType) {
        baseFields.DownPaymentType = downPaymentType;
      }

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

      if (line.SerialNumbers && line.SerialNumbers.length > 0) {
        baseFields.SerialNumbers = line.SerialNumbers;
      }
      if (line.BatchNumbers && line.BatchNumbers.length > 0) {
        baseFields.BatchNumbers = line.BatchNumbers;
      }

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
  };
}


export function buildSalesDocumentPatchPayload({
  data,
  lines,
  discountPercent = 0,
  freight = 0,
  additionalExpenses = [],
  downPaymentType,
}: Pick<
  BuildSalesPayloadOptions,
  "data" | "lines" | "discountPercent" | "freight" | "additionalExpenses" | "downPaymentType"
>) {
  return {
    Comments: data.Comments,
    ...(data.DocDate && { DocDate: data.DocDate }),
    ...(data.DocDueDate && { DocDueDate: data.DocDueDate }),
    ...(data.TaxDate && { TaxDate: data.TaxDate }),
    DiscountPercent: discountPercent || 0,
    DocumentLines: lines.map((line) => {
      const baseFields: Record<string, unknown> = {
        ItemCode: line.ItemCode,
        Quantity: Number(line.Quantity) || 0,
        UnitPrice: Number(line.Price) || 0,
        DiscountPercent: Number(line.DiscountPercent) || 0,
        VatGroup: line.TaxCode || "",
        WarehouseCode: line.WarehouseCode || "",
        UoMCode: line.UoMCode || "",
      };

      if (downPaymentType) {
        baseFields.DownPaymentType = downPaymentType;
      }

      // Existing lines carry their SAP LineNum - the backend sends
      // B1S-ReplaceCollectionsOnPatch so omitted lines get deleted.
      // New lines must NOT carry LineNum ("-1" is rejected by SAP).
      if (line.LineNum !== undefined && line.LineNum >= 0) {
        baseFields.LineNum = line.LineNum;
      }

      const lineExpenses = mapLineExpenses(line);
      if (lineExpenses.length > 0) {
        baseFields.DocumentLineAdditionalExpenses = lineExpenses;
      }

      if (line.SerialNumbers && line.SerialNumbers.length > 0) {
        baseFields.SerialNumbers = line.SerialNumbers;
      }
      if (line.BatchNumbers && line.BatchNumbers.length > 0) {
        baseFields.BatchNumbers = line.BatchNumbers;
      }

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
  };
}
