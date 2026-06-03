import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { Item } from "@/types/sales/Item.type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ItemSelectorDialog } from "@/modals/ItemSelectorDialog";
import { InvDocumentLineRow } from "./InvDocumentItemRow";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AttachmentsTab } from "@/components/shared/AttachmentsTab";
import { ResizableTable } from "@/components/Custom/ResizableTable";

export function InvDocumentItems() {
  const { watch } = useFormContext();
  const { lines, addLine, warehouses, fromWarehouse, toWarehouse, attachments, addAttachment, removeAttachment, updateAttachment } = useInventoryDocument();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const columns = [
    { key: "actions",      title: "Actions",      width: 80  },
    { key: "ItemCode",     title: "Item",         width: 180 },
    { key: "Dscription",   title: "Description",  width: 300 },
    { key: "FromWhsCode",  title: "From Whs",     width: 180 },
    { key: "WhsCode",      title: "To Whs",       width: 180 },
    { key: "Quantity",     title: "Quantity",     width: 140 },
    { key: "OnHand",       title: "Qty In Whs",   width: 120 },
    { key: "UomCode",      title: "UoM",          width: 140 },
  ];

  const handleOnSelectItems = (items: Item[]) => {
    const firstWhs = warehouses.length > 0 ? warehouses[0].WhsCode : "";

    items.forEach((item: Item) => {
      const price = item.Prices?.[0]?.PriceAmount || 0.0;
      const defaultWhsLine = item.DefaultWhse || firstWhs;
      const quantity = 1;

      // Resolve warehouse-specific OnHand from item's QtyInWhs array
      const qtyInWhs: any[] = item.QtyInWhs || [];
      const fromWhs = fromWarehouse || defaultWhsLine;
      const whRecord = qtyInWhs.find(
        (w: any) => (w.WarehouseCode || w.warehouseCode) === fromWhs
      );
      const initialOnHand = whRecord ? (whRecord.Qty ?? whRecord.qty ?? 0) : 0;

      addLine({
        ItemCode: item.ItemCode,
        Dscription: item.ItemName || item.ItemDescription || "",
        FromWhsCode: fromWhs,
        FromBinLoc: "",
        ToBinLoc: "",
        FisrtBin: "",
        WhsCode: toWarehouse || defaultWhsLine,
        Quantity: quantity,
        OnHand: initialOnHand,
        ItemCost: price,
        LineTotal: quantity * price,
        UomCode: item.UoM || item.UoMCode || item.InventoryUOM || item.SalesUnit || item.PurchaseUnit || "",
        unitMsr: item.UoM || item.UoMCode || item.InventoryUOM || item.SalesUnit || item.PurchaseUnit || "",
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
            </div>
            <div className="relative border rounded overflow-hidden max-w-full min-w-0">
              <div className="overflow-x-auto pb-2 max-w-full min-w-0">
                <ResizableTable
                  columns={columns}
                  data={lines}
                  emptyMessage="No items added yet."
                  renderRow={(line, idx) => (
                    <InvDocumentLineRow index={idx} line={line} />
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
            isTableDisabled={false}
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
