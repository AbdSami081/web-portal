import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { SalesDocumentLine, DocumentType } from "@/types/sales/salesDocuments.type";
import { BaseInventoryDocument, InventoryDocumentLine } from "@/types/inventory/inventory.type";

interface IOPRDDocumentStore {
  docType: DocumentType;
  customer: BusinessPartner | null;
  lines: InventoryDocumentLine[];
  warehouses: any[];
  DocEntry: number;
  isCopying: boolean;
  lastLoadedDocType: number | null;

  setCustomer: (customer: BusinessPartner) => void;
  setWarehouses: (warehouses: any[]) => void;
  setDocType: (docType: DocumentType) => void;
  addLine: (line: InventoryDocumentLine) => void;
  removeLine: (itemCode: string) => void;
  loadFromDocument: (doc: any, type?: number) => void;
  updateLine: (itemCode: string, updated: Partial<InventoryDocumentLine>) => void;
  setIsCopying: (isCopying: boolean) => void;
  reset: () => void;
}

export const useInventoryDocument = create<IOPRDDocumentStore>()(
  devtools((set, get) => ({
    docType: DocumentType.InvTransfer,
    customer: null,
    lines: [],
    warehouses: [],
    DocEntry: 0,
    isCopying: false,
    lastLoadedDocType: null,

    setCustomer: (customer: BusinessPartner) => set({ customer }),
    setWarehouses: (warehouses: any[]) => set({ warehouses }),
    setDocType: (docType: DocumentType) => set({ docType }),
    setIsCopying: (isCopying: boolean) => set({ isCopying }),

    addLine: (line: InventoryDocumentLine) => {
      const existingLine = get().lines.find((l) => l.ItemCode === line.ItemCode);
      if (existingLine) {
        get().updateLine(existingLine.ItemCode, {
          ...existingLine,
          Quantity: existingLine.Quantity + line.Quantity,
        });
      } else {
        set((s) => ({ lines: [...s.lines, line] }), false, "addLine");
      }
    },

    removeLine: (itemCode: string) => {
      set((state) => ({
        lines: state.lines.filter((line) => line.ItemCode !== itemCode),
      }));
    },

    loadFromDocument: (doc: any, type?: number) => {
      const mappedLines: InventoryDocumentLine[] = (doc.DocumentLines || doc.StockTransferLines)?.map((line: any) => ({
        ItemCode: line.ItemCode,
        Dscription: line.ItemDescription || line.Dscription || "",
        FromWhsCode: line.FromWarehouseCode || line.FromWhsCode || "",
        WhsCode: line.WarehouseCode || line.WhsCode || "",
        Quantity: Number(line.Quantity) || 0,
        ItemCost: Number(line.UnitPrice || line.ItemCost || line.Price) || 0,
        UomCode: line.UoMCode || line.UomCode || "",
        LineNum: line.LineNum,
        BaseType: line.BaseType,
        BaseEntry: line.BaseEntry,
        BaseLine: line.BaseLine,
      })) || [];

      set({
        customer: {
          CardCode: doc.CardCode,
          CardName: doc.CardName || "",
          CardType: "cCustomer",
          Balance: 0,
          Phone1: "",
          Email: "",
        },
        lines: mappedLines,
        DocEntry: doc.DocEntry || 0,
        lastLoadedDocType: type || null,
      });
    },

    updateLine: (itemCode: string, updated: Partial<InventoryDocumentLine>) => {
      set((state) => ({
        lines: state.lines.map((line) =>
          line.ItemCode === itemCode ? { ...line, ...updated } : line
        ),
      }));
    },

    reset: () =>
      set({
        customer: null,
        lines: [],
        warehouses: [],
        docType: DocumentType.InvTransfer,
        DocEntry: 0,
        isCopying: false,
        lastLoadedDocType: null,
      }),
  }))
);
