import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { Item } from "@/types/sales/Item.type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemSelectorDialog } from "@/modals/ItemSelectorDialog";
import { InvDocumentLineRow } from "./InvDocumentItemRow";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { Plus, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AttachmentsTab } from "@/components/shared/AttachmentsTab";
import { ResizableTable } from "@/components/Custom/ResizableTable";
import { resolveUoMFromCandidates } from "@/utils/inventoryUom";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { useUoMStore } from "@/stores/useUoMStore";
import { getUoMName } from "@/lib/sap/helpers/uomHelper";
import { useInvDocConfig } from "./InvDocumentLayout";
import { DocumentType } from "@/types/master/DocumentType";
import { SerialNumberSelectionDialog } from "@/modals/SerialNumberSelectionDialog";
import { BatchNumberSelectionDialog } from "@/modals/BatchNumberSelectionDialog";
import { toast } from "sonner";
import { linesNeedBatchAllocation } from "@/lib/sap/helpers/serialBatchHelper";

export function InvDocumentItems() {
  const { watch } = useFormContext();
  const {
    lines, addLine, warehouses, fromWarehouse, toWarehouse, attachments, addAttachment, removeAttachment, updateAttachment,
    serialModalOpen, setSerialModalOpen, batchModalOpen, setBatchModalOpen, selectedLineForModal, setSelectedLineForModal,
  } = useInventoryDocument();
  const config = useInvDocConfig();
  const isGoodIssue = config.type === DocumentType.GoodIssue;
  const uoms = useUoMStore((state) => state.uoms);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    line: any;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleRowContextMenu = (e: React.MouseEvent, line: any) => {
    e.preventDefault();
    const isSerial = String(line.ManSerNum).toLowerCase() === "y" || String(line.ManSerNum).toLowerCase() === "tyes";
    const isBatch = String(line.ManBtchNum).toLowerCase() === "y" || String(line.ManBtchNum).toLowerCase() === "tyes";
    if (!isSerial && !isBatch) return;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      line,
    });
  };

  const docStatus = watch("DocStatus") || "bost_Open";
  const isClosed = docStatus === "bost_Close";
  // Inventory Transfer / Good Issue post real stock movement on Add, so SAP locks line
  // Quantity afterward (see buildInventoryTransferPatchPayload / buildGoodIssuePatchPayload,
  // which omit lines from the patch entirely) — hide the add button once a document is loaded.
  // Inventory Transfer Request is a pre-posting document (never touches stock) and shares
  // this component too, so it must stay fully editable — only lock the two posted types.
  const isLineLockedDocType = config.type === DocumentType.InvTransfer || config.type === DocumentType.GoodIssue;
  const docEntry = watch("DocEntry");
  const isEditMode = isLineLockedDocType && Boolean(docEntry && Number(docEntry) > 0);

  const columns = isGoodIssue
    ? [
        { key: "actions",   title: "Actions",     width: 80  },
        { key: "ItemCode",  title: "Item",        width: 180 },
        { key: "Dscription",title: "Description", width: 300 },
        { key: "WhsCode",   title: "Warehouse",   width: 180 },
        { key: "BPLid",     title: "Branch",      width: 90  },
        { key: "Quantity",  title: "Quantity",    width: 140 },
        { key: "OnHand",    title: "Qty In Whs",  width: 120 },
        { key: "UoMCode",   title: "UoM Code",    width: 140 },
        { key: "UoMName",   title: "UoM Name",    width: 140 },
      ]
    : [
        { key: "actions",   title: "Actions",      width: 80  },
        { key: "ItemCode",  title: "Item",         width: 180 },
        { key: "Dscription",title: "Description",  width: 300 },
        { key: "FromWhsCode",title: "From Whs",     width: 180 },
        { key: "WhsCode",   title: "To Whs",       width: 180 },
        { key: "BPLid",     title: "Branch",       width: 90  },
        { key: "Quantity",  title: "Quantity",     width: 140 },
        { key: "OnHand",    title: "Qty In Whs",   width: 120 },
        { key: "UoMCode",   title: "UoM Code",     width: 140 },
        { key: "UoMName",   title: "UoM Name",     width: 140 },
      ];

  const handleOnSelectItems = (items: Item[]) => {
    const firstWhs = warehouses.length > 0 ? warehouses[0].WhsCode : "";

    items.forEach((item: Item) => {
      const price = item.Prices?.[0]?.PriceAmount || 0.0;
      const defaultWhsLine = item.DefaultWhse || firstWhs;
      const quantity = 1;
      const uomCode = resolveUoMFromCandidates(
        uoms,
        item.UoM,
        item.InventoryUOM,
        item.UoMCode,
        item.UoMGroupEntry,
        item.UnitsOfMeasurment
      );

      // Resolve warehouse-specific OnHand from item's QtyInWhs array
      const qtyInWhs: any[] = item.QtyInWhs || [];
      const fromWhs = fromWarehouse || defaultWhsLine;
      const whsCode = isGoodIssue ? (toWarehouse || defaultWhsLine) : (fromWarehouse || defaultWhsLine);
      const whRecord = qtyInWhs.find(
        (w: any) => (w.WarehouseCode || w.warehouseCode) === whsCode
      );
      const initialOnHand = whRecord ? (whRecord.Qty ?? whRecord.qty ?? 0) : 0;
      const branchId = warehouses.find((w: any) => w.WhsCode === whsCode)?.BPLid;

      addLine({
        ItemCode: item.ItemCode,
        Dscription: item.ItemName || item.ItemDescription || "",
        ...(isGoodIssue ? {} : { FromWhsCode: fromWhs }),
        FromBinLoc: "",
        ToBinLoc: "",
        FisrtBin: "",
        WhsCode: whsCode,
        BPLid: branchId,
        Quantity: quantity,
        OnHand: initialOnHand,
        ItemCost: price,
        LineTotal: quantity * price,
        UoMCode: uomCode,
        unitMsr: uomCode,
        MeasureUnit: item.MeasureUnit || getUoMName(uomCode) || "",
        PlPaWght: 0,
        U_LastPrice: price,
        OcrCode2: "",
        OcrCode3: "",
        OcrCode4: "",
        U_OQCR: "",
        U_OQDC: "",
        U_FBRQty: 0,
        U_SaleType: "Retail",
        U_FurtherTax: 0,
        QtyInWhs: qtyInWhs,
        ManSerNum: item.ManSerNum,
        ManBtchNum: item.ManBtchNum,
      });
    });
  };

  return (
    <div className="grid w-full min-w-0 relative pt-2 overflow-visible">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0 pt-1 overflow-visible">
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
          </TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="min-w-0 overflow-visible mt-0 animate-in fade-in zoom-in-95 duration-500 pt-6">
          <div className="relative min-w-0 overflow-visible">
            <div className="absolute -top-7 left-2 z-50">
              {!isClosed && !isEditMode && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => setDialogOpen(true)}
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
              )}
            </div>
            <div className="relative border rounded overflow-hidden max-w-full min-w-0">
              <div className="overflow-x-auto pb-2 max-w-full min-w-0">
                <ResizableTable
                  columns={columns}
                  data={lines}
                  emptyMessage="No items added yet."
                  onRowContextMenu={handleRowContextMenu}
                  renderRow={(line, idx) => (
                    <InvDocumentLineRow index={idx} line={line} isGoodIssue={isGoodIssue} />
                  )}
                />

                {contextMenu && (
                  <div
                    ref={menuRef}
                    style={{
                      top: contextMenu.y,
                      left: contextMenu.x,
                    }}
                    className="fixed z-50 bg-white border border-neutral-200 rounded shadow-md p-1 min-w-[200px]"
                  >
                    <button
                      type="button"
                      className="cursor-pointer w-full text-left px-3 py-2 hover:bg-neutral-100 rounded text-sm font-semibold flex items-center gap-2 text-neutral-800"
                      onClick={() => {
                        const isBatch = String(contextMenu.line.ManBtchNum).toLowerCase() === "y" || String(contextMenu.line.ManBtchNum).toLowerCase() === "tyes";
                        setSelectedLineForModal(contextMenu.line);
                        if (isBatch) {
                          setBatchModalOpen(true);
                        } else {
                          setSerialModalOpen(true);
                        }
                        setContextMenu(null);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      <span>
                        {String(contextMenu.line.ManBtchNum).toLowerCase() === "y" || String(contextMenu.line.ManBtchNum).toLowerCase() === "tyes"
                          ? "Batch Number Transactions Report"
                          : "Serial Number Transactions Report"}
                      </span>
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
            isTableDisabled={false}
          />
        </TabsContent>
      </Tabs>

      <ItemSelectorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelectItems={handleOnSelectItems}
      />

      <SerialNumberSelectionDialog
        open={serialModalOpen}
        onClose={() => {
          setSerialModalOpen(false);
          setSelectedLineForModal(null);
        }}
        onConfirm={(selections) => {
          const state = useInventoryDocument.getState();
          if (selections.serials) {
            Object.entries(selections.serials).forEach(([itemCode, serials]) => {
              state.setLineSerials(itemCode, serials);
            });
            toast.success("Serial numbers allocated successfully");
          }
          setSerialModalOpen(false);
          // Check if batch is still needed after serials are done
          setTimeout(() => {
            const updatedLines = useInventoryDocument.getState().lines;
            const stillNeedsBatch = linesNeedBatchAllocation(updatedLines);
            if (stillNeedsBatch) {
              setSelectedLineForModal(null);
              setBatchModalOpen(true);
            }
          }, 50);
        }}
        lines={lines as any}
        initialItemCode={selectedLineForModal?.ItemCode}
      />

      <BatchNumberSelectionDialog
        open={batchModalOpen}
        onClose={() => {
          setBatchModalOpen(false);
          setSelectedLineForModal(null);
        }}
        onConfirm={(selections) => {
          const state = useInventoryDocument.getState();
          if (selections.batches) {
            Object.entries(selections.batches).forEach(([itemCode, batches]) => {
              state.setLineBatches(itemCode, batches);
            });
            toast.success("Batch numbers allocated successfully");
          }
          setBatchModalOpen(false);
          setSelectedLineForModal(null);
        }}
        lines={lines as any}
        initialItemCode={selectedLineForModal?.ItemCode}
      />
    </div>
  );
}
