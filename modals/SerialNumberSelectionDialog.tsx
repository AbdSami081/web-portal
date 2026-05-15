import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SalesDocumentLine } from "@/types/sales/salesDocuments.type";
import { getSerialsByItemCodes, getBatchesByItemCodes } from "@/api+/sap/inventory/inventoryService";
import { Search, Loader2, X, ChevronRight, Trash2, ChevronLeft } from 'lucide-react';
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (selections: {
    serials?: Record<string, { InternalSerialNumber: string }[]>;
    batches?: Record<string, { BatchNumber: string; Quantity: number }[]>;
  }) => void;
  lines: SalesDocumentLine[];
}

interface StockInfo {
  ItemCode: string;
  Identifier: string; // SerialNumber or BatchNumber
  WhseCode?: string;
  Quantity?: number; // Available quantity for batches
  [key: string]: any;
}

export function SerialNumberSelectionDialog({ open, onClose, onConfirm, lines }: Props) {
  const [itemsToProcess, setItemsToProcess] = useState<SalesDocumentLine[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [availableStock, setAvailableStock] = useState<Record<string, StockInfo[]>>({});
  const [selectedSerialsByItem, setSelectedSerialsByItem] = useState<Record<string, { InternalSerialNumber: string }[]>>({});
  const [selectedBatchesByItem, setSelectedBatchesByItem] = useState<Record<string, { BatchNumber: string; Quantity: number }[]>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const currentItem = itemsToProcess[selectedItemIndex];
  const isSerialManaged = currentItem?.ManSerNum === 'Y' || currentItem?.ManSerNum === 'tYES';
  const isBatchManaged = currentItem?.ManBatNum === 'Y' || currentItem?.ManBatNum === 'tYES';

  useEffect(() => {
    if (open) {
      const managedLines = lines.filter(l => 
        l.ManSerNum === 'Y' || l.ManSerNum === 'tYES' || 
        l.ManBatNum === 'Y' || l.ManBatNum === 'tYES'
      );
      setItemsToProcess(managedLines);
      setSelectedItemIndex(0);
      
      const serialItems = managedLines.filter(l => l.ManSerNum === 'Y' || l.ManSerNum === 'tYES').map(l => l.ItemCode);
      const batchItems = managedLines.filter(l => l.ManBatNum === 'Y' || l.ManBatNum === 'tYES').map(l => l.ItemCode);
      
      fetchData(serialItems, batchItems);
    }
  }, [open, lines]);

  const fetchData = async (serialItems: string[], batchItems: string[]) => {
    if (!serialItems.length && !batchItems.length) return;
    setLoading(true);
    try {
      const grouped: Record<string, StockInfo[]> = {};

      if (serialItems.length > 0) {
        const serialData = await getSerialsByItemCodes(serialItems);
        (Array.isArray(serialData) ? serialData : []).forEach((s: any) => {
          const itemCode = (s.ItemCode || "").toString().trim();
          const serialNum = (s.DistNumber || "").toString().trim();
          if (itemCode && serialNum) {
            if (!grouped[itemCode]) grouped[itemCode] = [];
            grouped[itemCode].push({
              ItemCode: itemCode,
              Identifier: serialNum,
              WhseCode: s.WhseCode || s.WhsCode || '01',
              Quantity: 1,
              ...s
            });
          }
        });
      }

      if (batchItems.length > 0) {
        const batchData = await getBatchesByItemCodes(batchItems);
        (Array.isArray(batchData) ? batchData : []).forEach((b: any) => {
          const itemCode = (b.ItemCode || "").toString().trim();
          const batchNum = (b.BatchNum || b.DistNumber || "").toString().trim();
          if (itemCode && batchNum) {
            if (!grouped[itemCode]) grouped[itemCode] = [];
            grouped[itemCode].push({
              ItemCode: itemCode,
              Identifier: batchNum,
              WhseCode: b.WhseCode || b.WhsCode || '01',
              Quantity: Number(b.Quantity || b.QuantityOnStore || 0),
              ...b
            });
          }
        });
      }

      setAvailableStock(grouped);
    } catch (error) {
      console.error("Fetch stock error:", error);
      toast.error("Failed to fetch stock information");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (stock: StockInfo) => {
    if (!currentItem) return;
    
    if (isSerialManaged) {
      const currentSelected = selectedSerialsByItem[currentItem.ItemCode] || [];
      if (currentSelected.length >= currentItem.Quantity) {
        toast.warning(`Quantity requirement (${currentItem.Quantity}) already met.`);
        return;
      }
      if (currentSelected.some(s => s.InternalSerialNumber === stock.Identifier)) return;
      setSelectedSerialsByItem(prev => ({
        ...prev,
        [currentItem.ItemCode]: [...currentSelected, { InternalSerialNumber: stock.Identifier }]
      }));
    } else if (isBatchManaged) {
      const currentSelected = selectedBatchesByItem[currentItem.ItemCode] || [];
      const totalSelected = currentSelected.reduce((sum, b) => sum + b.Quantity, 0);
      const needed = currentItem.Quantity - totalSelected;
      
      if (needed <= 0) {
        toast.warning(`Quantity requirement (${currentItem.Quantity}) already met.`);
        return;
      }

      const qtyToAdd = Math.min(needed, stock.Quantity || 0);
      if (qtyToAdd <= 0) return;

      const existingBatch = currentSelected.find(b => b.BatchNumber === stock.Identifier);
      if (existingBatch) {
          // If already selected, maybe update quantity? For now just skip
          return;
      }

      setSelectedBatchesByItem(prev => ({
        ...prev,
        [currentItem.ItemCode]: [...currentSelected, { BatchNumber: stock.Identifier, Quantity: qtyToAdd }]
      }));
    }
  };

  const handleRemove = (identifier: string) => {
    if (!currentItem) return;
    
    if (isSerialManaged) {
      const currentSelected = selectedSerialsByItem[currentItem.ItemCode] || [];
      setSelectedSerialsByItem(prev => ({
        ...prev,
        [currentItem.ItemCode]: currentSelected.filter(s => s.InternalSerialNumber !== identifier)
      }));
    } else {
      const currentSelected = selectedBatchesByItem[currentItem.ItemCode] || [];
      setSelectedBatchesByItem(prev => ({
        ...prev,
        [currentItem.ItemCode]: currentSelected.filter(b => b.BatchNumber !== identifier)
      }));
    }
  };

  const handleAutoSelect = () => {
    if (!currentItem) return;
    
    const available = availableStock[currentItem.ItemCode] || [];
    
    if (isSerialManaged) {
      const currentSelected = selectedSerialsByItem[currentItem.ItemCode] || [];
      const needed = currentItem.Quantity - currentSelected.length;
      if (needed <= 0) return;

      const notSelected = available.filter(s => !currentSelected.some(as => as.InternalSerialNumber === s.Identifier));
      const toAdd = notSelected.slice(0, needed).map(s => ({ InternalSerialNumber: s.Identifier }));
      
      setSelectedSerialsByItem(prev => ({
        ...prev,
        [currentItem.ItemCode]: [...currentSelected, ...toAdd]
      }));
    } else {
      const currentSelected = selectedBatchesByItem[currentItem.ItemCode] || [];
      let totalSelected = currentSelected.reduce((sum, b) => sum + b.Quantity, 0);
      let needed = currentItem.Quantity - totalSelected;
      if (needed <= 0) return;

      const toAdd: { BatchNumber: string; Quantity: number }[] = [];
      const notSelected = available.filter(s => !currentSelected.some(as => as.BatchNumber === s.Identifier));
      
      for (const batch of notSelected) {
        if (needed <= 0) break;
        const qty = Math.min(needed, batch.Quantity || 0);
        toAdd.push({ BatchNumber: batch.Identifier, Quantity: qty });
        needed -= qty;
      }

      setSelectedBatchesByItem(prev => ({
        ...prev,
        [currentItem.ItemCode]: [...currentSelected, ...toAdd]
      }));
    }
  };

  const handleRemoveAll = () => {
    if (!currentItem) return;
    if (isSerialManaged) {
      setSelectedSerialsByItem(prev => ({ ...prev, [currentItem.ItemCode]: [] }));
    } else {
      setSelectedBatchesByItem(prev => ({ ...prev, [currentItem.ItemCode]: [] }));
    }
  };

  const handleConfirm = () => {
    const missing = itemsToProcess.filter(item => {
      const isSerial = item.ManSerNum === 'Y' || item.ManSerNum === 'tYES';
      if (isSerial) {
        return (selectedSerialsByItem[item.ItemCode]?.length || 0) < item.Quantity;
      } else {
        const total = (selectedBatchesByItem[item.ItemCode] || []).reduce((sum, b) => sum + b.Quantity, 0);
        return total < item.Quantity;
      }
    });

    if (missing.length > 0) {
      toast.error(`Please select required quantities. Missing for: ${missing.map(m => m.ItemCode).join(', ')}`);
      return;
    }

    onConfirm({
      serials: selectedSerialsByItem,
      batches: selectedBatchesByItem
    });
    onClose();
  };

  const currentSelectedItems = isSerialManaged 
    ? (selectedSerialsByItem[currentItem?.ItemCode] || []).map(s => ({ id: s.InternalSerialNumber, qty: 1 }))
    : (selectedBatchesByItem[currentItem?.ItemCode] || []).map(b => ({ id: b.BatchNumber, qty: b.Quantity }));

  const filteredAvailable = (availableStock[currentItem?.ItemCode] || []).filter(s => {
    const id = s.Identifier.toLowerCase();
    const isAlreadySelected = currentSelectedItems.some(cs => cs.id === s.Identifier);
    return id.includes(search.toLowerCase()) && !isAlreadySelected;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[80vw] w-[80vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border-none shadow-lg">
        <DialogHeader className="p-4 bg-neutral-900 shrink-0">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            Serial Number Selection
            {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-6 bg-white min-h-0">
          <div className="flex flex-col gap-3">
            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
               Rows from Documents
            </h3>
            <div className="rounded-lg bg-white border border-neutral-200 shadow-sm h-[180px] overflow-y-auto shrink-0">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200">
                    <tr className="text-neutral-500">
                      <th className="p-3 text-left w-12 font-bold uppercase text-[10px] border-r border-neutral-100">#</th>
                      <th className="p-3 text-left w-[150px] font-bold uppercase text-[10px] border-r border-neutral-100">Item No.</th>
                      <th className="p-3 text-left font-bold uppercase text-[10px] border-r border-neutral-100">Item Description</th>
                      <th className="p-3 text-left w-24 font-bold uppercase text-[10px] border-r border-neutral-100">Whse</th>
                      <th className="p-3 text-right w-24 font-bold uppercase text-[10px] border-r border-neutral-100">Qty</th>
                      <th className="p-3 text-right w-32 font-bold uppercase text-[10px] border-r border-neutral-100">Selected</th>
                      <th className="p-3 text-right w-24 font-bold uppercase text-[10px] border-r border-neutral-100">Open</th>
                      <th className="p-3 text-center w-20 font-bold uppercase text-[10px]">Dir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {itemsToProcess.map((item, idx) => {
                      const isS = item.ManSerNum === 'Y' || item.ManSerNum === 'tYES';
                      const selectedCount = isS 
                        ? (selectedSerialsByItem[item.ItemCode]?.length || 0)
                        : (selectedBatchesByItem[item.ItemCode] || []).reduce((sum, b) => sum + b.Quantity, 0);
                      const openQty = Math.max(0, item.Quantity - selectedCount);
                      const isSelected = selectedItemIndex === idx;
                      return (
                        <tr 
                          key={item.ItemCode} 
                          className={`cursor-pointer transition-all duration-200 ${isSelected ? 'bg-neutral-100 shadow-inner' : 'hover:bg-neutral-50/50'}`}
                          onClick={() => setSelectedItemIndex(idx)}
                        >
                          <td className="p-3 text-neutral-600 border-r border-neutral-100 text-center font-medium">{idx + 1}</td>
                          <td className="p-3 font-bold text-neutral-900 border-r border-neutral-100">{String(item.ItemCode || "")}</td>
                          <td className="p-3 text-neutral-600 font-medium border-r border-neutral-100">{String(item.ItemName || item.ItemDescription || "")}</td>
                          <td className="p-3 text-neutral-500 text-center border-r border-neutral-100">{String(item.WarehouseCode || "")}</td>
                          <td className="p-3 text-right font-semibold border-r border-neutral-100">{!isNaN(Number(item.Quantity)) ? Number(item.Quantity) : 0}</td>
                          <td className="p-3 text-right font-black text-neutral-900 border-r border-neutral-100">{!isNaN(Number(selectedCount)) ? Number(selectedCount) : 0}</td>
                          <td className={`p-3 text-right font-black border-r border-neutral-100 ${openQty > 0 ? 'text-red-500' : 'text-neutral-400'}`}>{!isNaN(Number(openQty)) ? Number(openQty) : 0}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-1 rounded bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-tighter">Out</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 flex-1 overflow-hidden">
            <div className="flex flex-col gap-4 overflow-hidden">
              <div className="flex flex-col gap-2">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Available {isSerialManaged ? 'Serials' : 'Batches'}
                </h3>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input 
                    className="h-11 pl-12 text-sm border-neutral-300 bg-white rounded-lg shadow-sm" 
                    placeholder={`Search ${isSerialManaged ? 'serial' : 'batch'} numbers...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-white border border-neutral-200 shadow-sm h-[350px] overflow-y-auto shrink-0">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200">
                      <tr className="text-neutral-400">
                        <th className="p-3 text-left w-12 font-bold text-[10px] border-r border-neutral-100">#</th>
                        <th className="p-3 text-left font-bold text-[10px] border-r border-neutral-100">{isSerialManaged ? 'SERIAL' : 'BATCH'} NUMBER</th>
                        <th className="p-3 text-right w-24 font-bold text-[10px] border-r border-neutral-100">AVAIL</th>
                        <th className="p-3 text-right w-32 font-bold text-[10px]">UNIT COST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredAvailable.map((s, idx) => (
                        <tr 
                          key={`avail-${s.Identifier}-${idx}`} 
                          className="hover:bg-neutral-50 transition-all cursor-pointer group"
                          onClick={() => handleSelect(s)}
                        >
                          <td className="p-3 text-neutral-600 text-center border-r border-neutral-100 font-medium">{idx + 1}</td>
                          <td className="p-3 font-bold text-neutral-800 border-r border-neutral-100 flex items-center gap-2">
                             <ChevronRight className={`h-3 w-3 ${isSerialManaged ? 'text-blue-500' : 'text-orange-500'}`} />
                             {String(s.Identifier || "")}
                          </td>
                          <td className="p-3 text-right text-neutral-600 border-r border-neutral-100 font-bold">{!isNaN(Number(s.Quantity)) ? Number(s.Quantity) : 0}</td>
                          <td className="p-3 text-right text-neutral-900 font-bold font-mono text-[10px]">0.00</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            </div>

            <div className="flex flex-col gap-4 overflow-hidden flex-1 min-h-0">
              <div className="flex justify-between items-center shrink-0">
                <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                  Selected {isSerialManaged ? 'Serials' : 'Batches'}
                </h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={handleRemoveAll} className="text-red-500 hover:text-red-600 text-[10px] font-black uppercase">Remove All</Button>
                  <Button size="sm" onClick={handleAutoSelect} className="bg-neutral-900 text-white text-[10px] font-black uppercase shadow-sm">Auto Select</Button>
                </div>
              </div>

              <div className="rounded-lg bg-white overflow-y-auto border border-neutral-200 shadow-sm h-[350px] shrink-0">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-neutral-50 sticky top-0 z-10 border-b border-neutral-200">
                      <tr className="text-neutral-400">
                        <th className="p-3 text-left w-12 font-bold text-[10px] border-r border-neutral-100">#</th>
                        <th className="p-3 text-left font-bold text-[10px] border-r border-neutral-100">IDENTIFIER</th>
                        <th className="p-3 text-right w-24 font-bold text-[10px] border-r border-neutral-100">QTY</th>
                        <th className="p-3 text-center w-20 font-bold text-[10px]">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {currentSelectedItems.map((cs, idx) => (
                        <tr key={`sel-${cs.id}-${idx}`} className="hover:bg-red-50/30 group">
                          <td className="p-3 text-neutral-600 text-center border-r border-neutral-100 font-medium">{idx + 1}</td>
                          <td className="p-3 font-bold text-neutral-900 border-r border-neutral-100">{String(cs.id || "")}</td>
                          <td className="p-3 text-right border-r border-neutral-100 font-bold">{!isNaN(Number(cs.qty)) ? Number(cs.qty) : 0}</td>
                          <td className="p-3 text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-300 hover:text-red-500 rounded-lg" onClick={() => handleRemove(cs.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

        <DialogFooter className="p-6 bg-neutral-50 border-t border-neutral-200 flex sm:justify-between items-center shrink-0">
          <div className="flex gap-8 items-center">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">Available:</span>
               <span className="text-lg font-black text-neutral-900">{(availableStock[currentItem?.ItemCode] || []).length}</span>
            </div>
            <div className="h-6 w-px bg-neutral-200" />
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">Total Selected:</span>
               <span className="text-lg font-black text-orange-600">
                  {isSerialManaged 
                    ? (selectedSerialsByItem[currentItem?.ItemCode] || []).length 
                    : (selectedBatchesByItem[currentItem?.ItemCode] || []).reduce((sum, b) => sum + b.Quantity, 0)}
               </span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="h-11 px-10 font-bold text-xs uppercase" onClick={onClose}>Cancel</Button>
            <Button className="h-11 px-12 bg-neutral-900 text-white font-black shadow-lg text-xs uppercase" onClick={handleConfirm}>Confirm</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}