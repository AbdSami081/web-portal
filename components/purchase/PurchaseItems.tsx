import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { Item } from "@/types/sales/Item.type";
import { getCustomerPrice } from "@/lib/sap/helpers/masterDataHelper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLabel } from "@/components/Custom/AppLabel";
import { usePurchaseDocConfig } from "./PurchaseDocumentLayout";
import { Trash2, Plus, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { AttachmentsTab } from "@/components/shared/AttachmentsTab";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { ItemSelectorDialog } from "@/modals/ItemSelectorDialog";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { PurchaseItemRow } from "./PurchaseItemRow";
import { DocumentType } from "@/types/master/DocumentType";
import { BatchNumberSelectionDialog } from "@/modals/BatchNumberSelectionDialog";
import { SerialNumberSelectionDialog } from "@/modals/SerialNumberSelectionDialog";
import { CreateBatchDialog } from "@/modals/CreateBatchDialog";
import { CreateSerialDialog } from "@/modals/CreateSerialDialog";
import { BatchTransactionsReportModal } from "@/modals/BatchTransactionsReportModal";
import { SerialTransactionsReportModal } from "@/modals/SerialTransactionsReportModal";
import { ResizableTable } from "../Custom/ResizableTable";
import { getFieldSettings } from "@/lib/config/Client/clientSettings";
import { isPostedPurchaseDocType } from "@/lib/sap/helpers/postedDocumentHelper";
import { hasInvalidPrice } from "@/lib/sap/helpers/priceValidationHelper";
import { useLineUDFs, lineUdfColumns } from "@/components/shared/LineUDFCells";
import { resolveBranchForWarehouse } from "@/lib/sap/helpers/branchHelper";
import { useApprovalSettings } from "@/hooks/useApprovalSettings";
import { fetchItemsByCodesBulk } from "@/lib/sap/helpers/itemCacheHelper";
import { MAX_EXCEL_PASTE_ROWS } from "@/lib/constants/excelPaste";
import type { FieldCatalogEntry } from "@/types/fieldCatalog.type";

export const PURCHASE_LINE_FIELDS: FieldCatalogEntry[] = [
  { key: "ItemCode", title: "Item Code" },
  { key: "ItemName", title: "Item Description" },
  { key: "FreeText", title: "Free Text" },
  { key: "Project", title: "Project" },
  { key: "Quantity", title: "Qty" },
  { key: "OnHand", title: "Qty In Whs" },
  { key: "Price", title: "Price" },
  { key: "DiscountPercent", title: "Disc %" },
  { key: "TaxCode", title: "Tax Code" },
  { key: "TaxAmount", title: "Tax Amount (LC)" },
  { key: "WarehouseCode", title: "Whs" },
  { key: "BPLid", title: "Branch" },
  { key: "UoMCode", title: "UoM" },
  { key: "LineTotal", title: "Line Total" },
  { key: "Freight1Type", title: "Freight 1 Type" },
  { key: "Freight1LCAmount", title: "Freight 1 (LC)" },
  { key: "Freight2Type", title: "Freight 2 Type" },
  { key: "Freight2LCAmount", title: "Freight 2 (LC)" },
  { key: "Freight3Type", title: "Freight 3 Type" },
  { key: "Freight3LCAmount", title: "Freight 3 (LC)" },
];

export const PURCHASE_SERVICE_LINE_FIELDS: FieldCatalogEntry[] = [
  { key: "AccountCode", title: "G/L Account" },
  { key: "AccountName", title: "G/L Account Name" },
  { key: "Description", title: "Description" },
  { key: "DiscountPercent", title: "Disc %" },
  { key: "TaxCode", title: "Tax Code" },
  { key: "LineTotal", title: "Line Total" },
  { key: "TaxAmount", title: "Tax Amount (LC)" },
  { key: "Freight1Type", title: "Freight 1 Type" },
  { key: "Freight1LCAmount", title: "Freight 1 (LC)" },
  { key: "Freight2Type", title: "Freight 2 Type" },
  { key: "Freight2LCAmount", title: "Freight 2 (LC)" },
  { key: "Freight3Type", title: "Freight 3 Type" },
  { key: "Freight3LCAmount", title: "Freight 3 (LC)" },
];

export function PurchaseItems() {
  const { watch } = useFormContext();
  const selectedCardCode = watch("CardCode");
  const cardName = watch("CardName");
  const docStatus = watch("DocStatus");
  const {
    lines,
    addLine,
    addLines,
    clearLines,
    requester,
    attachments,
    addAttachment,
    removeAttachment,
    updateAttachment,
    fieldAccess,
    documentMode,
    setDocumentMode,
  } = usePurchaseDocument();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const config = usePurchaseDocConfig();
  const isTableDisabled = config.isDisabledTable(docStatus);
  const { multiBranchEnabled } = useApprovalSettings();

  const { freightsWithCharges, warehouses, loadMasterData, loadWarehouses } = useMasterDataStore();
  const firstWhs = warehouses.length > 0 ? warehouses[0].WarehouseCode : "";
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    line?: any;
  } | null>(null);

  const [selectedLineForModal, setSelectedLineForModal] = useState<any | null>(null);
  const [serialModalOpen, setSerialModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [createSerialModalOpen, setCreateSerialModalOpen] = useState(false);
  const [createBatchModalOpen, setCreateBatchModalOpen] = useState(false);
  const [batchReportModalOpen, setBatchReportModalOpen] = useState(false);
  const [serialReportModalOpen, setSerialReportModalOpen] = useState(false);

  useEffect(() => {
    loadMasterData("S", "I");
  }, [loadMasterData]);

  const handleOnSelectItems = (items: Item[]) => {
    const isPurchaseRequest = config.type === DocumentType.PurchaseRequests;
    const needsRequiredDate = isPurchaseRequest || config.type === DocumentType.PurchaseQuotation;
    const lineRequiredDate = needsRequiredDate ? new Date().toISOString().split("T")[0] : "";

    if (documentMode === "service") {
      items.forEach((service: any) => {
        const accountCode = service.Code || service.VisCode || service.AccountCode || service.ItemCode || "";
        const accountName = service.Name || service.AccountName || service.ItemName || "";
        const description = service.Description || service.ItemDescription || service.Name || service.ItemName || "";

        const targetTaxCode = service.VatGroupPu || service.VatGourpPu || service.TaxCode || "";
        const selectedTax = freightsWithCharges.find((t) => t.Code === targetTaxCode);
        const taxRate = Number(service.TaxRate || selectedTax?.Rate || 0);

        addLine({
          ItemCode: accountCode,
          AccountCode: accountCode,
          AccountName: accountName,
          Description: description,

          Quantity: 0,
          OnHand: 0,

          Price: 0,
          DiscountPercent: Number(service.DiscountPercent || service.Discount || 0),

          TaxCode: targetTaxCode,
          TaxRate: taxRate,
          TaxAmount: 0,
          LineTotal: 0,

          Freight1Type: "",
          Freight1LCAmount: 0,
          Freight1TaxGroup: "",

          Freight2Type: "",
          Freight2LCAmount: 0,
          Freight2TaxGroup: "",

          Freight3Type: "",
          Freight3LCAmount: 0,
          Freight3TaxGroup: "",
          ...(needsRequiredDate && { RequiredDate: lineRequiredDate }),
        });
      });

      setDialogOpen(false);
      return;
    }

    items.forEach((item) => {
      const price = getCustomerPrice(item.Prices || []);

      const targetTaxCode = item.VatGroupPu || item.VatGourpPu || "";
      const selectedTax = freightsWithCharges.find(
        (t) => t.Code === targetTaxCode,
      );
      const taxRate = Number(selectedTax?.Rate || 0);
      const defaultWhsLine = item.DefaultWhse || firstWhs;
      const qtyInWhs = item.QtyInWhs || [];

      const whRecord = qtyInWhs.find(
        (w: any) =>
          (w.WarehouseCode || w.warehouseCode) === defaultWhsLine
      );

      const initialOnHand = whRecord
        ? (whRecord.Qty ?? whRecord.qty ?? 0)
        : 0;

      addLine({
        ItemCode: item.ItemCode,
        ItemName: item.ItemName || item.ItemDescription || "",
        Quantity: 1,
        OnHand: initialOnHand,
        Price: price,
        TaxCode: targetTaxCode,
        TaxRate: taxRate,
        WarehouseCode: defaultWhsLine,
        BPLid: resolveBranchForWarehouse(defaultWhsLine, warehouses),
        UoMCode: item.UoM || "",
        ManSerNum: item.ManSerNum,
        ManBtchNum: item.ManBtchNum,
        QtyInWhs: qtyInWhs,
        ...(needsRequiredDate && { RequiredDate: lineRequiredDate }),
      });
    });
  };

  // Paste tab-separated rows copied from Excel straight into the line table:
  // ItemCode <tab> Quantity <tab> Price <tab> DiscountPercent <tab> WarehouseCode.
  // Reuses the same item-line construction as handleOnSelectItems so pasted
  // lines come out identical to manually-added ones (tax, branch, UoM, etc.).
  const handleExcelPaste = async (e: React.ClipboardEvent) => {
    if (documentMode === "service") return;
    if (!requester?.CardCode && config.type !== DocumentType.PurchaseRequests) {
      e.preventDefault();
      toast.error("Please select a Vendor first.");
      return;
    }

    const text = e.clipboardData.getData("text");
    if (!text || (!text.includes("\t") && !text.includes("\n"))) return;

    e.preventDefault();

    const isPurchaseRequest = config.type === DocumentType.PurchaseRequests;
    const needsRequiredDate = isPurchaseRequest || config.type === DocumentType.PurchaseQuotation;
    const lineRequiredDate = needsRequiredDate ? new Date().toISOString().split("T")[0] : "";

    let rawRows = text.trim().split(/\r?\n/).map((row) => row.split("\t"));
    if (rawRows.length > MAX_EXCEL_PASTE_ROWS) {
      toast.error(
        `Pasted ${rawRows.length} rows — only the first ${MAX_EXCEL_PASTE_ROWS} were processed. Paste the rest separately.`
      );
      rawRows = rawRows.slice(0, MAX_EXCEL_PASTE_ROWS);
    }

    const parsedRows = rawRows
      .map((cols) => ({
        itemCode: cols[0]?.trim() || "",
        quantity: Number(cols[1]?.trim()) || 1,
        pastedPrice: Number(cols[2]?.trim()) || 0,
        discountPercent: Number(cols[3]?.trim()) || 0,
        pastedWarehouse: cols[4]?.trim() || "",
      }))
      .filter((r) => r.itemCode);

    if (parsedRows.length === 0) return;

    // Bulk-fetch all item codes in chunked requests (not one request per
    // row), then commit every resulting line in a single store update —
    // keeps this responsive for pastes from a handful of rows up to tens of
    // thousands.
    const toastId = toast.loading(`Looking up ${parsedRows.length} item(s)...`);
    const itemsByCode = await fetchItemsByCodesBulk(
      parsedRows.map((r) => r.itemCode),
      (done, total) => toast.loading(`Looking up items... ${done}/${total}`, { id: toastId })
    );

    const newLines: typeof lines = [];
    const notFoundItems: string[] = [];

    for (const row of parsedRows) {
      const item = itemsByCode.get(row.itemCode);
      if (!item) {
        notFoundItems.push(row.itemCode);
        continue;
      }

      const price = row.pastedPrice || getCustomerPrice(item.Prices || []);
      const targetTaxCode = item.VatGroupPu || item.VatGourpPu || "";
      const selectedTax = freightsWithCharges.find((t) => t.Code === targetTaxCode);
      const taxRate = Number(selectedTax?.Rate || 0);
      const defaultWhsLine = row.pastedWarehouse || item.DefaultWhse || firstWhs;
      const qtyInWhs = item.QtyInWhs || [];
      const whRecord = qtyInWhs.find(
        (w: any) => (w.WarehouseCode || w.warehouseCode) === defaultWhsLine
      );
      const initialOnHand = whRecord ? (whRecord.Qty ?? whRecord.qty ?? 0) : 0;

      newLines.push({
        ItemCode: item.ItemCode,
        ItemName: item.ItemName || item.ItemDescription || "",
        Quantity: row.quantity,
        OnHand: initialOnHand,
        Price: price,
        DiscountPercent: row.discountPercent,
        TaxCode: targetTaxCode,
        TaxRate: taxRate,
        WarehouseCode: defaultWhsLine,
        BPLid: resolveBranchForWarehouse(defaultWhsLine, warehouses),
        UoMCode: item.UoM || "",
        ManSerNum: item.ManSerNum,
        ManBtchNum: item.ManBtchNum,
        QtyInWhs: qtyInWhs,
        ...(needsRequiredDate && { RequiredDate: lineRequiredDate }),
      } as (typeof lines)[number]);
    }

    if (newLines.length > 0) {
      addLines(newLines);
    }

    toast.dismiss(toastId);
    if (newLines.length > 0) {
      toast.success(`${newLines.length} item(s) added successfully.`);
    }
    if (notFoundItems.length > 0) {
      const preview = notFoundItems.slice(0, 20).join(", ");
      toast.error(
        `${notFoundItems.length} item(s) not found: ${preview}${notFoundItems.length > 20 ? "…" : ""}`
      );
    }
  };

  const handleRowContextMenu = (
    e: React.MouseEvent,
    line: any
  ) => {
    e.preventDefault();      

    const isSerialBatchDocument = [
      DocumentType.GoodsReceiptPO,
      DocumentType.APInvoice,
      DocumentType.APCreditMemo,
      DocumentType.GoodsReturn,
      DocumentType.GoodsReturnRequest,
      DocumentType.APReserveInvoice,
    ].includes(config.type);

    if (!isSerialBatchDocument) return;

    const isSerial = String(line.ManSerNum).toLowerCase() === 'y' || String(line.ManSerNum).toLowerCase() === 'tyes';
    const isBatch = String(line.ManBtchNum).toLowerCase() === 'y' || String(line.ManBtchNum).toLowerCase() === 'tyes';
    const isSerialBatchItem = isSerial || isBatch;

    if (!isSerialBatchItem) return;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      line,
    });
  };

  const columns = [
    { key: "actions", title: "Actions", width: 80 },
    { key: "ItemCode", title: "Item Code", width: 180 },
    { key: "ItemName", title: "Item Description", width: 300 },
    { key: "FreeText", title: "Free Text", width: 220 },
    { key: "Project", title: "Project", width: 140 },
    { key: "Quantity", title: "Qty", width: 100 },
    { key: "OnHand", title: "Qty In Whs", width: 100 },
    { key: "Price", title: "Price", width: 120 },
    { key: "DiscountPercent", title: "Disc %", width: 120 },
    { key: "TaxCode", title: "Tax Code", width: 140 },
    { key: "TaxAmount", title: "Tax Amount (LC)", width: 180 },
    { key: "WarehouseCode", title: "Whs", width: 120 },
    { key: "BPLid", title: "Branch", width: 90 },
    { key: "UoMCode", title: "UoM", width: 120 },
    { key: "LineTotal", title: "Line Total", width: 180 },
    { key: "Freight1Type", title: "Freight 1 Type", width: 180 },
    { key: "Freight1LCAmount", title: "Freight 1 (LC)", width: 180 },
    { key: "Freight2Type", title: "Freight 2 Type", width: 180 },
    { key: "Freight2LCAmount", title: "Freight 2 (LC)", width: 180 },
    { key: "Freight3Type", title: "Freight 3 Type", width: 180 },
    { key: "Freight3LCAmount", title: "Freight 3 (LC)", width: 180 },
  ].filter(col => {
    if (col.key === "actions") return true;
    if (col.key === "BPLid" && !multiBranchEnabled) return false;
    return fieldAccess.includes(col.key) && getFieldSettings(config.type, "linesFieds", col.key).visible !== false;
  });

  const serviceColumns = [
    { key: "actions", title: "Actions", width: 80 },
    { key: "AccountCode", title: "G/L Account", width: 200 },
    { key: "AccountName", title: "G/L Account Name", width: 200 },
    { key: "Description", title: "Description", width: 300 },
    { key: "DiscountPercent", title: "Disc %", width: 120 },
    { key: "TaxCode", title: "Tax Code", width: 140 },
    { key: "LineTotal", title: "Line Total", width: 180 },
    { key: "TaxAmount", title: "Tax Amount (LC)", width: 180 },
    { key: "Freight1Type", title: "Freight 1 Type", width: 180 },
    { key: "Freight1LCAmount", title: "Freight 1 (LC)", width: 180 },
    { key: "Freight2Type", title: "Freight 2 Type", width: 180 },
    { key: "Freight2LCAmount", title: "Freight 2 (LC)", width: 180 },
    { key: "Freight3Type", title: "Freight 3 Type", width: 180 },
    { key: "Freight3LCAmount", title: "Freight 3 (LC)", width: 180 },
  ].filter((col) => {
    if (col.key === "actions") return true;
    return fieldAccess.includes(col.key) && getFieldSettings(config.type, "linesFieds", col.key).visible !== false;
  });

  const lineUdfs = useLineUDFs(config.type);
  const columnsWithUdf = [...columns, ...lineUdfColumns(lineUdfs, fieldAccess)];
  const serviceColumnsWithUdf = [...serviceColumns, ...lineUdfColumns(lineUdfs, fieldAccess)];

  const isFinancialPurchaseDoc = isPostedPurchaseDocType(config.type);

  const docEntry = watch("DocEntry");
  const docNum = watch("DocNum");
  const docDate = watch("DocDate");
  const isEditMode = Boolean(docEntry && Number(docEntry) > 0);
  const isLineUpdateBlocked = isFinancialPurchaseDoc && isEditMode;

  return (
    <div className="grid w-full relative pt-2 overflow-visible">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full pt-1 overflow-x-auto"
      >
        <TabsList className="grid w-[240px] grid-cols-2 mb-4 bg-neutral-900 p-1 rounded-lg h-9 border border-neutral-800">
          <TabsTrigger
            value="content"
            className="rounded-md font-bold text-[9px] uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400 data-[state=active]:shadow-sm"
          >
            Content
          </TabsTrigger>
          <TabsTrigger
            value="attachments"
            className="rounded-md font-bold text-[9px] uppercase tracking-wider transition-all duration-300 data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400 data-[state=active]:shadow-sm"
          >
            Attachments
            {attachments.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 text-[10px] bg-blue-500 text-white rounded-full font-bold">
                {attachments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-3 mb-4">
          <AppLabel className="text-sm font-semibold">Type</AppLabel>
          <Select
            value={documentMode || "items"}
            disabled={isEditMode}
            onValueChange={(value) => {
              const nextMode = value as "items" | "service";
              if (nextMode !== documentMode && lines.length > 0) {
                clearLines();
              }
              setDocumentMode(nextMode);
            }}
          >
            <SelectTrigger className="w-48 h-9">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="items">Items</SelectItem>
              <SelectItem value="service">Service</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent
          value="content"
          className="mt-0 animate-in fade-in zoom-in-95 duration-500 pt-6 overflow-x-auto"
        >
          <div className="relative overflow-visible">
            {!isLineUpdateBlocked && !isTableDisabled && (
              <div className="absolute -top-6 left-2 z-50">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => {
                          if (!selectedCardCode && config.type !== DocumentType.PurchaseRequests) {
                            const field =
                              document.getElementById("card-code-field");
                            if (field) {
                              field.classList.add("animate-glow-red-blink");
                              setTimeout(() => {
                                field.classList.remove("animate-glow-red-blink");
                              }, 3000);
                            }
                            return;
                          }

                          if (documentMode === "service") {
                            const needsRequiredDate = config.type === DocumentType.PurchaseRequests || config.type === DocumentType.PurchaseQuotation;
                            addLine({
                              ItemCode: "",
                              AccountCode: "",
                              AccountName: "",
                              ItemName: "",
                              Description: "",
                              OnHand: 0,
                              Quantity: 1,
                              UnitPrice: 0,
                              DiscountPercent: 0,
                              TaxCode: "",
                              TaxRate: 0,
                              TaxTotal: 0,
                              TaxAmount: 0,
                              LineTotal: 0,
                              PriceAfterVAT: 0,
                              GrossTotal: 0,
                              CostingCode: "",
                              CostingCode2: "",
                              CostingCode3: "",
                              CostingCode4: "",
                              CostingCode5: "",
                              ProjectCode: "",
                              TaxOnly: false,
                              Price: 0,
                              ...(needsRequiredDate && { RequiredDate: new Date().toISOString().split("T")[0] }),
                            });
                            return;
                          }

                          setDialogOpen(true);
                        }}
                        className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all hover:scale-110 active:scale-95 flex items-center justify-center border-2 border-white"
                      >
                        <Plus className="h-5 w-5 stroke-[2.5px]" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="bg-emerald-600 text-white border-emerald-500 font-semibold shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-in fade-in-0 zoom-in-95 duration-300"
                    >
                      {documentMode === "service" ? "Add Service" : "Add Item"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            <div className="relative border rounded overflow-x-auto" onPaste={handleExcelPaste}>
              <div
                className={`w-full overflow-x-auto pb-2 ${isTableDisabled ? "opacity-80" : ""}`}
              >
                <ResizableTable
                  columns={documentMode === "service" ? serviceColumnsWithUdf : columnsWithUdf}
                  data={lines}
                  emptyMessage={documentMode === "service" ? "No services added yet." : "No items added yet."}
                  onRowContextMenu={handleRowContextMenu}
                  renderRow={(line, idx) => (
                    <PurchaseItemRow index={idx} line={line} documentMode={documentMode} />
                  )}
                  rowClassName={(line) => hasInvalidPrice(line) ? "bg-blue-50 hover:bg-blue-100" : ""}
                />
                {contextMenu && (
                  <div
                    className="fixed z-50 bg-white border border-neutral-200/80 shadow-lg rounded-lg w-72 p-1 select-none animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-150 ease-out"
                    style={{
                      top: contextMenu.y,
                      left: contextMenu.x,
                    }}
                    onMouseLeave={() => setContextMenu(null)}
                  >
                    <button
                      className="cursor-pointer w-full text-left px-3 py-2 hover:bg-neutral-100 active:bg-neutral-200 rounded text-sm font-semibold flex items-center gap-2 text-neutral-800 transition-colors"
                      onClick={() => {
                        const isBatch = String(contextMenu.line.ManBtchNum).toLowerCase() === 'y' || String(contextMenu.line.ManBtchNum).toLowerCase() === 'tyes';
                        const isGrpo = config.type === DocumentType.GoodsReceiptPO;
                        setSelectedLineForModal(contextMenu.line);
                        if (isGrpo) {
                          if (isEditMode) {
                            if (isBatch) {
                              setBatchReportModalOpen(true);
                            } else {
                              setSerialReportModalOpen(true);
                            }
                          } else {
                            if (isBatch) {
                              setCreateBatchModalOpen(true);
                            } else {
                              setCreateSerialModalOpen(true);
                            }
                          }
                        } else {
                          if (isBatch) {
                            setBatchModalOpen(true);
                          } else {
                            setSerialModalOpen(true);
                          }
                        }
                        setContextMenu(null);
                      }}
                    >
                      {(() => {
                        const isBatch = String(contextMenu.line.ManBtchNum).toLowerCase() === 'y' || String(contextMenu.line.ManBtchNum).toLowerCase() === 'tyes';
                        return isBatch ? (
                          <>
                            <FileText className="h-4 w-4 text-blue-500 stroke-[2]" />
                            <span>Batch Number Transactions Report</span>
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 text-emerald-500 stroke-[2]" />
                            <span>Serial Number Transactions Report</span>
                          </>
                        );
                      })()}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attachments" className="overflow-hidden mt-0">
          <AttachmentsTab
            attachments={attachments}
            addAttachment={addAttachment}
            removeAttachment={removeAttachment}
            updateAttachment={updateAttachment}
            isTableDisabled={isTableDisabled}
          />
        </TabsContent>
      </Tabs>
      <ItemSelectorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelectItems={handleOnSelectItems}
        type={documentMode === "service" ? "service" : "item"}
      />
      {selectedLineForModal && (
        <SerialNumberSelectionDialog
          open={serialModalOpen}
          onClose={() => {
            setSerialModalOpen(false);
            setSelectedLineForModal(null);
          }}
          onConfirm={(selections) => {
            const state = usePurchaseDocument.getState();
            if (selections.serials) {
              Object.entries(selections.serials).forEach(([itemCode, serials]) => {
                state.setLineSerials(itemCode, serials);
              });
              toast.success("Serial numbers allocated successfully");
            }
          }}
          lines={lines}
          initialItemCode={selectedLineForModal.ItemCode}
        />
      )}

      {selectedLineForModal && (
        <BatchNumberSelectionDialog
          open={batchModalOpen}
          onClose={() => {
            setBatchModalOpen(false);
            setSelectedLineForModal(null);
          }}
          onConfirm={(selections) => {
            const state = usePurchaseDocument.getState();
            if (selections.batches) {
              Object.entries(selections.batches).forEach(([itemCode, batches]) => {
                state.setLineBatches(itemCode, batches);
              });
              toast.success("Batch numbers allocated successfully");
            }
          }}
          lines={lines}
          initialItemCode={selectedLineForModal.ItemCode}
        />
      )}

      {selectedLineForModal && (
        <CreateSerialDialog
          open={createSerialModalOpen}
          onClose={() => {
            setCreateSerialModalOpen(false);
            setSelectedLineForModal(null);
          }}
          onConfirm={(selections) => {
            const state = usePurchaseDocument.getState();
            Object.entries(selections.serials).forEach(([itemCode, serials]) => {
              state.setLineSerials(itemCode, serials);
            });
            toast.success("Serial numbers created successfully");
          }}
          lines={lines}
          initialItemCode={selectedLineForModal.ItemCode}
        />
      )}

      {selectedLineForModal && (
        <CreateBatchDialog
          open={createBatchModalOpen}
          onClose={() => {
            setCreateBatchModalOpen(false);
            setSelectedLineForModal(null);
          }}
          onConfirm={(selections) => {
            const state = usePurchaseDocument.getState();
            Object.entries(selections.batches).forEach(([itemCode, batches]) => {
              state.setLineBatches(itemCode, batches);
            });
            toast.success("Batch numbers created successfully");
          }}
          lines={lines}
          initialItemCode={selectedLineForModal.ItemCode}
        />
      )}

      <BatchTransactionsReportModal
        open={batchReportModalOpen}
        onClose={() => {
          setBatchReportModalOpen(false);
          setSelectedLineForModal(null);
        }}
        line={selectedLineForModal}
        docNum={docNum}
        docDate={docDate}
        cardName={cardName}
        direction="In"
      />

      <SerialTransactionsReportModal
        open={serialReportModalOpen}
        onClose={() => {
          setSerialReportModalOpen(false);
          setSelectedLineForModal(null);
        }}
        line={selectedLineForModal}
        docNum={docNum}
        docDate={docDate}
        cardName={cardName}
        direction="In"
      />
    </div>
  );
}