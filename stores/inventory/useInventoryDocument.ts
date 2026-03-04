import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { InventoryDocumentLine } from "@/types/inventory/inventory.type";

interface IOPRDDocumentStore {
  customer: BusinessPartner | null;
  lines: InventoryDocumentLine[];
  warehouses: any[];
  DocEntry: number;
  lastLoadedDocType: number | null;
  fromWarehouse: string;
  toWarehouse: string;
  comments: string;
  journalMemo: string;
  docDate: string;
  docStatus: string;
  isCopyingTo: boolean;

  setCustomer: (customer: BusinessPartner | null) => void;
  setWarehouses: (warehouses: any[]) => void;
  setDocEntry: (DocEntry: number) => void;
  setFromWarehouse: (whs: string) => void;
  setToWarehouse: (whs: string) => void;
  setComments: (v: string) => void;
  setJournalMemo: (v: string) => void;
  setDocDate: (v: string) => void;
  setIsCopyingTo: (v: boolean) => void;
  addLine: (line: InventoryDocumentLine) => void;
  removeLine: (index: number) => void;
  updateLine: (itemCode: string, updated: Partial<InventoryDocumentLine>) => void;
  updateAllLinesWarehouse: (whs: string, isFrom: boolean) => void;
  attachments: {
    LineNum: number;
    SourcePath: string;
    FileName: string;
    AttachmentDate: string;
    FreeText: string;
    CopyToTarget: boolean;
    File?: File;
  }[];
  addAttachment: (file: File) => void;
  removeAttachment: (lineNum: number) => void;
  updateAttachment: (lineNum: number, updated: Partial<IOPRDDocumentStore["attachments"][0]>) => void;
  loadFromDocument: (doc: any, type?: number, isCopy?: boolean) => void;
  reset: () => void;
}

const today = () => new Date().toISOString().split("T")[0];

export const useInventoryDocument = create<IOPRDDocumentStore>()(
  devtools((set, get) => ({
    customer: null,
    lines: [],
    warehouses: [],
    DocEntry: 0,
    lastLoadedDocType: null,

    // Header defaults
    fromWarehouse: "",
    toWarehouse: "",
    comments: "",
    journalMemo: "",
    docDate: today(),
    docStatus: "",
    isCopyingTo: false,
    attachments: [],

    setCustomer: (customer) => set({ customer }),
    setWarehouses: (warehouses) => set({ warehouses }),
    setDocEntry: (DocEntry) => set({ DocEntry }),
    setFromWarehouse: (fromWarehouse) => set({ fromWarehouse }),
    setToWarehouse: (toWarehouse) => set({ toWarehouse }),
    setComments: (comments) => set({ comments }),
    setJournalMemo: (journalMemo) => set({ journalMemo }),
    setDocDate: (docDate) => set({ docDate }),
    setIsCopyingTo: (isCopyingTo) => set({ isCopyingTo }),

    addLine: (line) => {
      const existing = get().lines.find((l) => l.ItemCode === line.ItemCode);
      if (existing) {
        get().updateLine(existing.ItemCode, { Quantity: existing.Quantity + line.Quantity });
      } else {
        set((s) => ({ lines: [...s.lines, line] }));
      }
    },

    removeLine: (index: number) =>
      set((s) => ({ lines: s.lines.filter((_, i) => i !== index) })),

    updateLine: (itemCode, updated) =>
      set((s) => ({
        lines: s.lines.map((l) => (l.ItemCode === itemCode ? { ...l, ...updated } : l)),
      })),

    updateAllLinesWarehouse: (whsCode, isFrom) =>
      set((s) => ({
        lines: s.lines.map((l) => ({
          ...l,
          [isFrom ? "FromWhsCode" : "WhsCode"]: whsCode,
        })),
      })),

    addAttachment: (file: File) => {
      const { attachments } = get();
      const newLineNum = attachments.length > 0 ? Math.max(...attachments.map(a => a.LineNum)) + 1 : 1;

      const newAttachment = {
        LineNum: newLineNum,
        SourcePath: process.env.NEXT_PUBLIC_ATTACHMENT_SOURCE_PATH || "",
        FileName: file.name,
        AttachmentDate: new Date().toISOString().split("T")[0],
        FreeText: "",
        CopyToTarget: false,
        File: file
      };
      set({ attachments: [...attachments, newAttachment] });
    },

    removeAttachment: (lineNum: number) => {
      set((s) => ({
        attachments: s.attachments.filter((a) => a.LineNum !== lineNum)
      }));
    },

    updateAttachment: (lineNum, updated) => {
      set((s) => ({
        attachments: s.attachments.map((a) => a.LineNum === lineNum ? { ...a, ...updated } : a)
      }));
    },

    loadFromDocument: (doc, type, isCopy) => {
      const rawLines = doc.DocumentLines || doc.StockTransferLines || doc.InventoryTransferLines || [];
      const lines: InventoryDocumentLine[] = rawLines.map((line: any, idx: number) => ({
        ItemCode: line.ItemCode,
        Dscription: line.ItemDescription || line.Dscription || line.ItemName || "",
        FromWhsCode: line.FromWarehouseCode || line.FromWhsCode || doc.FromWarehouse || "",
        WhsCode: line.WarehouseCode || line.WhsCode || doc.ToWarehouse || "",
        Quantity: Number(line.Quantity) || 0,
        ItemCost: Number(line.UnitPrice || line.ItemCost || 0),
        UomCode: line.UoMCode || line.UomCode || "",
        LineNum: line.LineNum ?? idx,
        BaseType: isCopy ? type : line.BaseType,
        BaseEntry: isCopy ? doc.DocEntry : line.BaseEntry,
        BaseLine: isCopy ? (line.LineNum ?? idx) : line.BaseLine,
      }));

      const attachments = doc.Attachments_Lines?.Attachments2_Lines?.map((att: any) => ({
        LineNum: att.LineNum,
        SourcePath: att.SourcePath || att.TargetPath || "",
        FileName: att.FileExtension ? `${att.FileName}.${att.FileExtension}` : att.FileName,
        AttachmentDate: att.AttachmentDate ? att.AttachmentDate.split("T")[0] : today(),
        FreeText: att.FreeText || "",
        CopyToTarget: att.CopyToTarget === "tYES" || att.CopyToTargetDoc === "tYES",
      })) || [];

      set({
        lines,
        DocEntry: isCopy ? 0 : (doc.DocEntry || 0),
        lastLoadedDocType: type ?? null,
        fromWarehouse: doc.FromWarehouse || "",
        toWarehouse: doc.ToWarehouse || "",
        comments: isCopy ? "" : (doc.Comments || ""),
        journalMemo: isCopy ? "" : (doc.JournalMemo || doc.JrnlMemo || ""),
        docDate: isCopy ? today() : (doc.TaxDate ? doc.TaxDate.split("T")[0] : today()),
        docStatus: isCopy ? "" : (doc.DocumentStatus || ""),
        attachments: isCopy ? [] : attachments,
        customer: doc.CardCode
          ? { CardCode: doc.CardCode, CardName: doc.CardName || "", CardType: "cCustomer", Balance: 0, Phone1: "", Email: "" }
          : null,
      });
    },

    reset: () => {
      if (get().isCopyingTo) {
        set({ isCopyingTo: false });
        return;
      }
      set({
        customer: null,
        lines: [],
        warehouses: [],
        DocEntry: 0,
        lastLoadedDocType: null,
        fromWarehouse: "",
        toWarehouse: "",
        comments: "",
        journalMemo: "",
        docDate: today(),
        docStatus: "",
        isCopyingTo: false,
        attachments: [],
      });
    },
  }))
);
