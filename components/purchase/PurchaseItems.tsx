import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { Item } from "@/types/sales/Item.type";
import { getCustomerPrice } from "@/lib/sap/helpers/masterDataHelper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ResizableTable } from "../Custom/ResizableTable";
import { getFieldSettings } from "@/lib/config/Client/clientSettings";
import { isPostedPurchaseDocType } from "@/lib/sap/helpers/postedDocumentHelper";
import { hasInvalidPrice } from "@/lib/sap/helpers/priceValidationHelper";
import { useLineUDFs, lineUdfColumns } from "@/components/shared/LineUDFCells";
import { resolveBranchForWarehouse } from "@/lib/sap/helpers/branchHelper";

export function PurchaseItems() {
  const { watch } = useFormContext();
  const selectedCardCode = watch("CardCode");
  const docStatus = watch("DocStatus");
  const {
    lines,
    addLine,
    requester,
    attachments,
    addAttachment,
    removeAttachment,
    updateAttachment,
  } = usePurchaseDocument();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const config = usePurchaseDocConfig();
  const isTableDisabled = config.isDisabledTable(docStatus);

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

  useEffect(() => {
    loadMasterData("S", "I");
  }, [loadMasterData]);

  const handleOnSelectItems = (items: Item[]) => {
    const isPurchaseRequest = config.type === DocumentType.PurchaseRequests;
    const needsRequiredDate = isPurchaseRequest || config.type === DocumentType.PurchaseQuotation;
    const lineRequiredDate = needsRequiredDate ? new Date().toISOString().split("T")[0] : "";

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
    return getFieldSettings(config.type, "linesFieds", col.key).visible !== false;
  });

  const lineUdfs = useLineUDFs(config.type);
  const columnsWithUdf = [...columns, ...lineUdfColumns(lineUdfs)];

  const isFinancialPurchaseDoc = isPostedPurchaseDocType(config.type);

  const docEntry = watch("DocEntry");
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
                      Add Item
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            <div className="relative border rounded overflow-x-auto">
              <div
                className={`w-full overflow-x-auto pb-2 ${isTableDisabled ? "opacity-80" : ""}`}
              >
                <ResizableTable
                  columns={columnsWithUdf}
                  data={lines}
                  emptyMessage="No items added yet."
                  onRowContextMenu={handleRowContextMenu}
                  renderRow={(line, idx) => (
                    <PurchaseItemRow index={idx} line={line} />
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
                        setSelectedLineForModal(contextMenu.line);
                        if (isBatch) {
                          setBatchModalOpen(true);
                        } else {
                          setSerialModalOpen(true);
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
    </div>
  );
}