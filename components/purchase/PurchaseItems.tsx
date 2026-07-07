import { useEffect, useState } from "react";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PurchaseItemRow } from "./PurchaseItemRow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";

export function PurchaseItems() {
  const { lines, addLine } = usePurchaseDocument();
  const { loadDocumentEssentials } = useMasterDataStore();
  const [activeTab, setActiveTab] = useState("content");

  useEffect(() => {
    loadDocumentEssentials("P");
  }, [loadDocumentEssentials]);

  const handleAddLine = () => {
    addLine({
      Quantity: 1,
      Price: 0,
      DiscountPercent: 0,
    });
  };

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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      onClick={handleAddLine}
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

            <div className="relative border rounded overflow-x-auto">
              <div className="w-full overflow-x-auto pb-2">
                <Table className="text-xs min-w-[1600px]">
                  <TableHeader className="sticky top-0 bg-neutral-900 z-10">
                    <TableRow className="border-neutral-600">
                      <TableHead className="text-gray-300 px-4 py-2 border-r border-neutral-700 w-[60px] text-center">Actions</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Item Code</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Vendor</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Required Date</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap text-right">Required Qty.</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap text-right">Info Price</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap text-right">Discount %</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Tax Code</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap text-right">Total (LC)</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">UoM Code</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Country Org</TableHead>
                      
                      {/* Custom FBR Fields */}
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">FBR UoM</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap text-right">FBR Qty</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap text-right">FBR Rate</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap text-right">FBR LineTotal</TableHead>
                      <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap text-right">FBR SalesTax</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={16} className="h-32 text-center text-slate-500">
                          No items added yet. Click &quot;Add Item&quot; to begin.
                        </TableCell>
                      </TableRow>
                    ) : (
                      lines.map((_, index) => (
                        <PurchaseItemRow key={index} index={index} />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="attachments" className="mt-0">
           <div className="p-8 text-center text-slate-500 bg-white border rounded-lg">
              Attachments functionality coming soon.
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}