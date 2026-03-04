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
import { Textarea } from "@/components/ui/textarea";
import { AppLabel } from "@/components/Custom/AppLabel";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesDocConfig } from "./SalesDocumentLayout";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Trash2, ExternalLink, FolderOpen, FileUp, Plus, Download, Globe, FileText } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AttachmentsTab } from "@/components/shared/AttachmentsTab";


export function DocumentItems() {
  const { watch, register } = useFormContext();
  const selectedCardCode = watch("CardCode");
  const { lines, addLine, customer, clearLines, attachments, addAttachment, removeAttachment, updateAttachment } = useSalesDocument();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<string>("Select Type");
  const [activeTab, setActiveTab] = useState("content");
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
                      onClick={() => {
                        if (!selectedCardCode) {
                          const field = document.getElementById("card-code-field");
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
            <div className="relative border rounded overflow-x-auto">
              <div className={`w-full overflow-x-auto pb-2 ${isTableDisabled ? "opacity-80 pointer-events-none" : ""}`}>
                <Table className="text-xs min-w-[1600px]">
                  <TableHeader className="sticky top-0 bg-neutral-900 z-10">
                    <TableRow className="border-neutral-600">
                      <TableHead className="text-gray-300 px-4 py-2 border-r border-neutral-700 w-[60px] text-center">Actions</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Item Code</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Item Description</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Qty</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">UoM</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Price</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Tax Code</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Line Total</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 1</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 1 (LC)</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 2</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 2 (LC)</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 3</TableHead>
                      <TableHead className="text-gray-300 px-12 py-2 whitespace-nowrap">Freight 3 (LC)</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="text-center">
                    {lines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="text-left text-gray-500 py-4">
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
          </div>
        </TabsContent>


        <TabsContent value="attachments" className="overflow-hidden mt-0">
          <AttachmentsTab
            attachments={attachments}
            addAttachment={addAttachment}
            removeAttachment={removeAttachment}
            updateAttachment={updateAttachment}
            isTableDisabled={isTableDisabled}
          />
        </TabsContent>
      </Tabs>
      <ItemSelectorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSelectItems={handleOnSelectItems}
      />
    </div >
  );
}
