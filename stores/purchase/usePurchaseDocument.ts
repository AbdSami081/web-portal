import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { PurchaseDocumentLine, PurchaseDocumentType } from "@/types/purchase/purchaseDocuments.type";

interface PurchaseDocumentStore {
  docType: PurchaseDocumentType;
  
  requester: string;
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

  // Setters
  setRequester: (r: string) => void;
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

  addLine: (line: PurchaseDocumentLine) => void;
  updateLine: (index: number, updated: Partial<PurchaseDocumentLine>) => void;
  removeLine: (index: number) => void;
  clearLines: () => void;

  calculateTotals: () => void;
  reset: () => void;
  
  setTaxTotal: (TaxTotal: number) => void;
  setAdditionalExpenses: (exp: any[]) => void;
  
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
    docType: PurchaseDocumentType.PurchaseRequest,
    requester: "",
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
    attachments: [],

    setRequester: (r) => set({ requester: r }),
    setRequesterName: (rn) => set({ requesterName: rn }),
    setBranch: (b) => set({ branch: b }),
    setDepartment: (d) => set({ department: d }),

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
      set((state) => ({ lines: [...state.lines, line] }));
      get().calculateTotals();
    },
    updateLine: (index, updated) => {
      set((state) => {
        const newLines = [...state.lines];
        newLines[index] = { ...newLines[index], ...updated };
        return { lines: newLines };
      });
      get().calculateTotals();
    },
    removeLine: (index) => {
      set((state) => ({ lines: state.lines.filter((_, i) => i !== index) }));
      get().calculateTotals();
    },
    clearLines: () => {
      set({ lines: [] });
      get().calculateTotals();
    },

    setTaxTotal: (TaxTotal) => set({ TaxTotal }),
    setAdditionalExpenses: (exp) => set({ additionalExpenses: exp }),
    
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
        const taxRate = 0; // Or whatever is derived from TaxCode
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
      requester: "",
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
    }),
  }))
);
