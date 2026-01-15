import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { BaseProductionDocument, PRDDocumentLine } from "@/types/production/PRDDoc.type";

interface IFPRDDocumentStore {
  docType: "IssueForProduction";
  customer: BusinessPartner | null;
  lines: PRDDocumentLine[];

  setCustomer: (customer: BusinessPartner) => void;
  setDocType: (docType: "IssueForProduction") => void;
  addLine: (line: PRDDocumentLine) => void;
  removeLine: (itemCode: string) => void;
  loadFromDocument: (doc: BaseProductionDocument) => void;
  updateLine: (itemCode: string, updated: Partial<PRDDocumentLine>) => void;
  reset: () => void;
}

export const useIFPRDDocument = create<IFPRDDocumentStore>()(
  devtools((set, get) => ({
    docType: "IssueForProduction",
    customer: null,
    lines: [],

    setCustomer: (customer) => set({ customer }),

    setDocType: (docType) => set({ docType }),

   addLine: (line) => {
      const existingLine = get().lines.find((l) => l.ItemNo === line.ItemNo);

      if (existingLine) {
        get().updateLine(existingLine.ItemNo, {
          ...existingLine,
          PlannedQuantity: existingLine.PlannedQuantity + line.PlannedQuantity,
        });
      } else {
        set((s) => ({ lines: [...s.lines, line] }), false, "addLine");
      }
    },

    removeLine: (itemCode) => {
      set((state) => ({
        lines: state.lines.filter((line) => line.ItemNo !== itemCode),
      }));
    },
    loadFromDocument: (doc: BaseProductionDocument) => {
      const mappedLines = doc.ProductionOrderLines?.map((line: any) => {
        return {
          ItemNo: line.ItemNo,
          ItemName: line.ItemName,
          PlannedQuantity: line.PlannedQuantity,
          Warehouse: line.Warehouse,
          ItemType: line.ItemType
        };

      }) || [];
      set({
        // customer: {
        //   CardCode: doc.CardCode,
        //   CardName: doc.CardName,
        //   CardType: "cCustomer",
        //   Balance: 0,
        //   Phone1: "",
        //   Email: "",
        //   Currency: doc.Currency || "USD",
        //   DocumentStatus: doc.DocumentStatus,
        // },
        
        lines: mappedLines,
      });
    },
    reset: () =>
      set({
        customer: null,
        lines: [],
        docType: "IssueForProduction",
      }),
  }))
);
