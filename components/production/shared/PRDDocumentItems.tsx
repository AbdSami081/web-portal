import { useEffect, useState } from "react";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { Item } from "@/types/sales/Item.type";
import { getCustomerPrice } from "@/lib/sap/helpers/masterDataHelper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IFPRDDocumentLineRow } from "./PRDDocumentRow";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { usePRDDocConfig } from "./PRDDocumentLayout";
import { Plus } from "lucide-react";
import { ItemSelectorDialog } from "@/modals/ItemSelectorDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


import { AttachmentsTab } from "@/components/shared/AttachmentsTab";


export function PRDDocumentItems() {
  const { watch, register } = useFormContext();
  const productionOrderType = watch("ProductionOrderType");
  const headerWarehouse = watch("Warehouse");
  const itemNo = watch("ItemNo");
  const { lines, addLine, customer, warehouses, attachments, addAttachment, removeAttachment, updateAttachment } = useIFPRDDocument();
  const config = usePRDDocConfig();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

  const handleOnSelectItems = (items: any[]) => {
    items.forEach((item: any) => {
      addLine({
        ItemNo: item.itemCode,
        ItemName: item.itemName || item.Dscription || "",
        PlannedQuantity: 1,
        Warehouse: headerWarehouse || (warehouses.length > 0 ? warehouses[0].WhsCode : ""),
        ItemType: "pit_Item",
        BaseQuantity: 1,
        BaseRatio: 0,
        IssuedQuantity: 0,
        AvailableQuantity: 0,
        UoMCode: item.uoM || item.uom || item.UoM || "",
        ProductionOrderIssueType: "im_Manual"
      });
    });
  };

  return (
    <div className="grid w-full relative pt-2 overflow-visible">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full pt-1 overflow-visible">
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

        <TabsContent value="content" className="overflow-visible mt-0 animate-in fade-in zoom-in-95 duration-500 pt-6">
          <div className="relative overflow-visible">
            <div className="absolute -top-7 left-2 z-50">
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
            </div>
            <div className="relative border rounded overflow-hidden">
              <div className="overflow-x-auto pb-2">
                <Table className="text-xs min-w-full">
                  <TableHeader className="sticky top-0 bg-neutral-900 z-10">
                    <TableRow className="border-neutral-600">
                      {config.itemColumns.actions && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[50px]">Actions</TableHead>}
                      {config.itemColumns.type && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">Type</TableHead>}
                      {config.itemColumns.itemCode && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[150px]">Item No</TableHead>}
                      {config.itemColumns.itemDescription && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[300px]">Item Description</TableHead>}
                      {config.itemColumns.baseQty && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">Base Qty</TableHead>}
                      {config.itemColumns.baseRatio && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">Base Ratio</TableHead>}
                      {config.itemColumns.plannedQty && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[120px]">Planned Qty</TableHead>}
                      {config.itemColumns.issued && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">Issued</TableHead>}
                      {config.itemColumns.available && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">Available</TableHead>}
                      {config.itemColumns.uomCode && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">UoM Code</TableHead>}
                      {config.itemColumns.warehouse && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[180px]">Warehouse</TableHead>}
                      {config.itemColumns.issueMethod && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[150px]">Issue Method</TableHead>}
                    </TableRow>
                  </TableHeader>

                  <TableBody className="text-center">
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={32} className="text-left text-gray-500 py-4">
                          No items added yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((line, idx) => (
                        <TableRow key={idx}>
                          <IFPRDDocumentLineRow index={idx} line={line} warehouses={warehouses} />
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
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


