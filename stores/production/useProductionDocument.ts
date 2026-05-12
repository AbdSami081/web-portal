import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { BaseProductionDocument, PRDDocumentLine } from "@/types/production/PRDDoc.type";
import { DocumentType } from "@/types/master/DocumentType";

interface IFPRDDocumentStore {
  docType: DocumentType;
  customer: BusinessPartner | null;
  lines: PRDDocumentLine[];
  warehouses: any[];
  selectedBOM: any | null;
  DocNum: number;
  ProductionOrderStatus: string;
  initialStatus: string;
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
    DocNum: 0,
    ProductionOrderStatus: "boposPlanned",
    initialStatus: "boposPlanned",
    attachments: [],
    udfs: {},

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
      const currentDocType = type || get().docType;
      
      let mappedLines = [];
      const isSourceProductionOrder = !!(doc.ProductionOrderLines || doc.AbsoluteEntry);

      if (currentDocType === DocumentType.ReceiptFromProduction && isSourceProductionOrder && !doc.DocumentLines) {
        mappedLines = [{
          ItemNo: doc.ItemNo || doc.ItemCode || "",
          ItemName: doc.ProductDescription || doc.ItemName || "",
          PlannedQuantity: (doc.PlannedQuantity || 0) - (doc.CompletedQuantity || 0),
          Warehouse: doc.Warehouse || doc.WarehouseCode || "",
          ItemType: "pit_Item",
          BaseQuantity: 1,
          BOMHeaderQty: 1,
          BaseRatio: 1,
          IssuedQuantity: 0,
          AvailableQuantity: 0,
          UoMCode: doc.UoMCode || "",
          ProductionOrderIssueType: "im_Manual",
          OrderNumber: doc.AbsoluteEntry || doc.DocEntry,
          LineNumber: -1, // Header reference
        }];
      } else {
        const linesData = doc.ProductionOrderLines || doc.DocumentLines || [];
        mappedLines = linesData.map((line: any) => {
          return {
            ItemNo: line.ItemNo || line.ItemCode,
            ItemName: line.ItemName || line.ItemDescription,
            PlannedQuantity: line.PlannedQuantity || line.Quantity,
            Warehouse: line.Warehouse || line.WarehouseCode,
            ItemType: line.ItemType,
            BaseQuantity: line.BaseQuantity,
            BOMHeaderQty: doc.PlannedQuantity || 1,
            BaseRatio: line.BaseRatio !== undefined
              ? line.BaseRatio
              : (doc.PlannedQuantity
                ? ((line.BaseQuantity ?? line.PlannedQuantity) / doc.PlannedQuantity)
                : 0),
            IssuedQuantity: line.IssuedQuantity,
            AvailableQuantity: line.AvailableQuantity,
            UoMCode: line.UoMCode,
            ProductionOrderIssueType: line.ProductionOrderIssueType,
            OrderNumber: line.BaseEntry || (isSourceProductionOrder ? (doc.AbsoluteEntry || doc.DocEntry) : undefined),
            LineNumber: (currentDocType === type && !isCopy) ? line.LineNum : (line.BaseLine ?? line.LineNum),
          };
        });
      }

      // Dynamic Attachment Discovery: Scans for any key containing "attachment" that is an array
      let rawAttachments: any[] = [];
      
      // 1. Check known high-priority paths
      if (doc.Attachments_Lines && Array.isArray(doc.Attachments_Lines.Attachments2_Lines)) {
        rawAttachments = doc.Attachments_Lines.Attachments2_Lines;
      } else if (Array.isArray(doc.Attachments2_Lines)) {
        rawAttachments = doc.Attachments2_Lines;
      } else if (Array.isArray(doc.Attachments_Lines)) {
        rawAttachments = doc.Attachments_Lines;
      } else if (doc.Attachments && Array.isArray(doc.Attachments.Attachments2_Lines)) {
        rawAttachments = doc.Attachments.Attachments2_Lines;
      } else {
        // 2. Scan all keys for anything related to "attachment"
        for (const key in doc) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes("attachment") && Array.isArray(doc[key])) {
            rawAttachments = doc[key];
            break;
          } else if (lowerKey.includes("attachment") && typeof doc[key] === 'object' && doc[key] !== null) {
            // Handle nested objects like doc.Attachments.Attachments2_Lines
            for (const subKey in doc[key]) {
              if (subKey.toLowerCase().includes("line") && Array.isArray(doc[key][subKey])) {
                rawAttachments = doc[key][subKey];
                break;
              }
            }
            if (rawAttachments.length > 0) break;
          }
        }
      }

      const attachments = rawAttachments.map((att: any, idx: number) => {
        const fileName = att.FileName || "";
        const fileExt = att.FileExtension || "";
        let finalName = fileName;
        // Only append extension if it's not already at the end of the filename
        if (fileExt && !fileName.toLowerCase().endsWith(`.${fileExt.toLowerCase()}`)) {
          finalName = `${fileName}.${fileExt}`;
        }

        return {
          LineNum: att.LineNum !== undefined ? att.LineNum : (idx + 1),
          SourcePath: att.SourcePath || att.TargetPath || "",
          FileName: finalName || "Unknown File",
          AttachmentDate: att.AttachmentDate ? att.AttachmentDate.split("T")[0] : new Date().toISOString().split("T")[0],
          FreeText: att.FreeText || "",
          CopyToTarget: att.CopyToTarget === "tYES" || att.CopyToTargetDoc === "tYES",
        };
      });

      const udfValues: Record<string, any> = {};
      Object.keys(doc).forEach(key => {
        if (key.startsWith("U_")) {
          udfValues[key] = doc[key];
        }
      });

      set({
        lines: mappedLines,
        docType: currentDocType,
        attachments: isCopy ? [] : attachments,
        DocNum: isCopy ? 0 : (doc.DocNum || doc.DocumentNumber || doc.DocNumber || 0),
        ProductionOrderStatus: doc.ProductionOrderStatus || "boposPlanned",
        initialStatus: doc.ProductionOrderStatus || "boposPlanned",
        udfs: udfValues,
      });
    },
    loadFromBOM: (bom: any, plannedQty: number = 0) => {
      set({ selectedBOM: bom }); 
      const parentQty = Number(bom.Quantity || 1); 
      const mappedLines = bom.ProductTreeLines?.map((line: any) => {
        const lineQty = Number(line.Quantity || 0);
        const baseRatio = lineQty / parentQty;

        return {
          ItemNo: line.ComponentCode || line.ItemCode,
          ItemName: line.ComponentName || line.ItemName || "",
          BaseQuantity: lineQty, // Store original line quantity here
          BaseRatio: baseRatio,
          BOMHeaderQty: parentQty, 
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
        DocNum: 0,
        ProductionOrderStatus: "boposPlanned",
        initialStatus: "boposPlanned",
        attachments: [],
        udfs: {},
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
