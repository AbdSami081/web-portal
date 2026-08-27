import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { InventoryDocumentLine } from "@/types/inventory/inventory.type";
import { normalizeInventoryUom, resolveUoMFromCandidates } from "@/utils/inventoryUom";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { resolveSerialBatchFlags } from "@/lib/sap/helpers/serialBatchHelper";

interface IOPRDDocumentStore {
  customer: BusinessPartner | null;
  lines: InventoryDocumentLine[];
  warehouses: any[];
  DocEntry: number;
  DocNum: number;
  lastLoadedDocType: number | null;
  fromWarehouse: string;
  toWarehouse: string;
  priceList: string;
  series: string;
  postingDate: string;
  comments: string;
  journalMemo: string;
  docDate: string;
  docStatus: string;
  isCopyingTo: boolean;
  udfs: Record<string, any>;
  loadedDraftData: any | null;
  serialModalOpen: boolean;
  batchModalOpen: boolean;
  selectedLineForModal: any | null;

  setLoadedDraftData: (data: any) => void;
  setSerialModalOpen: (open: boolean) => void;
  setBatchModalOpen: (open: boolean) => void;
  setSelectedLineForModal: (line: any | null) => void;
  setCustomer: (customer: BusinessPartner | null) => void;
  setWarehouses: (warehouses: any[]) => void;
  setDocEntry: (DocEntry: number) => void;
  setFromWarehouse: (whs: string) => void;
  setToWarehouse: (whs: string) => void;
  setComments: (v: string) => void;
  setJournalMemo: (v: string) => void;
  setDocDate: (v: string) => void;
  setIsCopyingTo: (v: boolean) => void;
  setPriceList: (priceList: string) => void;
  setSeries: (series: string) => void;
  setPostingDate: (postingDate: string) => void;
  addLine: (line: InventoryDocumentLine) => void;
  removeLine: (index: number) => void;
  updateLine: (itemCode: string, updated: Partial<InventoryDocumentLine>) => void;
  setLineSerials: (itemCode: string, serials: any[]) => void;
  setLineBatches: (itemCode: string, batches: any[]) => void;
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

function toNumberOrUndefined(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

export const useInventoryDocument = create<IOPRDDocumentStore>()(
  devtools((set, get) => ({
    customer: null,
    lines: [],
    warehouses: [],
    DocEntry: 0,
    DocNum: 0,
    lastLoadedDocType: null,

    // Header defaults
    fromWarehouse: "",
    toWarehouse: "",
    comments: "",
    journalMemo: "",
    docDate: today(),
    priceList: "",
    series: "",
    postingDate: today(),
    docStatus: "",
    isCopyingTo: false,
    attachments: [],
    udfs: {},
    loadedDraftData: null,
    serialModalOpen: false,
    batchModalOpen: false,
    selectedLineForModal: null,

    setLoadedDraftData: (data) => set({ loadedDraftData: data }),
    setSerialModalOpen: (open) => set({ serialModalOpen: open }),
    setBatchModalOpen: (open) => set({ batchModalOpen: open }),
    setSelectedLineForModal: (line) => set({ selectedLineForModal: line }),
    setCustomer: (customer) => set({ customer }),
    setWarehouses: (warehouses) => set({ warehouses }),
    setDocEntry: (DocEntry) => set({ DocEntry }),
    setFromWarehouse: (fromWarehouse) => set({ fromWarehouse }),
    setToWarehouse: (toWarehouse) => set({ toWarehouse }),
    setComments: (comments) => set({ comments }),
    setJournalMemo: (journalMemo) => set({ journalMemo }),
    setDocDate: (docDate) => set({ docDate }),
    setIsCopyingTo: (isCopyingTo) => set({ isCopyingTo }),
    setPriceList: (priceList: string) => set({ priceList }),
    setSeries: (series: string) => set({ series }),
    setPostingDate: (postingDate: string) => set({ postingDate }),

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

    setLineSerials: (itemCode, serials) =>
      set((s) => ({
        lines: s.lines.map((l) => (l.ItemCode === itemCode ? { ...l, SerialNumbers: serials } : l)),
      })),

    setLineBatches: (itemCode, batches) =>
      set((s) => ({
        lines: s.lines.map((l) => (l.ItemCode === itemCode ? { ...l, BatchNumbers: batches } : l)),
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

      const uoms = useMasterDataStore.getState().uoms || [];

      const lines: InventoryDocumentLine[] = rawLines.map((line: any, idx: number) => {
        const uomCode = resolveUoMFromCandidates(
          uoms,
          line.UoMCode,
          line.UoMGroupEntry,
          line.UnitsOfMeasurment
        );

        const unitMsr = resolveUoMFromCandidates(
          uoms,
          line.UnitsOfMeasurment,
          uomCode
        ) || uomCode;

        return {
          ItemCode: line.ItemCode,
          Dscription: line.ItemDescription || line.Dscription || line.ItemName || "",
          FromWhsCode: line.FromWarehouseCode || line.FromWhsCode || doc.FromWarehouse || "",
          WhsCode: line.WarehouseCode || line.WhsCode || doc.ToWarehouse || "",
          Quantity: Number(line.Quantity) || 0,
          ItemCost: Number(line.UnitPrice || line.ItemCost || 0),
          UoMCode: uomCode,
          unitMsr,
          ManSerNum: line.ManSerNum || (line.SerialNumbers?.length ? "Y" : ""),
          ManBtchNum: line.ManBtchNum || (line.BatchNumbers?.length ? "Y" : ""),
          SerialNumbers: line.SerialNumbers || [],
          BatchNumbers: line.BatchNumbers || [],
          LineNum: line.LineNum ?? idx,
          LineStatus: line.LineStatus,
          IsClosed: line.IsClosed || (line.LineStatus === "bost_Close" ? "tYES" : "tNO"),
          RemainingOpenQuantity: line.RemainingOpenQuantity,
          BaseType: toNumberOrUndefined(line.BaseType) ?? (isCopy ? type : undefined),
          BaseEntry: toNumberOrUndefined(line.BaseEntry) ?? (isCopy ? doc.DocEntry : undefined),
          BaseLine: toNumberOrUndefined(line.BaseLine) ?? (isCopy ? (line.LineNum ?? idx) : undefined),
        };
      });

      const attachments = doc.Attachments_Lines?.Attachments2_Lines?.map((att: any) => ({
        LineNum: att.LineNum,
        SourcePath: att.SourcePath || att.TargetPath || "",
        FileName: att.FileExtension ? `${att.FileName}.${att.FileExtension}` : att.FileName,
        AttachmentDate: att.AttachmentDate ? att.AttachmentDate.split("T")[0] : today(),
        FreeText: att.FreeText || "",
        CopyToTarget: att.CopyToTarget === "tYES" || att.CopyToTargetDoc === "tYES",
      })) || [];

      const udfValues: Record<string, any> = {};
      Object.keys(doc).forEach(key => {
        if (key.startsWith("U_")) {
          udfValues[key] = doc[key];
        }
      });

      set({
        lines,
        DocEntry: isCopy ? 0 : (doc.DocEntry || 0),
        DocNum: isCopy ? 0 : (doc.DocNum || 0),
        lastLoadedDocType: type ?? null,
        priceList: doc.PriceList ? String(doc.PriceList) : "",
        series: doc.Series ? String(doc.Series) : "",
        postingDate: isCopy
          ? today()
          : (doc.PostingDate
              ? doc.PostingDate.split("T")[0]
              : (doc.TaxDate ? doc.TaxDate.split("T")[0] : today())),
        fromWarehouse: doc.FromWarehouse || "",
        toWarehouse: doc.ToWarehouse || "",
        comments: isCopy ? "" : (doc.Comments || ""),
        journalMemo: isCopy ? "" : (doc.JournalMemo || doc.JrnlMemo || ""),
        docDate: isCopy ? today() : (doc.TaxDate ? doc.TaxDate.split("T")[0] : today()),
        docStatus: isCopy ? "" : (doc.DocumentStatus || ""),
        attachments: isCopy ? [] : attachments,
        udfs: udfValues,
        customer: doc.CardCode
          ? { CardCode: doc.CardCode, CardName: doc.CardName || "", CardType: "cCustomer", Balance: 0, Phone1: "", Email: "" }
          : null,
      });

      resolveSerialBatchFlags(lines, (patch) => {
        set((state) => ({
          lines: state.lines.map((line) =>
            patch.has(line.ItemCode) ? { ...line, ...patch.get(line.ItemCode) } : line
          ),
        }));
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
        DocNum: 0,
        lastLoadedDocType: null,
        fromWarehouse: "",
        toWarehouse: "",
        priceList: "",
        series: "",
        postingDate: today(),
        comments: "",
        journalMemo: "",
        docDate: today(),
        docStatus: "",
        isCopyingTo: false,
        attachments: [],
        udfs: {},
        loadedDraftData: null,
        serialModalOpen: false,
        batchModalOpen: false,
        selectedLineForModal: null,
      });
    },
  }))
);
