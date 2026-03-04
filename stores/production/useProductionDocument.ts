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
  selectedBOM: any | null;
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
  updateAttachment: (lineNum: number, updated: Partial<IFPRDDocumentStore["attachments"][0]>) => void;

  setWarehouses: (warehouses: any[]) => void;

  setCustomer: (customer: BusinessPartner) => void;
  setDocType: (docType: DocumentType) => void;
  addLine: (line: PRDDocumentLine) => void;
  removeLine: (index: number) => void;
  loadFromDocument: (doc: any, type?: number, isCopy?: boolean) => void;
  updateLine: (index: number, updated: Partial<PRDDocumentLine>) => void;
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
    selectedBOM: null,
    attachments: [],

    setWarehouses: (warehouses) => set({ warehouses }),
    setCustomer: (customer) => set({ customer }),

    setDocType: (docType) => set({ docType }),

    addLine: (line) => {
      set((s) => ({ lines: [...s.lines, line] }), false, "addLine");
    },

    removeLine: (index) => {
      set((state) => ({
        lines: state.lines.filter((_, idx) => idx !== index),
      }));
    },
    updateLine: (index, updated) => {
      set((state) => ({
        lines: state.lines.map((line, idx) =>
          idx === index ? { ...line, ...updated } : line
        ),
      }));
    },

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
      const attachments = doc.Attachments_Lines?.Attachments2_Lines?.map((att: any) => ({
        LineNum: att.LineNum,
        SourcePath: att.SourcePath || att.TargetPath || "",
        FileName: att.FileExtension ? `${att.FileName}.${att.FileExtension}` : att.FileName,
        AttachmentDate: att.AttachmentDate ? att.AttachmentDate.split("T")[0] : new Date().toISOString().split("T")[0],
        FreeText: att.FreeText || "",
        CopyToTarget: att.CopyToTarget === "tYES" || att.CopyToTargetDoc === "tYES",
      })) || [];

      set({
        lines: mappedLines,
        docType: type || DocumentType.IssueForProduction,
        attachments: isCopy ? [] : attachments,
      });
    },
    loadFromBOM: (bom: any, plannedQty: number = 0) => {
      set({ selectedBOM: bom }); // Store the BOM for later re-loading
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
        docType: DocumentType.IssueForProduction,
        attachments: [],
      }),
    recalculateFromHeader: (headerPlannedQty: number) => {
      set((state) => ({
        lines: state.lines.map((line) => ({
          ...line,
          PlannedQuantity: Number(line.BaseRatio || 0) * Number(headerPlannedQty || 0),
        })),
      }));
    },
  }))
);
