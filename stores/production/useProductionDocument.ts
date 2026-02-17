import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { BaseProductionDocument, PRDDocumentLine } from "@/types/production/PRDDoc.type";
import { DocumentType } from "@/types/sales/salesDocuments.type";

interface IFPRDDocumentStore {
  docType: DocumentType;
  customer: BusinessPartner | null;
  lines: PRDDocumentLine[];
  warehouses: any[];

  setWarehouses: (warehouses: any[]) => void;

  setCustomer: (customer: BusinessPartner) => void;
  setDocType: (docType: DocumentType) => void;
  addLine: (line: PRDDocumentLine) => void;
  removeLine: (itemCode: string) => void;
  loadFromDocument: (doc: any, type?: number, isCopy?: boolean) => void;
  updateLine: (itemCode: string, updated: Partial<PRDDocumentLine>) => void;
  loadFromBOM: (bom: any, plannedQty: number) => void;
  reset: () => void;
  recalculateFromHeader: (headerPlannedQty: number) => void;
}

export const useIFPRDDocument = create<IFPRDDocumentStore>()(
  devtools((set, get) => ({
    docType: DocumentType.IssueForProduction,
    customer: null,
    lines: [],
    warehouses: [],

    setWarehouses: (warehouses) => set({ warehouses }),
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
    updateLine: (itemCode, updated) => {
      set((state) => ({
        lines: state.lines.map((line) =>
          line.ItemNo === itemCode ? { ...line, ...updated } : line
        ),
      }));
    },
    loadFromDocument: (doc: any, type?: number, isCopy?: boolean) => {
      const mappedLines = doc.ProductionOrderLines?.map((line: any) => {
        return {
          ItemNo: line.ItemNo,
          ItemName: line.ItemName,
          PlannedQuantity: line.PlannedQuantity,
          Warehouse: line.Warehouse,
          ItemType: line.ItemType,
          BaseQuantity: line.BaseQuantity,
          BaseRatio: line.BaseRatio,
          IssuedQuantity: line.IssuedQuantity,
          AvailableQuantity: line.AvailableQuantity,
          UoMCode: line.UoMCode,
          ProductionOrderIssueType: line.ProductionOrderIssueType
        };
      }) || [];
      set({
        lines: mappedLines,
        docType: type || DocumentType.IssueForProduction,
      });
    },
    loadFromBOM: (bom: any, plannedQty: number = 0) => {
      const parentQty = Number(bom.Quantity || 1); // Parent quantity of BOM
      const mappedLines = bom.ProductTreeLines?.map((line: any) => {
        const lineQty = Number(line.Quantity || 0);
        const baseRatio = lineQty / parentQty;

        return {
          ItemNo: line.ItemCode,
          ItemName: line.ItemName || "",
          BaseQuantity: lineQty, // Store original line quantity here
          BaseRatio: baseRatio,
          BOMHeaderQty: parentQty, // Store header qty for recalculation
          PlannedQuantity: baseRatio * Number(plannedQty || 0),
          IssuedQuantity: 0,
          Warehouse: line.Warehouse || "",
          ProductionOrderIssueType: line.IssueMethod === "im_Backflush" ? "im_Backflush" : "im_Manual",
          ItemType: line.ItemType || "pit_Item",
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
        docType: DocumentType.IssueForProduction
      }),
    recalculateFromHeader: (headerPlannedQty: number) => {
      set((state) => ({
        lines: state.lines.map((line) => ({
          ...line,
          PlannedQuantity: Number(line.BaseQuantity || 0) * Number(headerPlannedQty || 0),
        })),
      }));
    },
  }))
);
