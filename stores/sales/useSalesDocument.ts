// import { create } from "zustand";
// import { devtools } from "zustand/middleware";
// import { BusinessPartner } from "../types/sales/businessPartner.type";
// import { BaseSalesDocument, DocCurrency, SalesDocumentLine } from "@/types/sales/salesDocuments.type";

// interface SalesDocumentStore {
//   docType: "Quotation" | "Order" | "Delivery" | "ARInvoice";
//   customer: BusinessPartner | null;
//   lines: SalesDocumentLine[];
//   docDate: string;
//   comments: string;
//   freight: number;
//   rounding: number;
//   discountPercent: number;
//   currency: DocCurrency;

//   TotalBeforeDiscount: number;
//   TaxTotal: number;
//   DocTotal: number;

//   setCustomer: (c: BusinessPartner) => void;
//   setDocDate: (d: string) => void;
//   setComments: (text: string) => void;
//   setFreight: (f: number) => void;
//   setRounding: (r: number) => void;
//   setDiscountPercent: (p: number) => void;
//   setCurrency: (c: DocCurrency) => void;

//   addLine: (line: SalesDocumentLine) => void;
//   updateLine: (itemCode: string, updated: Partial<SalesDocumentLine>) => void;
//   removeLine: (itemCode: string) => void;

//   calculateTotals: () => void;
//   reset: () => void;
//   loadFromDocument: (doc: any) => void;
// }

// export const useSalesDocument = create<SalesDocumentStore>()(
//   devtools((set, get) => ({
//     docType: "Quotation",
//     customer: null,
//     lines: [],
//     docDate: new Date().toISOString().split("T")[0],
//     comments: "",
//     freight: 0,
//     rounding: 0,
//     discountPercent: 0,
//     currency: "USD",

//     TotalBeforeDiscount: 0,
//     TaxTotal: 0,
//     DocTotal: 0,

//     setCustomer: (c) => set({ customer: c }),
//     setDocDate: (d) => set({ docDate: d }),
//     setComments: (text) => set({ comments: text }),
//     setFreight: (f) => set({ freight: f }),
//     setRounding: (r) => set({ rounding: r }),
//     setDiscountPercent: (p) => set({ discountPercent: p }),
//     setCurrency: (c) => set({ currency: c }),

//     addLine: (line) => {
//       const existingLine = get().lines.find(
//         (l) => l.ItemCode === line.ItemCode
//       );
//       console.log("existingLine", existingLine);
//       if (existingLine) {
//         get().updateLine(existingLine.ItemCode, {
//           ...existingLine,
//           Quantity: Number(existingLine.Quantity) + 1,
//           Price: line.Price,
//           LineTotal: line.Price,
//         });
//       } else {
//         set((s) => ({ lines: [...s.lines, line] }), false, "addLine");
//         console.log("addLine", line);
//         get().calculateTotals();
//       }
//     },

//     updateLine: (itemCode, updated) => {
//       console.log("updateLine", updated);
//       set(
//         (s) => {
//           const lines = s.lines.map((line) => {
//             if (line.ItemCode === itemCode) {
//               return { ...line, ...updated };
//             }
//             return line;
//           });
//           console.log("lines", lines);
//           return { lines };
//         },
//         false,
//         "updateLine"
//       );
//       get().calculateTotals();
//     },

//     removeLine: (itemCode) => {
//       set(
//         (s) => {
//           const lines = s.lines.filter((line) => line.ItemCode !== itemCode);
//           return { lines };
//         },
//         false,
//         "removeLine"
//       );
//       get().calculateTotals();
//     },

//     calculateTotals: () => {
//       const { lines, freight, rounding, discountPercent } = get();

//       let totalBeforeDiscount = 0;
//       let totalTax = 0;

//       const discountedLines = lines.map((line: SalesDocumentLine) => {
//         const qty = Number(line.Quantity) || 0;
//         const price = Number(line.Price) || 0;
//         const discount = Number(line.DiscountPercent ?? 0);
//         const taxRate = Number(line.TaxRate ?? 0);

//         const lineSubtotal = qty * price;
//         const discountAmount = (lineSubtotal * discount) / 100;
//         const taxed = (lineSubtotal - discountAmount) * (taxRate / 100);

//         totalBeforeDiscount += lineSubtotal;
//         totalTax += taxed;

//         return { ...line, LineTotal: lineSubtotal - discountAmount + taxed };
//       });

//       const docTotal =
//         totalBeforeDiscount -
//         (totalBeforeDiscount * discountPercent) / 100 +
//         totalTax +
//         freight +
//         rounding;

//       set({
//         lines: discountedLines,
//         TotalBeforeDiscount: parseFloat(totalBeforeDiscount.toFixed(2)),
//         TaxTotal: parseFloat(totalTax.toFixed(2)),
//         DocTotal: parseFloat(docTotal.toFixed(2)),
//       });
//     },

//     reset: () =>
//       set({
//         customer: null,
//         lines: [],
//         docDate: new Date().toISOString().split("T")[0],
//         comments: "",
//         freight: 0,
//         rounding: 0,
//         discountPercent: 0,
//         TotalBeforeDiscount: 0,
//         TaxTotal: 0,
//         DocTotal: 0,
//         currency: "USD",
//       }),

//     loadFromDocument: (doc: any) => {
//       const mappedLines = doc.DocumentLines?.map((line: any) => ({
//         ItemCode: line.ItemCode,
//         ItemDescription: line.ItemDescription || "",
//         Quantity: line.Quantity,
//         Price: line.Price || line.UnitPrice,
//         LineTotal: line.LineTotal,
//         DiscountPercent: line.DiscountPercent || 0,
//         TaxRate: line.TaxPercentagePerRow || 0,
//         WarehouseCode: line.WarehouseCode || "",
//         PackageQuantity: line.PackageQuantity || 0,
//         TaxAmount: line.NetTaxAmount
//       })) || [];

//       set({
//         customer: {
//           CardCode: doc.CardCode,
//           CardName: doc.CardName,
//           CardType: "cCustomer",
//           Balance: 0,
//           Phone1: "",
//           Email: "",
//           Currency: doc.Currency || "USD",
//         },
//         lines: mappedLines,
//         docDate: doc.DocDate?.split("T")[0] || new Date().toISOString().split("T")[0],
//         comments: doc.Comments || "",
//         freight: doc.Freight || 0,
//         rounding: doc.Rounding || 0,
//         currency: doc.Currency || "USD",
//       });

//       get().calculateTotals();
//     },
//   }))
// );

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "../../types/sales/businessPartner.type";
import { BaseSalesDocument, DocCurrency, SalesDocumentLine } from "@/types/sales/salesDocuments.type";

interface SalesDocumentStore {
  docType: "Quotation" | "Order" | "Delivery" | "ARInvoice";
  customer: BusinessPartner | null;
  lines: SalesDocumentLine[];
  docDate: string;
  comments: string;
  freight: number;
  rounding: number;
  discountPercent: number;
  currency: DocCurrency;

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
  
  setCustomer: (c: BusinessPartner) => void;
  setDocDate: (d: string) => void;
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
    comments: "",
    freight: 0,
    rounding: 0,
    discountPercent: 0,
    currency: "USD",

    TotalBeforeDiscount: 0,
    TaxTotal: 0,
    DocTotal: 0,
    additionalExpenses: [],

    setCustomer: (c) => set({ customer: c }),
    setDocDate: (d) => set({ docDate: d }),
    setComments: (text) => set({ comments: text }),
    setFreight: (f) => set({ freight: f }),
    setRounding: (r) => set({ rounding: r }),
    setDiscountPercent: (p) => set({ discountPercent: p }),
    setCurrency: (c) => set({ currency: c }),
    setDocTotal: (dt) => set({ DocTotal: dt }),
    setTaxTotal: (TaxTotal) => set({ TaxTotal}),
    addLine: (line) => {
      const existingLine = get().lines.find((l) => l.ItemCode === line.ItemCode);
      if (existingLine) {
        get().updateLine(existingLine.ItemCode, {
          ...existingLine,
          Quantity: existingLine.Quantity + line.Quantity,
          LineTotal: existingLine.Quantity * line.Price, 
          Price : line.Price
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
        comments: "",
        freight: 0, 
        rounding: 0,
        discountPercent: 0,
        TotalBeforeDiscount: 0,
        TaxTotal: 0,
        DocTotal: 0,
        currency: "USD",
        additionalExpenses: [],
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
      const mappedLines = doc.DocumentLines?.map((line: any) => {
        const qty = Number(line.Quantity);
        const price = Number(line.Price || line.UnitPrice);
        const discount = Number(line.DiscountPercent || 0);
        const taxRate = Number(line.TaxPercentagePerRow || 0);

        const lineSubtotal = qty * price;
        const discountAmount = (lineSubtotal * discount) / 100;
        const taxed = (lineSubtotal - discountAmount) * (taxRate / 100);
        const lineTotal = lineSubtotal - discountAmount + taxed;

        return {
          ItemCode: line.ItemCode,
          ItemName: line.ItemDescription || "",
          Quantity: qty,
          Price: price,
          DiscountPercent: discount,
          TaxRate: taxRate,
          LineTotal: lineTotal,
          WarehouseCode: line.WarehouseCode || "",
          //PackageQuantity: line.PackageQuantity || 0,
          TaxAmount: taxed,
          UoMCode: line.UoMCode,
          TaxCode: line.VatGroup,
          //InvQty: line.InventoryQuantity
          
        };
      }) || [];

      set({
        customer: {
          CardCode: doc.CardCode,
          CardName: doc.CardName,
          CardType: "cCustomer",
          Balance: 0,
          Phone1: "",
          Email: "",
          Currency: doc.Currency || "USD",
          DocumentStatus: doc.DocumentStatus,
        },
        lines: mappedLines,
        docDate: doc.DocDate?.split("T")[0] || new Date().toISOString().split("T")[0],
        comments: doc.Comments || "",
        freight: doc.Freight || 0,
        rounding: doc.Rounding || 0,
        currency: doc.Currency || "USD",
        DocTotal: doc.docTotal,
        additionalExpenses: doc.DocumentLineAdditionalExpenses || []
      });

      get().calculateTotals();
    },
    setAdditionalExpenses: (exp) => set({ additionalExpenses: exp }),
  }))
);