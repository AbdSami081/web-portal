import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { PurchaseDocumentLine, PurchaseDocumentType } from "@/types/purchase/purchaseDocuments.type";
import { BusinessPartner } from "@/types/purchase/businessPartner.type"; 
import { DocumentType } from "@/types/master/DocumentType";

interface PurchaseDocumentStore {
  docType: PurchaseDocumentType;
  vendor: BusinessPartner | null;
  requester: BusinessPartner | null;
  requesterName: string;
  branch: string;
  department: string;

  lines: PurchaseDocumentLine[];
  docDate: string;
  docDueDate: string;
  taxDate: string;
  requiredDate: string;
  comments: string;
  
  freight: number;
  rounding: number;
  discountPercent: number;
  currency: string;
  
  DocEntry: number;
  DocNum: number;
  TotalBeforeDiscount: number;
  TaxTotal: number;
  discSum: number;
  DocTotal: number;
  TotalFreight: number;
  
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
  lastLoadedDocType: number | null;
  loadedDraftData: any | null;
  setLoadedDraftData: (data: any) => void;
  setIsCopying: (val: boolean) => void;

  setVendor: (v: BusinessPartner) => void;
  setRequester: (r: BusinessPartner | null) => void;
  setRequesterName: (rn: string) => void;
  setBranch: (b: string) => void;
  setDepartment: (d: string) => void;

  setDocDate: (d: string) => void;
  setDocDueDate: (d: string) => void;
  setTaxDate: (d: string) => void;
  setRequiredDate: (d: string) => void;
  setComments: (text: string) => void;
  
  setFreight: (f: number) => void;
  setRounding: (r: number) => void;
  setDiscountPercent: (p: number) => void;
  setDiscountSum: (s: number) => void;
  setCurrency: (c: string) => void;
  setDocTotal: (dt: number) => void;
  setLineSerials: (itemCode: string, serials: { InternalSerialNumber: string }[]) => void;
  setLineBatches: (itemCode: string, batches: { BatchNumber: string; Quantity: number }[]) => void;
  addLine: (line: PurchaseDocumentLine) => void;
  updateLine: (itemCode: string, updated: Partial<PurchaseDocumentLine>) => void;
  updateLineByIndex: (index: number, updated: Partial<PurchaseDocumentLine>) => void;
  removeLine: (itemCode: string) => void;
  clearLines: () => void;

  calculateTotals: () => void;
  reset: () => void;
  loadFromDocument: (doc: any, type?: number, isCopy?: boolean) => void;
  setTaxTotal: (TaxTotal: number) => void;
  setAdditionalExpenses: (exp: any[]) => void;
  updateAttachment: (lineNum: number, updated: Partial<{ FreeText: string; CopyToTarget: boolean; SourcePath: string }>) => void;
  addAttachment: (file: File) => void;
  removeAttachment: (lineNum: number) => void;
}

const parseSafe = (val: any): number => {
  if (val === undefined || val === null) return 0;
  const n = parseFloat(String(val).replace(/,/g, ""));
  return isNaN(n) ? 0 : n;
};

export const usePurchaseDocument = create<PurchaseDocumentStore>()(
  devtools((set, get) => ({
    docType: PurchaseDocumentType.PurchaseRequests,
    requester: null,
    requesterName: "",
    branch: "",
    department: "",
    lines: [],
    docDate: new Date().toISOString().split("T")[0],
    docDueDate: new Date().toISOString().split("T")[0],
    taxDate: new Date().toISOString().split("T")[0],
    requiredDate: new Date().toISOString().split("T")[0],
    comments: "",
    freight: 0,
    rounding: 0,
    discountPercent: 0,
    currency: "PKR",
    DocEntry: 0,
    DocNum: 0,
    TotalBeforeDiscount: 0,
    TaxTotal: 0,
    discSum: 0,
    DocTotal: 0,
    TotalFreight: 0,
    additionalExpenses: [],
    vendor: null,
    attachments: [],
    lastLoadedDocType: null,
    udfs: {},
    isCopying: false,
    loadedDraftData: null,

    setVendor: (v) => set({ vendor: v }),
    setRequester: (r) => set({ requester: r }),
    setRequesterName: (rn) => set({ requesterName: rn }),
    setBranch: (b) => set({ branch: b }),
    setDepartment: (d) => set({ department: d }),
    setLoadedDraftData: (data) => set({ loadedDraftData: data }),
    setIsCopying: (val) => set({ isCopying: val }),

    setDocDate: (d) => set({ docDate: d }),
    setDocDueDate: (d) => set({ docDueDate: d }),
    setTaxDate: (d) => set({ taxDate: d }),
    setRequiredDate: (d) => set({ requiredDate: d }),
    setComments: (c) => set({ comments: c }),
    
    setFreight: (f) => { set({ freight: f }); get().calculateTotals(); },
    setRounding: (r) => { set({ rounding: r }); get().calculateTotals(); },
    setDiscountPercent: (p) => { set({ discountPercent: p }); get().calculateTotals(); },
    setDiscountSum: (s) => { set({ discSum: s }); get().calculateTotals(); },
    setCurrency: (c) => set({ currency: c }),
    setDocTotal: (dt) => set({ DocTotal: dt }),

    addLine: (line) => {
      const existingLine = get().lines.find((l) => l.ItemCode === line.ItemCode);
      if (existingLine) {
        get().updateLine(existingLine.ItemCode, {
          Quantity: (Number(existingLine.Quantity) || 0) + (Number(line.Quantity) || 1),
          Price: line.Price !== undefined ? line.Price : existingLine.Price,
        });
      } else {
        set((state) => ({ lines: [...state.lines, line] }));
        get().calculateTotals();
      }
    },
    updateLine: (itemCode: string, updated: Partial<PurchaseDocumentLine>) => {
      set((state) => {
        const newLines = [...state.lines];
        const index = newLines.findIndex((line) => line.ItemCode === itemCode);
        if (index !== -1) {
          newLines[index] = { ...newLines[index], ...updated };
        }
        return { lines: newLines };
      });
      get().calculateTotals();
    },
    // Same-ItemCode lines (e.g. a return split across two warehouses/batches) all match
    // the first index findIndex() picks, so updateLine("code", ...) collapses every
    // matching row onto that one line and flip-flops it between rows on every render —
    // a real infinite update loop for documents with duplicate item codes. Row-level
    // effects (PurchaseItemRow) must target their own array position instead.
    updateLineByIndex: (index: number, updated: Partial<PurchaseDocumentLine>) => {
      set((state) => {
        if (index < 0 || index >= state.lines.length) return state;
        const newLines = [...state.lines];
        newLines[index] = { ...newLines[index], ...updated };
        return { lines: newLines };
      });
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
    removeLine: (itemCode: string) => {
      set((state) => ({ lines: state.lines.filter((line) => line.ItemCode !== itemCode) }));
      get().calculateTotals();
    },
    clearLines: () => {
      set({ lines: [] });
      get().calculateTotals();
    },

    setTaxTotal: (TaxTotal) => set({ TaxTotal }),
    setAdditionalExpenses: (exp) => set({ additionalExpenses: exp }),
    loadFromDocument: (doc: any, type?: number, isCopy?: boolean) => {
      const rawLines = doc.DocumentLines || doc.lines || [];

      const mappedLines = rawLines.map((line: any, index: number) => {
        const qty = parseSafe(line.Quantity);
        const price = parseSafe(line.UnitPrice || line.Price);
        let discount = parseSafe(line.DiscountPercent);
        if (discount < 0) discount = 0;
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
          ManSerNum: line.ManSerNum || (line.SerialNumbers?.length ? "Y" : ""),
          ManBtchNum: line.ManBtchNum || (line.BatchNumbers?.length ? "Y" : ""),
          SerialNumbers: line.SerialNumbers || [],
          BatchNumbers: line.BatchNumbers || [],
          UoMCode: line.UoMCode,
          TaxCode: line.VatGroup || line.TaxCode,
          BaseType: line.BaseType,
          BaseEntry: line.BaseEntry,
          BaseLine: line.BaseLine,
          Comments: line.Comments,
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
        requester: doc.requester || {
          CardCode: doc.CardCode,
          CardName: doc.CardName,
          CardType: "cSupplier",
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
        // Every page's submit handler gates PATCH-vs-POST on lastLoadedDocType === its own
        // DocumentType — this was never actually written to the store (the `type` param was
        // accepted but unused), so that check was always false and "Update" always created a
        // duplicate document instead of patching the existing one. Matches useSalesDocument
        // and useInventoryDocument, which already set this correctly.
        lastLoadedDocType: type ?? null,
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
    addAttachment: (file) => {
      set((state) => ({
        attachments: [
          ...state.attachments,
          {
            LineNum: state.attachments.length,
            SourcePath: "",
            FileName: file.name,
            AttachmentDate: new Date().toISOString().split("T")[0],
            FreeText: "",
            CopyToTarget: false,
            File: file,
          },
        ],
      }));
    },
    updateAttachment: (lineNum, updated) => {
      set((s) => ({
        attachments: s.attachments.map((a) => a.LineNum === lineNum ? { ...a, ...updated } : a)
      }));
    },

    removeAttachment: (lineNum) => {
      set((state) => ({
        attachments: state.attachments.filter((a) => a.LineNum !== lineNum).map((a, i) => ({ ...a, LineNum: i })),
      }));
    },

    calculateTotals: () => {
      const { lines, discountPercent, freight } = get();
      
      let sumBeforeDiscount = 0;
      let totalTax = 0;
      let totalFreight = parseSafe(freight);

      lines.forEach((line) => {
        const qty = parseSafe(line.Quantity);
        const price = parseSafe(line.Price);
        const lineTotal = qty * price;
        const taxRate = 0;
        const taxAmt = lineTotal * (taxRate / 100);
        
        sumBeforeDiscount += lineTotal;
        totalTax += taxAmt;
      });

      const discSum = sumBeforeDiscount * (parseSafe(discountPercent) / 100);
      const finalDocTotal = (sumBeforeDiscount - discSum) + totalTax + totalFreight;

      set({
        TotalBeforeDiscount: sumBeforeDiscount,
        discSum,
        TaxTotal: totalTax,
        DocTotal: finalDocTotal,
        TotalFreight: totalFreight,
      });
    },

    reset: () => set({
      requester: null,
      requesterName: "",
      branch: "",
      department: "",
      lines: [],
      comments: "",
      freight: 0,
      rounding: 0,
      discountPercent: 0,
      DocEntry: 0,
      DocNum: 0,
      TotalBeforeDiscount: 0,
      TaxTotal: 0,
      discSum: 0,
      DocTotal: 0,
      TotalFreight: 0,
      additionalExpenses: [],
      attachments: [],
      lastLoadedDocType: null,
    }),
  }))
);
