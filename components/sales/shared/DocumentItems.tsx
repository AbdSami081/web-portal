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
import { getAttachment } from "@/api+/sap/quotation/salesService";


export function DocumentItems() {
  const { watch, register } = useFormContext();
  const selectedCardCode = watch("CardCode");
  const { lines, addLine, customer, clearLines } = useSalesDocument();
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
            <div className="relative border rounded overflow-hidden">
              <div className={`overflow-x-auto pb-2 ${isTableDisabled ? "opacity-80 pointer-events-none" : ""}`}>
                <Table className="text-xs min-w-full">
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
          <AttachmentsTab isTableDisabled={isTableDisabled} />
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

function AttachmentsTab({ isTableDisabled }: { isTableDisabled: boolean }) {
  const { attachments, addAttachment, removeAttachment, updateAttachment } = useSalesDocument();
  const [selectedLineNum, setSelectedLineNum] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addAttachment(file);
  };

  const handleDisplay = async () => {
    if (selectedLineNum === null) {
      toast.info("Please select an attachment row first.");
      return;
    }
    const att = attachments.find((a) => a.LineNum === selectedLineNum);
    if (!att) return;

    const fullPath = att.SourcePath
      ? att.SourcePath.replace(/\\$/, "") + "\\" + att.FileName
      : att.FileName;

    try {
      const blob = await getAttachment(fullPath);
      if (blob) {
        const url = window.URL.createObjectURL(blob);

        let iframe = document.getElementById("attachment-download-frame") as HTMLIFrameElement;
        if (!iframe) {
          iframe = document.createElement("iframe");
          iframe.id = "attachment-download-frame";
          iframe.style.display = "none";
          document.body.appendChild(iframe);
        }
        iframe.src = url;
      } else {
        toast.error("Failed to fetch attachment.");
      }
    } catch (err) {
      toast.error("Error loading attachment.");
    }
  };

  return (
    <div className={`space-y-4 pt-4 ${isTableDisabled ? "opacity-80 pointer-events-none" : ""}`}>
      <div className="relative border rounded-xl overflow-hidden bg-white shadow-sm border-zinc-100">
        <div className="overflow-x-auto min-h-[300px]">
          <Table className="text-[11px] min-w-[1000px]">
            <TableHeader className="bg-zinc-50 border-b border-zinc-100">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-12 text-center font-bold text-zinc-600 uppercase tracking-tighter">#</TableHead>
                <TableHead className="font-bold text-zinc-600 uppercase tracking-tighter">Target Path</TableHead>
                <TableHead className="font-bold text-zinc-600 uppercase tracking-tighter">File Name</TableHead>
                <TableHead className="font-bold text-zinc-600 uppercase tracking-tighter">Attachment Date</TableHead>
                <TableHead className="font-bold text-zinc-600 uppercase tracking-tighter">Free Text</TableHead>
                <TableHead className="w-32 text-center font-bold text-zinc-600 uppercase tracking-tighter">Copy to Target</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attachments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-zinc-400 space-y-3">
                      <div className="p-4 bg-zinc-50 rounded-full">
                        <FolderOpen className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-xs font-medium uppercase tracking-widest opacity-60">No attachments found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                attachments.map((att, idx) => {
                  const isSelected = selectedLineNum === att.LineNum;
                  return (
                    <TableRow
                      key={att.LineNum}
                      onClick={() => setSelectedLineNum(isSelected ? null : att.LineNum)}
                      className={`group cursor-pointer transition-colors border-b border-zinc-50 ${isSelected
                        ? "bg-blue-50 hover:bg-blue-100 ring-1 ring-inset ring-blue-300"
                        : "hover:bg-zinc-50"
                        }`}
                    >
                      <TableCell className="text-center font-mono text-zinc-400">{idx + 1}</TableCell>
                      <TableCell className="text-zinc-500 italic max-w-xs truncate">{att.SourcePath || process.env.NEXT_PUBLIC_ATTACHMENT_SOURCE_PATH || "N/A"}</TableCell>
                      <TableCell className={`font-semibold ${isSelected ? "text-blue-700" : "text-zinc-900"}`}>{att.FileName}</TableCell>
                      <TableCell className="text-zinc-600">{att.AttachmentDate}</TableCell>
                      <TableCell className="p-1" onClick={(e) => e.stopPropagation()}>
                        <Input
                          className="h-8 text-[11px] border-transparent bg-transparent hover:bg-white hover:border-zinc-200 focus:bg-white focus:border-primary transition-all rounded-md"
                          value={att.FreeText}
                          onChange={(e) => updateAttachment(att.LineNum, { FreeText: e.target.value })}
                          placeholder="Add comments..."
                        />
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={att.CopyToTarget}
                          onCheckedChange={(checked) => updateAttachment(att.LineNum, { CopyToTarget: !!checked })}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell className="p-1 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                          onClick={() => removeAttachment(att.LineNum)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <div className="relative">
          <input
            type="file"
            className="hidden"
            id="attachment-browse"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            className="bg-white border-zinc-200 hover:bg-zinc-50 transition-all text-xs font-bold gap-2 rounded-xl h-10 px-5 shadow-sm"
            asChild
          >
            <label htmlFor="attachment-browse" className="cursor-pointer">
              <FolderOpen className="w-4 h-4 text-amber-500" />
              Browse
            </label>
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          className={`transition-all text-xs font-bold gap-2 rounded-xl h-10 px-5 shadow-sm ${selectedLineNum !== null
            ? "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
            : "bg-white border-zinc-200 hover:bg-zinc-50"
            }`}
          disabled={attachments.length === 0}
          onClick={handleDisplay}
        >
          <ExternalLink className="w-4 h-4 text-blue-500" />
          Display
        </Button>
        <Button
          type="button"
          variant="outline"
          className="bg-white border-zinc-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all text-xs font-bold gap-2 rounded-xl h-10 px-5 shadow-sm"
          disabled={attachments.length === 0}
          onClick={() => {
            if (selectedLineNum !== null) {
              removeAttachment(selectedLineNum);
              setSelectedLineNum(null);
            } else {
              toast.info("Please select an attachment row first.");
            }
          }}
        >
          <Trash2 className="w-4 h-4 text-red-500" />
          Delete
        </Button>
      </div>
    </div>
  );
}
