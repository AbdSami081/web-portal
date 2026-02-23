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


export function PRDDocumentItems() {
  const { watch, register } = useFormContext();
  const productionOrderType = watch("ProductionOrderType");
  const headerWarehouse = watch("Warehouse");
  const itemNo = watch("ItemNo");
  const { lines, addLine, customer, warehouses } = useIFPRDDocument();
  const config = usePRDDocConfig();
  const [dialogOpen, setDialogOpen] = useState(false);

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
    <div className="flex flex-col w-full px-1 relative">
      <div className="absolute left-2 -top-2 z-20">
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
                className="h-9 w-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center border-2 border-white dark:border-neutral-900"
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

      <div className="relative max-w-full border rounded mt-4">
        <div className="overflow-x-auto">
          <Table className="text-xs w-full">
            <TableHeader className="sticky top-0 bg-neutral-900 z-10">
              <TableRow className="border-neutral-600">
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
                {config.itemColumns.actions && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[80px]">Actions</TableHead>}
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

      <ItemSelectorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelectItems={handleOnSelectItems}
      />
    </div>
  );
}


