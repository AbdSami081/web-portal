import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { SalesDocumentLine } from "@/types/sales/salesDocuments.type";
import { BaseInventoryDocument, InventoryDocumentLine } from "@/types/inventory/inventory.type";

interface IOPRDDocumentStore {
  docType: "InventoryTransfer" | "InventoryTransferRequest";
  customer: BusinessPartner | null;
  lines: InventoryDocumentLine[];

  setCustomer: (customer: BusinessPartner) => void;
  setDocType: (docType: "InventoryTransfer" | "InventoryTransferRequest") => void;
  addLine: (line: InventoryDocumentLine) => void;
  removeLine: (itemCode: string) => void;
  loadFromDocument: (doc: BaseInventoryDocument) => void;
  updateLine: (itemCode: string, updated: Partial<InventoryDocumentLine>) => void;
  reset: () => void;
}

export const useInventoryDocument = create<IOPRDDocumentStore>()(
  devtools((set, get) => ({
    docType: "InventoryTransfer",
    customer: null,
    lines: [],

    setCustomer: (customer) => set({ customer }),

    setDocType: (docType) => set({ docType }),

   addLine: (line) => {
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

    removeLine: (itemCode) => {
      set((state) => ({
        lines: state.lines.filter((line) => line.ItemCode !== itemCode),
      }));
    },

    loadFromDocument: (doc: BaseInventoryDocument) => {
      const mappedLines: InventoryDocumentLine[] = doc.DocumentLines?.map((line: any) => ({
        ItemCode: line.ItemCode,
        Dscription: line.Dscription || "",
        FromWhsCode: line.FromWhsCode || "",
        FromBinLoc: line.FromBinLoc || "",
        WhsCode: line.WhsCode || "",
        ToBinLoc: line.ToBinLoc || "",
        FisrtBin: line.FisrtBin || "",
        Quantity: Number(line.Quantity) || 0,
        ItemCost: Number(line.ItemCost) || 0,
        UomCode: line.UomCode || "",
        unitMsr: line.unitMsr || "",
        OcrCode2: line.OcrCode2 || "",
        OcrCode3: line.OcrCode3 || "",
        OcrCode4: line.OcrCode4 || "",
        PlPaWght: Number(line.PlPaWght) || 0,
        U_LastPrice: Number(line.U_LastPrice) || 0,
        PPTaxExRe: line.PPTaxExRe || "",
        U_OQCR: line.U_OQCR || "",
        U_OQDC: line.U_OQDC || "",
        U_LPP2: Number(line.U_LPP2) || 0,
        U_FBRQty: Number(line.U_FBRQty) || 0,
        U_SaleType: line.U_SaleType || "",
        U_FurtherTax: line.U_FurtherTax || "",
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
      });
    },

    reset: () =>
      set({
        customer: null,
        lines: [],
        docType: "InventoryTransfer",
      }),
  }))
);
