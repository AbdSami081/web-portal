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


export function InvDocumentItems() {
  const { watch, register } = useFormContext();
  const selectedCardCode = watch("CardCode");
  const { lines, addLine, customer, warehouses } = useInventoryDocument();
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
      const warehouseCode = item.defaultWhse || firstWhs;
      const quantity = 1; // Default to 1 instead of 0 if not provided

      addLine({
        ItemCode: item.itemCode,                      // Item Code
        Dscription: item.itemName ?? "",              // Item Description (was item.Dscription)
        FromWhsCode: firstWhs || warehouseCode,       // Default From Whs to first whs as requested
        FromBinLoc: "",                               // From Bin Location
        ToBinLoc: "",                                 // To Bin Location
        FisrtBin: "",                                 // First Bin Location
        WhsCode: firstWhs || warehouseCode,           // Default To Whs to first whs as requested
        Quantity: quantity,                           // Quantity
        ItemCost: price,                              // Item Cost
        UomCode: item.uoM || item.uom || item.UoM || "", // UomCode (handling multiple casing from SQL/API)
        unitMsr: "",                                  // Unit of Measure Name
        PlPaWght: 0,                                  // Placeholder weight
        U_LastPrice: price,                           // Last Purchase Price
        OcrCode2: "",                                 // COGS field 2
        OcrCode3: "",                                 // COGS field 3
        OcrCode4: "",                                 // COGS field 4
        U_OQCR: "",                                   // QC Required field
        U_OQDC: "",                                   // Quality Document Entry
        U_FBRQty: 0,                                  // FBR Quantity
        U_SaleType: "Retail",                         // Sale Type
        U_FurtherTax: 0,                              // Further Tax
      });
    });
  };

  return (
    <div className="grid overflow-x-auto w-full">
      <div className="flex justify-between items-center mb-1">
        <Button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="mt-4 cursor-pointer"
        >
          + Add Item
        </Button>
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
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Item</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Description</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">From Whs</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">To Whs</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Quantity</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Unit Price</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">UoM Code</TableHead>
                    <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Actions</TableHead>
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


