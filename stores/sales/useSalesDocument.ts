import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "../../types/sales/businessPartner.type";
import { BaseSalesDocument, DocCurrency, SalesDocumentLine } from "@/types/sales/salesDocuments.type";

interface SalesDocumentStore {
  docType: "Quotation" | "Order" | "Delivery" | "ARInvoice";
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
  DocTotal: number;
  additionalExpenses: {
    ExpenseCode: number;
    LineTotal: number;
    TaxCode?: string;
    VatGroup?: string;
    Remarks?: string;
  }[];
  isCopying: boolean;
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
  loadFromDocument: (doc: any) => void;
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

export const useSalesDocument = create<SalesDocumentStore>()(

  devtools((set, get) => ({
    docType: "Quotation",
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
    DocTotal: 0,
    DocEntry: 0,
    additionalExpenses: [],
    isCopying: false,

    setIsCopying: (val) => set({ isCopying: val }),
    setCustomer: (c) => set({ customer: c }),
    setDocDate: (d) => set({ docDate: d }),
    setDocDueDate: (d) => set({ docDueDate: d }),
    setTaxDate: (d) => set({ taxDate: d }),
    setComments: (text) => set({ comments: text }),
    setFreight: (f) => set({ freight: f }),
    setRounding: (r) => set({ rounding: r }),
    setDiscountPercent: (p) => set({ discountPercent: p }),
    setCurrency: (c) => set({ currency: c }),
    setDocTotal: (dt) => set({ DocTotal: dt }),
    setTaxTotal: (TaxTotal) => set({ TaxTotal }),
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
              updatedLine.LineTotal = updatedLine.Quantity * updatedLine.Price; // Recalculate line total
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
      const { lines, freight, rounding, discountPercent } = get();

      let totalBeforeDiscount = 0;
      let totalTax = 0;

      const discountedLines = lines.map((line: SalesDocumentLine) => {
        const qty = Number(line.Quantity) || 0;
        const price = Number(line.Price) || 0;
        const discount = Number(line.DiscountPercent || 0);
        const taxRate = Number(line.TaxRate || 0);

        const lineSubtotal = qty * price;
        const discountAmount = (lineSubtotal * discount) / 100;
        const taxed = (lineSubtotal - discountAmount) * (taxRate / 100);

        totalBeforeDiscount += lineSubtotal - discountAmount; // discount included
        totalTax += taxed;

        return { ...line, LineTotal: lineSubtotal - discountAmount + taxed };
      });

      const expensesTotal = get().additionalExpenses.reduce(
        (sum, e) => sum + Number(e.LineTotal || 0),
        0
      );


      const docTotal =
        totalBeforeDiscount +
        totalTax +
        Number(freight) +
        Number(rounding) +
        expensesTotal;

      set({
        lines: discountedLines,
        TotalBeforeDiscount: parseFloat(totalBeforeDiscount.toFixed(2)),
        TaxTotal: parseFloat(totalTax.toFixed(2)),
        DocTotal: parseFloat(docTotal.toFixed(2)),
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
        DocTotal: 0,
        DocEntry: 0,
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

    loadFromDocument: (doc: any) => {
      const rawLines = doc.DocumentLines || doc.lines || [];

      const mappedLines = rawLines.map((line: any, index: number) => {
        if (line.ItemCode && line.LineTotal !== undefined && !line.ItemDescription) {
          return line;
        }

        const qty = Number(line.Quantity);
        const price = Number(line.Price || line.UnitPrice);
        const discount = Number(line.DiscountPercent || 0);
        const taxRate = Number(line.TaxPercentagePerRow || 0);

        const lineSubtotal = qty * price;
        const discountAmount = (lineSubtotal * discount) / 100;
        const taxed = (lineSubtotal - discountAmount) * (taxRate / 100);

        return {
          LineNum: line.LineNum !== undefined ? line.LineNum : index,
          ItemCode: line.ItemCode,
          ItemName: line.ItemDescription || line.ItemName || "",
          Quantity: qty,
          Price: price,
          DiscountPercent: discount,
          TaxRate: taxRate,
          LineTotal: lineSubtotal - discountAmount + taxed,
          WarehouseCode: line.WarehouseCode || "",
          TaxAmount: taxed,
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
        freight: doc.Freight || doc.freight || 0,
        rounding: doc.Rounding || doc.rounding || 0,
        currency: doc.DocCurrency || doc.Currency || "USD",
        DocEntry: doc.DocEntry || null,
        additionalExpenses: doc.DocumentLineAdditionalExpenses || doc.additionalExpenses || []
      });

      get().calculateTotals();
    },
    setAdditionalExpenses: (exp) => set({ additionalExpenses: exp }),
  }))
);