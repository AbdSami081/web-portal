import { useEffect, useState } from "react";
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
import { ItemSelectorDialog } from "@/modals/ItemSelectorDialog";
import { InvDocumentLineRow } from "./InvDocumentItemRow";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { InventoryDocumentLine } from "@/types/inventory/inventory.type";


import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


import { AttachmentsTab } from "@/components/shared/AttachmentsTab";

export function InvDocumentItems() {
  const { watch, register } = useFormContext();
  const selectedCardCode = watch("CardCode");
  const { lines, addLine, customer, warehouses, fromWarehouse, toWarehouse, attachments, addAttachment, removeAttachment, updateAttachment } = useInventoryDocument();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<string>("Select Type");
  const [activeTab, setActiveTab] = useState("content");

  const ITEM_SELECTOR_COLUMNS = [
    { key: "ItemCode", header: "Item Code" },
    { key: "Dscription", header: "Description" },
  ];

  const ITEM_SELECTOR_SEARCH_KEYS = ["ItemCode", "Dscription"];

  const handleSelect = (value: string) => {
    setSelected(value);
    console.log("Selected:", value);
  }

  const handleOnSelectItems = (items: any[]) => {
    const firstWhs = warehouses.length > 0 ? warehouses[0].WhsCode : "";

    items.map((item: any) => {
      const price = item.price || 0.0;
      const defaultWhsLine = item.defaultWhse || firstWhs;
      const quantity = 1;

      addLine({
        ItemCode: item.itemCode,
        Dscription: item.itemName ?? "",
        FromWhsCode: fromWarehouse || defaultWhsLine,
        FromBinLoc: "",
        ToBinLoc: "",
        FisrtBin: "",
        WhsCode: toWarehouse || defaultWhsLine,
        Quantity: quantity,
        ItemCost: price,
        UomCode: item.uoM || item.uom || item.UoM || "",
        unitMsr: "",
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
            <div className="relative border rounded overflow-hidden">
              <div className="overflow-x-auto pb-2">
                <Table className="text-xs min-w-full">
                  <TableHeader className="sticky top-0 bg-neutral-900 z-10">
                    <TableRow className="border-neutral-600">
                      <TableHead className="text-gray-300 px-4 py-2 border-r border-neutral-700 w-[60px] text-center">Actions</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Item</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Description</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">From Whs</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">To Whs</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Quantity</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">UoM Code</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="text-center">
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-left text-gray-500 py-4">
                          No items added yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((line, idx) => (
                        <TableRow key={idx}>
                          <InvDocumentLineRow index={idx} line={line} />
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


