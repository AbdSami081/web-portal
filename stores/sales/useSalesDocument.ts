import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "../../types/sales/businessPartner.type";
import { BaseSalesDocument, DocCurrency, SalesDocumentLine } from "@/types/sales/salesDocuments.type";
import { calculateFreightTax } from "@/utils/taxCalculations";
import { useMasterDataStore } from "./useMasterDataStore";
import { DocumentType } from "@/types/master/DocumentType";


interface SalesDocumentStore {
  docType: DocumentType;
  customer: BusinessPartner | null;
  lines: SalesDocumentLine[];
  docDate: string;
  docDueDate: string;
  taxDate: string;
  comments: string;
  freight: number;
  rounding: number;
  discountPercent: number;
  currency: DocCurrency;
  DocEntry: number;
  DocNum: number;
  TotalBeforeDiscount: number;
  TaxTotal: number;
  discSum: number;
  DocTotal: number;
  TotalFreight: number;
  DocumentStatus: string;
  additionalExpenses: {
    ExpenseCode: number;
    LineTotal: number;
    TaxCode?: string;
    VatGroup?: string;
    Remarks?: string;
  }[];
  attachments: {
    LineNum: number;
    SourcePath: string;
    FileName: string;
    AttachmentDate: string;
    FreeText: string;
    CopyToTarget: boolean;
    File?: File;
  }[];
  udfs: Record<string, any>;
  isCopying: boolean;
  lastLoadedDocType: number | null; // Track original doc type
  setIsCopying: (val: boolean) => void;

  setCustomer: (c: BusinessPartner) => void;
  setDocDate: (d: string) => void;
  setDocDueDate: (d: string) => void;
  setTaxDate: (d: string) => void;
  setComments: (text: string) => void;
  setFreight: (f: number) => void;
  setRounding: (r: number) => void;
  setDiscountPercent: (p: number) => void;
  setDiscountSum: (s: number) => void;
  setCurrency: (c: DocCurrency) => void;

  setDocTotal: (dt: number) => void;

  addLine: (line: SalesDocumentLine) => void;
  updateLine: (itemCode: string, updated: Partial<SalesDocumentLine>) => void;
  setLineSerials: (itemCode: string, serials: { InternalSerialNumber: string }[]) => void;
  setLineBatches: (itemCode: string, batches: { BatchNumber: string; Quantity: number }[]) => void;
  removeLine: (itemCode: string) => void;


  calculateTotals: () => void;
  reset: () => void;
  loadFromDocument: (doc: any, type?: number, isCopy?: boolean) => void;
  clearLines: () => void;
  setTaxTotal: (TaxTotal: number) => void;

  setAdditionalExpenses: (
    exp: {
      ExpenseCode: number;
      LineTotal: number;
      TaxCode?: string;
      VatGroup?: string;
      Remarks?: string;
    }[]
  ) => void;

  addAttachment: (file: File) => void;
  updateAttachment: (lineNum: number, updated: Partial<{ FreeText: string; CopyToTarget: boolean; SourcePath: string }>) => void;
  removeAttachment: (lineNum: number) => void;
}

const parseSafe = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const n = parseFloat(String(val).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
};

export const useSalesDocument = create<SalesDocumentStore>()(
  devtools((set, get) => ({
    docType: DocumentType.Quotation,
    customer: null,
    lines: [],
    docDate: new Date().toISOString().split("T")[0],
    docDueDate: new Date().toISOString().split("T")[0],
    taxDate: new Date().toISOString().split("T")[0],
    comments: "",
    freight: 0,
    rounding: 0,
    discountPercent: 0,
    currency: "USD",

    TotalBeforeDiscount: 0,
    TaxTotal: 0,
    discSum: 0,
    DocTotal: 0,
    TotalFreight: 0,
    DocumentStatus: "bost_Open",
    DocEntry: 0,
    DocNum: 0,
    lastLoadedDocType: null,
    additionalExpenses: [],
    attachments: [],
    udfs: {},
    isCopying: false,

    setIsCopying: (val) => set({ isCopying: val }),
    setCustomer: (c) => set({ customer: c }),
    setDocDate: (d) => set({ docDate: d }),
    setDocDueDate: (d) => set({ docDueDate: d }),
    setTaxDate: (d) => set({ taxDate: d }),
    setComments: (text) => set({ comments: text }),
    setFreight: (f) => {
      set({ freight: parseSafe(f) });
      get().calculateTotals();
    },
    setRounding: (r) => {
      set({ rounding: parseSafe(r) });
      get().calculateTotals();
    },
    setDiscountPercent: (p) => {
      const percent = parseSafe(p);
      const { TotalBeforeDiscount } = get();
      const amount = (TotalBeforeDiscount * percent) / 100;
      set({ discountPercent: percent, discSum: amount });
      get().calculateTotals();
    },
    setDiscountSum: (amount: number) => {
      const amt = parseSafe(amount);
      const { TotalBeforeDiscount } = get();
      const percent = TotalBeforeDiscount > 0 ? (amt / TotalBeforeDiscount) * 100 : 0;
      set({ discSum: amt, discountPercent: percent });
      get().calculateTotals();
    },
    setCurrency: (c) => set({ currency: c }),
    setDocTotal: (dt) => set({ DocTotal: parseSafe(dt) }),
    setTaxTotal: (tt) => set({ TaxTotal: parseSafe(tt) }),

    addLine: (line) => {
      const existingLine = get().lines.find((l) => l.ItemCode === line.ItemCode);
      if (existingLine) {
        get().updateLine(existingLine.ItemCode, {
          ...existingLine,
          Quantity: existingLine.Quantity + line.Quantity,
          LineTotal: existingLine.Quantity * line.Price,
          Price: line.Price
        });
      } else {
        set((s) => ({ lines: [...s.lines, line] }), false, "addLine");
        get().calculateTotals();
      }
    },

    updateLine: (itemCode, updated) => {
      set(
        (s) => {
          const lines = s.lines.map((line) => {
            if (line.ItemCode === itemCode) {
              const updatedLine = { ...line, ...updated };
              const qty = parseSafe(updatedLine.Quantity);
              const price = parseSafe(updatedLine.Price);
              updatedLine.LineTotal = qty * price;
              return updatedLine;
            }
            return line;
          });
          return { lines };
        },
        false,
        "updateLine"
      );
      get().calculateTotals();
    },

    setLineSerials: (itemCode, serials) => {
      set(
        (s) => ({
          lines: s.lines.map((line) =>
            line.ItemCode === itemCode ? { ...line, SerialNumbers: serials } : line
          ),
        }),
        false,
        "setLineSerials"
      );
    },

    setLineBatches: (itemCode, batches) => {
      set(
        (s) => ({
          lines: s.lines.map((line) =>
            line.ItemCode === itemCode ? { ...line, BatchNumbers: batches } : line
          ),
        }),
        false,
        "setLineBatches"
      );
    },

    removeLine: (itemCode) => {
      set(
        (s) => {
          const lines = s.lines.filter((line) => line.ItemCode !== itemCode);
          return { lines };
        },
        false,
        "removeLine"
      );
      get().calculateTotals();
    },

    calculateTotals: () => {
      const { lines, freight, rounding, additionalExpenses, discSum } = get();
      const { freightsWithCharges } = useMasterDataStore.getState();

      let overallTotalBeforeDiscount = 0;
      let overallLineFreightAmount = 0;

        const processedLines = lines.map((line: SalesDocumentLine) => {
        
          // 1. Basic Line Values
        const quantity = parseSafe(line.Quantity);
        const unitPrice = parseSafe(line.Price);
        const lineDiscountPercent = parseSafe(line.DiscountPercent);
        const itemTaxRate = parseSafe(line.TaxRate);

        // 2. Line Subtotal and Item Discount
        const lineSubtotal = quantity * unitPrice;
        const lineDiscountAmount = (lineSubtotal * lineDiscountPercent) / 100;
        const lineAmountAfterDiscount = lineSubtotal - lineDiscountAmount;

        // 3. Item Tax Calculation
        const itemTaxAmount = lineAmountAfterDiscount * (itemTaxRate / 100);

        // 4. Line-Level Freight Calculations
        const f1 = calculateFreightTax(parseSafe(line.Freight1LCAmount), line.Freight1TaxGroup || "", freightsWithCharges);
        const f2 = calculateFreightTax(parseSafe(line.Freight2LCAmount), line.Freight2TaxGroup || "", freightsWithCharges);
        const f3 = calculateFreightTax(parseSafe(line.Freight3LCAmount), line.Freight3TaxGroup || "", freightsWithCharges);

        const lineFreightSubtotal = parseSafe(line.Freight1LCAmount) + parseSafe(line.Freight2LCAmount) + parseSafe(line.Freight3LCAmount);
        const lineFreightTaxTotal = f1.taxAmount + f2.taxAmount + f3.taxAmount;

        // 5. Accumulate Document-Level Totals
        overallTotalBeforeDiscount += lineAmountAfterDiscount;
        overallLineFreightAmount += lineFreightSubtotal;

        // 6. Return Updated Line with Calculated Fields
        return {
          ...line,
          Quantity: quantity,
          Price: unitPrice,
          TaxAmount: Number((itemTaxAmount + lineFreightTaxTotal).toFixed(2)) || 0,
          LineTotal: Number((lineAmountAfterDiscount + lineFreightSubtotal + itemTaxAmount + lineFreightTaxTotal).toFixed(2)) || 0,
        };
      });

      // 7. Header Level Expenses and Freight
      const totalAdditionalExpenses = additionalExpenses.reduce(
        (sum, e) => sum + parseSafe(e.LineTotal),
        0
      );

      const totalTaxAmount = processedLines.reduce((sum, line) => sum + (line.TaxAmount || 0), 0);
      const totalFreightAmount = parseSafe(freight) + overallLineFreightAmount;

      // 8. Final Document Total Calculation
      // Formula: (Subtotal + Tax + Freight + Rounding + Expenses) - Header Discount
      const finalDocTotal =
        overallTotalBeforeDiscount +
        totalTaxAmount +
        totalFreightAmount +
        parseSafe(rounding) +
        totalAdditionalExpenses -
        parseSafe(discSum);

      set({
        lines: processedLines,
        TotalBeforeDiscount: parseSafe(overallTotalBeforeDiscount),
        TaxTotal: parseSafe(totalTaxAmount),
        TotalFreight: totalFreightAmount,
        DocTotal: parseSafe(finalDocTotal),
      });
    },

    reset: () =>
      set({
        customer: null,
        lines: [],
        docDate: new Date().toISOString().split("T")[0],
        docDueDate: new Date().toISOString().split("T")[0],
        taxDate: new Date().toISOString().split("T")[0],
        comments: "",
        freight: 0,
        rounding: 0,
        discountPercent: 0,
        TotalBeforeDiscount: 0,
        TaxTotal: 0,
        discSum: 0,
        DocTotal: 0,
        DocEntry: 0,
        DocNum: 0,
        DocumentStatus: "bost_Open",
        docType: DocumentType.Quotation,
        lastLoadedDocType: null,
        currency: "USD",
        additionalExpenses: [],
        attachments: [],
        udfs: {},
        isCopying: false,
      }),

    clearLines: () => {
      set(
        (s) => ({
          lines: [],
          TotalBeforeDiscount: 0,
          TaxTotal: 0,
          DocTotal: 0
        }),
        false,
        "clearLines"
      );
    },

    loadFromDocument: (doc: any, type?: number, isCopy?: boolean) => {
      const rawLines = doc.DocumentLines || doc.lines || [];

      const mappedLines = rawLines.map((line: any, index: number) => {
        const qty = parseSafe(line.Quantity);
        const price = parseSafe(line.UnitPrice || line.Price);
        let discount = parseSafe(line.DiscountPercent);
        if (discount < 0) discount = 0; // Prevent negative discount
        const taxRate = parseSafe(line.TaxPercentagePerRow || line.VatPrcnt);

        const lineSubtotal = qty * price;
        const discountAmount = (lineSubtotal * discount) / 100;
        const calculatedTax = (lineSubtotal - discountAmount) * (taxRate / 100);

        return {
          LineNum: line.LineNum !== undefined ? line.LineNum : index,
          ItemCode: line.ItemCode,
          ItemName: line.ItemDescription || line.ItemName || "",
          Quantity: qty,
          Price: price,
          DiscountPercent: discount,
          TaxRate: taxRate,
          LineTotal: parseSafe(line.LineTotal) || (lineSubtotal - discountAmount + calculatedTax),
          ManSerNum: line.ManSerNum || "",
          ManBatNum: line.ManBatNum || "",
          WarehouseCode: line.WarehouseCode || "",
          TaxAmount: parseSafe(line.TaxTotal || line.TaxSum) || calculatedTax,
          UoMCode: line.UoMCode,
          TaxCode: line.VatGroup || line.TaxCode,
          BaseType: line.BaseType,
          BaseEntry: line.BaseEntry,
          BaseLine: line.BaseLine,
          Comments: line.Comments,
          // Map line-level freight from SAP collection to UI flat fields
          Freight1Type: line.DocumentLineAdditionalExpenses?.[0]?.ExpenseCode?.toString() || "",
          Freight1LCAmount: parseSafe(line.DocumentLineAdditionalExpenses?.[0]?.LineTotal),
          Freight1TaxGroup: line.DocumentLineAdditionalExpenses?.[0]?.TaxCode || line.DocumentLineAdditionalExpenses?.[0]?.VatGroup || "",
          
          Freight2Type: line.DocumentLineAdditionalExpenses?.[1]?.ExpenseCode?.toString() || "",
          Freight2LCAmount: parseSafe(line.DocumentLineAdditionalExpenses?.[1]?.LineTotal),
          Freight2TaxGroup: line.DocumentLineAdditionalExpenses?.[1]?.TaxCode || line.DocumentLineAdditionalExpenses?.[1]?.VatGroup || "",
          
          Freight3Type: line.DocumentLineAdditionalExpenses?.[2]?.ExpenseCode?.toString() || "",
          Freight3LCAmount: parseSafe(line.DocumentLineAdditionalExpenses?.[2]?.LineTotal),
          Freight3TaxGroup: line.DocumentLineAdditionalExpenses?.[2]?.TaxCode || line.DocumentLineAdditionalExpenses?.[2]?.VatGroup || "",
        };
      });

      const udfValues: Record<string, any> = {};
      Object.keys(doc).forEach(key => {
        if (key.startsWith("U_")) {
          udfValues[key] = doc[key];
        }
      });

      set({
        customer: doc.customer || {
          CardCode: doc.CardCode,
          CardName: doc.CardName,
          CardType: "cCustomer",
          Balance: 0,
          Phone1: "",
          Email: "",
          Currency: doc.DocCurrency || doc.Currency || "USD",
          DocumentStatus: "bost_Open",
        },
        lines: mappedLines,
        docDate: (doc.DocDate || doc.docDate || new Date().toISOString()).split("T")[0],
        docDueDate: (doc.DocDueDate || doc.docDueDate || new Date().toISOString()).split("T")[0],
        taxDate: (doc.TaxDate || doc.taxDate || new Date().toISOString()).split("T")[0],
        comments: (doc.Comments !== undefined && doc.Comments !== null) ? doc.Comments : (doc.comments !== undefined && doc.comments !== null ? doc.comments : ""),
        freight: parseSafe(doc.Freight || doc.freight),
        rounding: parseSafe(doc.Rounding || doc.rounding),
        discountPercent: parseSafe(doc.DiscountPercent || doc.discountPercent),
        currency: doc.DocCurrency || doc.Currency || "USD",
        DocEntry: isCopy ? 0 : parseSafe(doc.DocEntry),
        DocNum: isCopy ? 0 : parseSafe(doc.DocNum),
        DocumentStatus: doc.DocumentStatus || doc.DocStatus || "bost_Open",
        lastLoadedDocType: type || null,
        DocTotal: parseSafe(doc.DocTotal || doc.docTotal),
        TaxTotal: parseSafe(doc.TaxTotal || doc.taxTotal),
        discSum: parseSafe(doc.DiscSum || doc.discSum),
        TotalBeforeDiscount: parseSafe(doc.TotalBeforeDiscount || doc.SumBeforeDiscount),
        additionalExpenses: (doc.DocumentAdditionalExpenses || doc.DocumentLineAdditionalExpenses || doc.additionalExpenses || []).map((e: any) => ({
          ExpenseCode: parseSafe(e.ExpenseCode),
          LineTotal: parseSafe(e.LineTotal),
          TaxCode: e.TaxCode || e.VatGroup || "",
          VatGroup: e.VatGroup || e.TaxCode || "",
          Remarks: e.Remarks || ""
        })),
        attachments: isCopy ? [] : (doc.Attachments_Lines?.Attachments2_Lines || []).map((line: any) => ({
          LineNum: line.LineNum,
          SourcePath: line.SourcePath || "",
          FileName: line.FileName + (line.FileExtension ? "." + line.FileExtension : ""),
          AttachmentDate: (line.AttachmentDate || "").split("T")[0],
          FreeText: line.FreeText || "",
          CopyToTarget: line.CopyToTargetDoc === "tYES",
        })),
        udfs: udfValues,
      });

      get().calculateTotals();
    },
    setAdditionalExpenses: (exp) => set({ additionalExpenses: exp }),

    addAttachment: (file: File) => {
      const { attachments } = get();
      const newLineNum = attachments.length > 0 ? Math.max(...attachments.map(a => a.LineNum)) + 1 : 1;

      let sourcePath = process.env.NEXT_PUBLIC_ATTACHMENT_SOURCE_PATH || "";
      // Try to get path from various possible properties if available (e.g. Electron, specific browser setups)
      const fullPath = (file as any).path || (file as any).webkitRelativePath || "";

      if (fullPath) {
        const lastIndex = Math.max(fullPath.lastIndexOf('\\'), fullPath.lastIndexOf('/'));
        if (lastIndex !== -1) {
          sourcePath = fullPath.substring(0, lastIndex);
        }
      }

      const newAttachment = {
        LineNum: newLineNum,
        SourcePath: sourcePath,
        FileName: file.name,
        AttachmentDate: new Date().toISOString().split("T")[0],
        FreeText: "",
        CopyToTarget: false,
        File: file
      };
      set({ attachments: [...attachments, newAttachment] });
    },

    updateAttachment: (lineNum, updated) => {
      set((s) => ({
        attachments: s.attachments.map((a) => a.LineNum === lineNum ? { ...a, ...updated } : a)
      }));
    },

    removeAttachment: (lineNum) => {
      set((s) => ({
        attachments: s.attachments.filter((a) => a.LineNum !== lineNum)
      }));
    },
  }))
);