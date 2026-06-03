import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { Item } from "@/types/sales/Item.type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IFPRDDocumentLineRow } from "./PRDDocumentRow";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { usePRDDocConfig } from "./PRDDocumentLayout";
import { Plus } from "lucide-react";
import { ItemSelectorDialog } from "@/modals/ItemSelectorDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


import { AttachmentsTab } from "@/components/shared/AttachmentsTab";
import { DocumentType } from "@/types/master/DocumentType";
import { ResizableTable } from "@/components/Custom/ResizableTable";


export function PRDDocumentItems() {
  const { watch } = useFormContext();
  const productionOrderType = watch("ProductionOrderType");
  const headerWarehouse = watch("Warehouse");
  const itemNo = watch("ItemNo");
  const { lines, addLine, customer, warehouses, attachments, addAttachment, removeAttachment, updateAttachment, initialStatus } = useIFPRDDocument();
  const config = usePRDDocConfig();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const handleOnSelectItems = (items: Item[]) => {
    items.forEach((item: Item) => {
      const isResource = item.SelectorType === "resource";
      const resourceWarehouses = Array.isArray(item.ResourceWarehouses) ? item.ResourceWarehouses : [];
      const issueType = item.IssueMethod === "rimBackflush" ? "im_Backflush" : "im_Manual";

      addLine({
        ItemNo: item.ItemCode,
        ItemName: item.ItemName || item.ItemDescription || "",
        PlannedQuantity: 1,
        Warehouse: headerWarehouse || resourceWarehouses[0]?.Warehouse || (warehouses.length > 0 ? warehouses[0].WhsCode : ""),
        ItemType: isResource ? "pit_Resource" : "pit_Item",
        BaseQuantity: 1,
        BaseRatio: 0,
        IssuedQuantity: 0,
        UoMCode: isResource ? (item.UnitOfMeasure || "") : (item.UoM || item.InventoryUOM || item.SalesUnit || item.PurchaseUnit || ""),
        ProductionOrderIssueType: isResource ? issueType : "im_Manual"
      });
    });
  };

  const columns = [
    config.itemColumns.actions && {
      key: "actions",
      title: "Actions",
      width: 80,
    },
    config.itemColumns.orderNumber && {
      key: "OrderNumber",
      title: "Order Number",
      width: 140,
    },
    config.itemColumns.type && {
      key: "ItemType",
      title: "Type",
      width: 120,
    },
    config.itemColumns.itemCode && {
      key: "ItemNo",
      title: "Item No",
      width: 180,
    },
    config.itemColumns.itemDescription && {
      key: "ItemName",
      title: "Item Description",
      width: 260,
    },
    config.itemColumns.baseQty && {
      key: "BaseQuantity",
      title: "Base Qty",
      width: 130,
    },
    config.itemColumns.baseRatio && {
      key: "BaseRatio",
      title: "Base Ratio",
      width: 130,
    },
    config.itemColumns.plannedQty && {
      key: "PlannedQuantity",
      title: "Planned Qty",
      width: 140,
    },
    config.itemColumns.issued && {
      key: "IssuedQuantity",
      title: "Issued",
      width: 120,
    },
    config.itemColumns.openQty && {
      key: "OpenQuantity",
      title: "Open Qty",
      width: 120,
    },
    config.itemColumns.available && {
      key: "AvailableQuantity",
      title: "Available",
      width: 120,
    },
    config.itemColumns.uomCode && {
      key: "UoMCode",
      title: "UoM Code",
      width: 130,
    },
    config.itemColumns.warehouse && {
      key: "Warehouse",
      title: "Warehouse",
      width: 180,
    },
    config.itemColumns.issueMethod && {
      key: "ProductionOrderIssueType",
      title: "Issue Method",
      width: 170,
    },
  ].filter(Boolean) as {
    key: string;
    title: string;
    width: number;
  }[];

  return (
    <div className="grid w-full relative pt-2 overflow-visible">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full pt-1 overflow-x-auto">
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

        <TabsContent value="content" className="mt-0 animate-in fade-in zoom-in-95 duration-500 pt-6 overflow-x-auto">
          <div className="relative overflow-visible">
            <div className="absolute -top-6 left-2 z-50">
              {(config.type === DocumentType.ProductionOrder ? initialStatus !== "boposClosed" : ![DocumentType.IssueForProduction, DocumentType.ReceiptFromProduction].includes(config.type)) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => {
                          if (!itemNo) {
                            const field = document.getElementById("item-no-field");
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
              )}
            </div>
            <div className={`relative border rounded ${[DocumentType.IssueForProduction, DocumentType.ReceiptFromProduction].includes(config.type) ? '' : 'overflow-x-auto'}`}>
              <div className={`w-full pb-2 ${[DocumentType.IssueForProduction, DocumentType.ReceiptFromProduction].includes(config.type) ? '' : 'overflow-x-auto'}`}>
                <ResizableTable
                  columns={columns}
                  data={lines}
                  emptyMessage="No items added yet."
                  renderRow={(line, idx) => (
                    <IFPRDDocumentLineRow
                      index={idx}
                      line={line}
                      warehouses={warehouses}
                    />
                  )}
                />
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
            isTableDisabled={initialStatus === "boposClosed"}
          />
        </TabsContent>
      </Tabs>

      <ItemSelectorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelectItems={handleOnSelectItems}
      />
    </div>
  );
}


