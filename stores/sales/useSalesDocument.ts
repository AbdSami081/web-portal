import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "../../types/sales/businessPartner.type";
import { BaseSalesDocument, DocCurrency, SalesDocumentLine, DocumentType } from "@/types/sales/salesDocuments.type";

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
  TotalBeforeDiscount: number;
  TaxTotal: number;
  discSum: number;
  DocTotal: number;
  additionalExpenses: {
    ExpenseCode: number;
    LineTotal: number;
    TaxCode?: string;
    VatGroup?: string;
    Remarks?: string;
  }[];
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
  setCurrency: (c: DocCurrency) => void;

  setDocTotal: (dt: number) => void;

  addLine: (line: SalesDocumentLine) => void;
  updateLine: (itemCode: string, updated: Partial<SalesDocumentLine>) => void;
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
    DocEntry: 0,
    lastLoadedDocType: null,
    additionalExpenses: [],
    isCopying: false,

    setIsCopying: (val) => set({ isCopying: val }),
    setCustomer: (c) => set({ customer: c }),
    setDocDate: (d) => set({ docDate: d }),
    setDocDueDate: (d) => set({ docDueDate: d }),
    setTaxDate: (d) => set({ taxDate: d }),
    setComments: (text) => set({ comments: text }),
    setFreight: (f) => set({ freight: parseSafe(f) }),
    setRounding: (r) => set({ rounding: parseSafe(r) }),
    setDiscountPercent: (p) => set({ discountPercent: parseSafe(p) }),
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
      const { lines, freight, rounding, discountPercent, additionalExpenses } = get();

      let totalBeforeDiscount = 0;

      const discountedLines = lines.map((line: SalesDocumentLine) => {
        const qty = parseSafe(line.Quantity);
        const price = parseSafe(line.Price);
        const discount = parseSafe(line.DiscountPercent);
        const taxRate = parseSafe(line.TaxRate);

        const lineSubtotal = qty * price;
        const discountAmount = (lineSubtotal * discount) / 100;
        const taxed = (lineSubtotal - discountAmount) * (taxRate / 100);

        totalBeforeDiscount += (lineSubtotal - discountAmount);

        return {
          ...line,
          Quantity: qty,
          Price: price,
          LineTotal: Number((lineSubtotal - discountAmount + taxed).toFixed(2)) || 0,
          TaxAmount: Number(taxed.toFixed(2)) || 0
        };
      });

      const expensesTotal = additionalExpenses.reduce(
        (sum, e) => sum + parseSafe(e.LineTotal),
        0
      );

      const docDiscountFactor = 1 - (parseSafe(discountPercent) / 100);
      const finalBeforeDiscount = parseSafe(totalBeforeDiscount) * docDiscountFactor;

      const docTotal =
        finalBeforeDiscount +
        parseSafe(freight) +
        parseSafe(rounding) +
        expensesTotal;

      set({
        lines: discountedLines,
        TotalBeforeDiscount: parseSafe(totalBeforeDiscount),
        TaxTotal: 0,
        DocTotal: parseSafe(docTotal),
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
        docType: DocumentType.Quotation,
        lastLoadedDocType: null,
        currency: "USD",
        additionalExpenses: [],
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
        const discount = parseSafe(line.DiscountPercent);
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
          WarehouseCode: line.WarehouseCode || "",
          TaxAmount: parseSafe(line.TaxTotal || line.TaxSum) || calculatedTax,
          UoMCode: line.UoMCode,
          TaxCode: line.VatGroup || line.TaxCode,
          BaseType: line.BaseType,
          BaseEntry: line.BaseEntry,
          BaseLine: line.BaseLine,
          Comments: line.Comments,
        };
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
        }))
      });

      get().calculateTotals();
    },
    setAdditionalExpenses: (exp) => set({ additionalExpenses: exp }),
  }))
);