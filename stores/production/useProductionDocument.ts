import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { BaseProductionDocument, PRDDocumentLine } from "@/types/production/PRDDoc.type";
import { DocumentType } from "@/types/sales/salesDocuments.type";

interface IFPRDDocumentStore {
  docType: DocumentType;
  customer: BusinessPartner | null;
  lines: PRDDocumentLine[];

  setCustomer: (customer: BusinessPartner) => void;
  setDocType: (docType: DocumentType) => void;
  addLine: (line: PRDDocumentLine) => void;
  removeLine: (itemCode: string) => void;
  loadFromDocument: (doc: any, type?: number, isCopy?: boolean) => void;
  updateLine: (itemCode: string, updated: Partial<PRDDocumentLine>) => void;
  reset: () => void;
}

export const useIFPRDDocument = create<IFPRDDocumentStore>()(
  devtools((set, get) => ({
    docType: DocumentType.IssueForProduction,
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
    loadFromDocument: (doc: any, type?: number, isCopy?: boolean) => {
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
        lines: mappedLines,
      });
    },
    reset: () =>
      set({
        customer: null,
        lines: [],
        docType: DocumentType.IssueForProduction,
      }),
  }))
);
