import { useEffect, useState } from "react";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { Button } from "@/components/ui/button";
import { ItemSelectorDialog } from "../../../modals/ItemSelectorDialog";
import { DocumentLineRow } from "./DocumentItemRow";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesDocConfig } from "./SalesDocumentLayout";

import { Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


export function DocumentItems() {
  const { watch, register } = useFormContext();
  const selectedCardCode = watch("CardCode");
  const { lines, addLine, customer, clearLines } = useSalesDocument();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<string>("Select Type");
  const config = useSalesDocConfig();
  const docStatus = watch("DocStatus");
  const isTableDisabled = config.isDisabledTable(customer?.DocumentStatus!);

  const handleOnSelectItems = (items: Item[]) => {
    const listnum = Number(watch("listNum"));

    items.forEach((item) => {
      const priceObj = item.prices?.find(
        (p: any) => p.priceList === listnum
      );

      const price = priceObj?.priceAmount ?? 0.0;
      addLine({
        ItemCode: item.itemCode,
        ItemName: item.itemName,
        Quantity: 1,
        Price: price,
        TaxCode: item.vatGourpSa
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
                disabled={!selectedCardCode || isTableDisabled}
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
        <TabsContent value="content">
          <div className="relative max-w-full border rounded">
            <div className={`min-w-max overflow-x-auto ${isTableDisabled ? "opacity-80 pointer-events-none" : ""}`}>
              <Table className="text-xs w-max">
                <TableHeader className="sticky top-0 bg-neutral-900 z-10">
                  <TableRow className="border-neutral-600">
                    <TableHead className="text-gray-300 px-4 py-2 border-r border-neutral-700 w-[60px] text-center">Actions</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Item Code</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Item Description</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Qty</TableHead>
                    {/* <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Whse</TableHead> */}
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">UoM</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Price</TableHead>
                    {/* <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Discount</TableHead> */}
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Tax Code</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Line Total</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 1</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 1 (LC)</TableHead>
                    {/* <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 1 Tax Group</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 1 Tax %</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 1 Tax (LC)</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 1 Acquis.</TableHead> */}

                    {/* Freight 2 Columns */}
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 2</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 2 (LC)</TableHead>
                    {/* <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 2 Tax Group</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 2 Tax %</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 2 Tax (LC)</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 2 Acquis.</TableHead> */}

                    {/* Freight 3 Columns */}
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 3</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 3 (LC)</TableHead>
                    {/* <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 3 Tax Group</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 3 Tax %</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 3 Tax (LC)</TableHead>
                    <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 3 Acquis.</TableHead> */}
                    {/* <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Tax Amount</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Qty(Inventory UoM)</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">No. of Packages</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Country/Region of Origin</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">COGS Line Of Business</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">COGS Plant</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">COGS Commercial</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Blanket Agreement No</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Allow Procmnt. Doc</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Last Purchase Price</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">QC Required</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Quality Doc Entry</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Extra Tax</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Further Tax</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Fixed Retail Price</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Sale Type</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Sro Schedule No</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Sro Item Serial No</TableHead> */}
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
                        <DocumentLineRow index={idx} line={line} />
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="logistic">
          <div className={`grid grid-cols-2 gap-4 p-5 rounded ${isTableDisabled ? "opacity-80 pointer-events-none" : ""}`}>

            <div className="flex flex-col">
              <Label className="text-xs">Ship To</Label>
              <Select >
                <SelectTrigger className="w-full  mt-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Select Type</SelectLabel>
                    <SelectItem value="shipTo">Ship To</SelectItem>
                    <SelectItem value="billTo">Bill To</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Textarea
                {...register("Address2")}
                className="mt-4"
              />

            </div>

            <div className="flex flex-col">
              <Label className="text-xs">Bill To</Label>
              <Select >
                <SelectTrigger className="w-full  mt-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Select Type</SelectLabel>
                    <SelectItem value="shipTo">Ship To</SelectItem>
                    <SelectItem value="billTo">Bill To</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Textarea
                {...register("Address")}
                className="mt-4"
              />
            </div>

          </div>
        </TabsContent>

      </Tabs>

      {/* <ItemSelectorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelectItems={handleOnSelectItems}
      /> */}

      <ItemSelectorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelectItems={handleOnSelectItems}
      />
    </div>
  );
}
