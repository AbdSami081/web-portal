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


export function InvDocumentItems() {
  const { watch, register } = useFormContext();
  const selectedCardCode = watch("CardCode");
  const { lines, addLine, customer, warehouses, fromWarehouse, toWarehouse } = useInventoryDocument();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<string>("Select Type");

  const ITEM_SELECTOR_COLUMNS = [
    { key: "ItemCode", header: "Item Code" },
    { key: "Dscription", header: "Description" },
  ];

  const ITEM_SELECTOR_SEARCH_KEYS = ["ItemCode", "Dscription"];

  const handleSelect = (value: string) => {
    setSelected(value);
    console.log("Selected:", value);
  }

  // useEffect(() => {
  //   console.log("document items", lines);
  // }, [lines]);

  const handleOnSelectItems = (items: any[]) => {
    const firstWhs = warehouses.length > 0 ? warehouses[0].WhsCode : "";

    items.map((item: any) => {
      const price = item.price || 0.0;
      const defaultWhsLine = item.defaultWhse || firstWhs;
      const quantity = 1;

      addLine({
        ItemCode: item.itemCode,
        Dscription: item.itemName ?? "",
        FromWhsCode: fromWarehouse || defaultWhsLine, // Use header whs as default
        FromBinLoc: "",
        ToBinLoc: "",
        FisrtBin: "",
        WhsCode: toWarehouse || defaultWhsLine,     // Use header whs as default
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
    <div className="grid w-full relative pt-3">
      <div className="absolute left-1 top-0 z-20">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                disabled={!fromWarehouse}
                onClick={() => setDialogOpen(true)}
                className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-500 disabled:cursor-not-allowed text-white shadow-xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center border-2 border-white dark:border-neutral-900"
              >
                <Plus className="h-5 w-5 stroke-[3px]" />
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

      <Tabs defaultValue="content" className="w-full pt-4">
        {/* <TabsList className="mb-4">
          <TabsTrigger value="content" className="data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent">Content</TabsTrigger>
          <TabsTrigger value="logistic" className="data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent">Logistic</TabsTrigger>
        </TabsList> */}

        <TabsContent value="content">
          <div className="relative w-full border rounded overflow-hidden">
            <div className="w-full overflow-x-auto">
              <Table className="text-xs w-full">
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
                      <TableCell colSpan={32} className="text-left text-gray-500 py-4">
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
        </TabsContent>

        <TabsContent value="attachments">
          <div className={`grid grid-cols-2 gap-4 p-5 rounded `}>

          </div>
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


