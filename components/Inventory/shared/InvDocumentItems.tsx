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
  const { lines, addLine, customer } = useInventoryDocument();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<string>("Select Type");

  const dummyitem: InventoryDocumentLine[] = [
  {
      ItemCode: "ITEM001",
      Dscription: "Blue Plastic Pallet",
      FromWhsCode: "WH1",
      FromBinLoc: "BIN-A1",
      WhsCode: "WH2",
      ToBinLoc: "BIN-B1",
      FisrtBin: "BIN-A1",
      Quantity: 10,
      ItemCost: 45.5,
      UomCode: "EA",
      unitMsr: "Each",
      OcrCode2: "OC2-01",
      OcrCode3: "OC3-01",
      OcrCode4: "OC4-01",
      PlPaWght: 12.5,
      U_LastPrice: 40,
      PPTaxExRe: "testing 213" ,
      U_OQCR: "QCR1",
      U_OQDC: "QDC1",
      U_LPP2: 100,
      U_FBRQty: 30,
      U_SaleType: "Retail",
      U_FurtherTax: 0
    },
    {
      ItemCode: "ITEM002",
      Dscription: "Large Wooden Box",
      FromWhsCode: "WH1",
      FromBinLoc: "BIN-A3",
      WhsCode: "WH3",
      ToBinLoc: "BIN-C2",
      FisrtBin: "BIN-A3",
      Quantity: 5,
      ItemCost: 120.0,
      UomCode: "EA",
      unitMsr: "Each",
      OcrCode2: "OC2-02",
      OcrCode3: "OC3-02",
      OcrCode4: "OC4-02",
      PlPaWght: 50,
      U_LastPrice: 115,
      PPTaxExRe: "testing",
      U_OQCR: "QCR2",
      U_OQDC: "QDC2",
      U_LPP2: 200,
      U_FBRQty: 10,
      U_SaleType: "Wholesale",
      U_FurtherTax: 0
    }
  ];

  const ITEM_SELECTOR_COLUMNS = [
      { key: "ItemCode", header: "Item Code" },
      { key: "Dscription", header: "Description" },
  ];

  const ITEM_SELECTOR_SEARCH_KEYS = ["ItemCode",  "Dscription"];

  const handleSelect = (value: string) => {
    setSelected(value);
    console.log("Selected:", value); 
  }

  // useEffect(() => {
  //   console.log("document items", lines);
  // }, [lines]);

   const handleOnSelectItems = (items: any[]) => {
      items.map((item: Item) => {
        const price = getCustomerPrice(item.ItemPrice) || 0.0; 
        const warehouseCode = item.WarehouseCode || ""; 
        const quantity = item.Quantity || 0; 

        addLine({
          ItemCode: item.ItemCode,                      // Item Code
          Dscription: item.Dscription ?? "",        // Item Description
          FromWhsCode: item.FromWhsCode ?? "",           // From Warehouse (if provided)
          FromBinLoc: item.FromBinLoc ?? "",             // From Bin Location (if provided)
          ToBinLoc: item.ToBinLoc ?? "",                 // To Bin Location (if provided)
          FisrtBin: item.FisrtBin ?? "",                 // First Bin Location (if provided)
          WhsCode: warehouseCode,                        // To Warehouse (map from warehouseCode)
          Quantity: quantity,                            // Quantity (ensure this exists)
          ItemCost: price,                               // Item Cost (price)
          UomCode: item.UomCode || "",                   // UomCode (if provided)
          unitMsr: item.unitMsr || "",                   // Unit of Measure Name (if provided)
          PlPaWght: item.PlPaWght || 0,                  // Placeholder weight (default to 0)
          U_LastPrice: price,                            // Last Purchase Price
          OcrCode2: item.OcrCode2 || "",                // COGS field 2 (if provided)
          OcrCode3: item.OcrCode3 || "",                // COGS field 3 (if provided)
          OcrCode4: item.OcrCode4 || "",                // COGS field 4 (if provided)
          U_OQCR: item.U_OQCR || "",                    // QC Required field (if provided)
          U_OQDC: item.U_OQDC || "",                    // Quality Document Entry (if provided)
          U_FBRQty: item.U_FBRQty || 0,                  // FBR Quantity (default to 0)
          U_SaleType: item.U_SaleType || "Retail",       // Sale Type (default to Retail)
          U_FurtherTax: item.U_FurtherTax || 0,          // Further Tax (default to 0)
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
          disabled={!selectedCardCode}
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
          <div className="relative max-w-full border rounded">
            <div className={`min-w-max overflow-x-auto `}>
              <Table className="text-xs w-max">
              <TableHeader className="sticky top-0 bg-neutral-900 z-10">
                <TableRow className="border-neutral-600">
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Item</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Description</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">From Warehouse</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">From Bin Locations</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">To Warehouse</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">To Bin Locations</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">First To-Bin Location</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Quantity</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Item Cost</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">UoM Code</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">UoM Name</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Line of Business</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Plant</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Commercial</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Recycled Plastic Weight</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Last Purchase Price</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Plastic Tax Reason</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">QC Required</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Quality Doc Entry</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Last Purchase Price</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">FBR PQty</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Sale Type</TableHead> 
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Further Tax</TableHead> 
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


