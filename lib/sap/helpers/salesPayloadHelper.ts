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

// SAP Service Layer requires each Serial/BatchNumbers entry to carry BaseLineNumber —
// the 0-based index of the DocumentLine it belongs to — or the allocation can be
// silently dropped on save.
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
    DocumentLines: lines.map((line, index) => {
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
}: Pick<
  BuildSalesPayloadOptions,
  "data" | "lines" | "discountPercent" | "freight" | "additionalExpenses" | "downPaymentType"
> & { includeLines?: boolean }) {
  return {
    Comments: data.Comments,
    ...(data.DocDate && { DocDate: data.DocDate }),
    ...(data.DocDueDate && { DocDueDate: data.DocDueDate }),
    ...(data.TaxDate && { TaxDate: data.TaxDate }),
    // includeLines:false means SAP has this document's transactional data locked
    // post-add (e.g. Delivery rejects an unchanged Quantity resend with "Incorrect
    // 'Qty (Inventory UoM)' in line ..."). Only header remarks/dates/attachments are
    // safe to patch for those document types. Mirrors buildPurchaseDocumentPatchPayload.
    ...(includeLines && { DiscountPercent: discountPercent || 0 }),
    ...(includeLines && {
      DocumentLines: lines.map((line, index) => {
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
  };
}
