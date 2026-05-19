"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SalesDocumentLine } from "@/types/sales/salesDocuments.type";
import { getBatchesByItemCodes } from "@/api+/sap/inventory/inventoryService";
import { Loader2, ChevronRight, ChevronLeft, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (selections: {
    batches: Record<string, { BatchNumber: string; Quantity: number }[]>;
  }) => void;
  lines: SalesDocumentLine[];
  initialItemCode?: string;
}

interface BatchInfo {
  ItemCode: string;
  BatchNumber: string;
  WhseCode: string;
  Quantity: number;
}

export function BatchNumberSelectionDialog({ open, onClose, onConfirm, lines, initialItemCode }: Props) {
  const [itemsToProcess, setItemsToProcess] = useState<SalesDocumentLine[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [availableStock, setAvailableStock] = useState<Record<string, BatchInfo[]>>({});
  const [selectedBatchesByItem, setSelectedBatchesByItem] = useState<Record<string, { BatchNumber: string; Quantity: number }[]>>({});
  
  const [inputQuantities, setInputQuantities] = useState<Record<string, string>>({});
  
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open && lines.length > 0) {
      const managedLines = lines.filter(l => 
        String(l.ManBtchNum).toLowerCase() === 'y' || String(l.ManBtchNum).toLowerCase() === 'tyes'
      );
      setItemsToProcess(managedLines);
      
      let initialIndex = 0;
      if (initialItemCode) {
        const foundIndex = managedLines.findIndex(l => l.ItemCode === initialItemCode);
        if (foundIndex !== -1) {
          initialIndex = foundIndex;
        }
      }
      setSelectedItemIndex(initialIndex);
      
      const batchItems = managedLines.map(l => l.ItemCode);
      fetchData(batchItems);
      
      const initialSelected: Record<string, { BatchNumber: string; Quantity: number }[]> = {};
      managedLines.forEach(l => {
        if (l.BatchNumbers && l.BatchNumbers.length > 0) {
          initialSelected[l.ItemCode] = [...l.BatchNumbers];
        }
      });
      setSelectedBatchesByItem(initialSelected);
      setInputQuantities({});
      setSearch("");
    }
  }, [open, lines, initialItemCode]);

  const fetchData = async (batchItems: string[]) => {
    if (!batchItems.length) return;
    setLoading(true);
    try {
      const data = await getBatchesByItemCodes(batchItems);
      const grouped: Record<string, BatchInfo[]> = {};
      
      (Array.isArray(data) ? data : []).forEach((b: any) => {
        const itemCode = String(b.ItemCode || "").trim();
        const batchNum = String(b.BatchNum || b.DistNumber || b.SysNumber || "").trim();
        
        let qty = 0;
        if (typeof b.BatchQuantity === 'number' || typeof b.BatchQuantity === 'string') {
          qty = Number(b.BatchQuantity);
        } else if (typeof b.Quantity === 'number' || typeof b.Quantity === 'string') {
          qty = Number(b.Quantity);
        } else if (typeof b.QuantityOnStore === 'number' || typeof b.QuantityOnStore === 'string') {
          qty = Number(b.QuantityOnStore);
        }

        if (itemCode && batchNum) {
          if (!grouped[itemCode]) grouped[itemCode] = [];
          grouped[itemCode].push({
            ItemCode: itemCode,
            BatchNumber: batchNum,
            WhseCode: String(b.WhseCode || b.WhsCode),
            Quantity: isNaN(qty) ? 0 : qty,
          });
        }
      });

      setAvailableStock(grouped);
    } catch (error) {
      console.error("Failed to fetch batches", error);
      toast.error("Failed to load available batch numbers");
    } finally {
      setLoading(false);
    }
  };

  const currentItem = itemsToProcess[selectedItemIndex];

  const handleInputChange = (batchNumber: string, value: string) => {
    setInputQuantities(prev => ({ ...prev, [batchNumber]: value }));
  };

  const handleSelectBatch = (batch: BatchInfo) => {
    if (!currentItem) return;
    
    const currentSelected = selectedBatchesByItem[currentItem.ItemCode] || [];
    const currentTotalSelected = currentSelected.reduce((sum, b) => sum + b.Quantity, 0);
    const needed = currentItem.Quantity - currentTotalSelected;
    
    if (needed <= 0) {
      toast.warning("Required quantity is already fulfilled.");
      return;
    }

    const inputStr = inputQuantities[batch.BatchNumber];
    const isManualInput = !!inputStr;
    const requestedQty = inputStr ? Number(inputStr) : needed;
    
    if (isNaN(requestedQty) || requestedQty <= 0) return;

    const alreadyAllocatedHere = currentSelected.find(s => s.BatchNumber === batch.BatchNumber)?.Quantity || 0;
    const availableToTake = batch.Quantity - alreadyAllocatedHere;
    
    if (availableToTake <= 0) {
      toast.warning("No more quantity available in this batch.");
      return;
    }

    if (isManualInput) {
      if (requestedQty > availableToTake) {
        toast.error(`Cannot select more than the available quantity (${availableToTake.toFixed(3)}).`);
        return;
      }
      if (requestedQty > needed) {
        toast.info(`Quantity auto-adjusted to the remaining required amount (${needed.toFixed(3)}).`);
      }
    }

    const actualQtyToTake = Math.min(requestedQty, availableToTake, needed);

    if (actualQtyToTake > 0) {
      const updatedSelected = [...currentSelected];
      const existingIdx = updatedSelected.findIndex(s => s.BatchNumber === batch.BatchNumber);
      if (existingIdx >= 0) {
        updatedSelected[existingIdx].Quantity += actualQtyToTake;
      } else {
        updatedSelected.push({ BatchNumber: batch.BatchNumber, Quantity: actualQtyToTake });
      }

      setSelectedBatchesByItem(prev => ({
        ...prev,
        [currentItem.ItemCode]: updatedSelected
      }));
      setInputQuantities(prev => {
        const next = {...prev};
        delete next[batch.BatchNumber];
        return next;
      });
    }
  };

  const handleMoveToSelected = () => {
    // Keep this for compatibility or multi-select if needed, 
    // but the main interaction will be handleSelectBatch
    if (!currentItem) return;
    
    const currentSelected = selectedBatchesByItem[currentItem.ItemCode] || [];
    const currentTotalSelected = currentSelected.reduce((sum, b) => sum + b.Quantity, 0);
    let needed = currentItem.Quantity - currentTotalSelected;
    
    if (needed <= 0) return;

    const available = availableStock[currentItem.ItemCode] || [];
    let updatedSelected = [...currentSelected];
    let processedAny = false;

    available.forEach(batch => {
      const inputStr = inputQuantities[batch.BatchNumber];
      if (!inputStr) return;
      
      const requestedQty = Number(inputStr);
      if (isNaN(requestedQty) || requestedQty <= 0) return;

      processedAny = true;
      const availableToTake = batch.Quantity;
      const actualQtyToTake = Math.min(requestedQty, availableToTake, needed);
      
      if (actualQtyToTake > 0) {
        const existingIdx = updatedSelected.findIndex(s => s.BatchNumber === batch.BatchNumber);
        if (existingIdx >= 0) {
           updatedSelected[existingIdx].Quantity += actualQtyToTake;
        } else {
           updatedSelected.push({ BatchNumber: batch.BatchNumber, Quantity: actualQtyToTake });
        }
        needed -= actualQtyToTake;
      }
    });

    if (processedAny) {
      setSelectedBatchesByItem(prev => ({
        ...prev,
        [currentItem.ItemCode]: updatedSelected
      }));
      setInputQuantities({});
    }
  };

  const handleMoveToAvailable = (batchNumber?: string) => {
    if (!currentItem) return;
    const currentSelected = selectedBatchesByItem[currentItem.ItemCode] || [];
    
    if (batchNumber) {
      setSelectedBatchesByItem(prev => ({
        ...prev,
        [currentItem.ItemCode]: currentSelected.filter(b => b.BatchNumber !== batchNumber)
      }));
    } else {
      setSelectedBatchesByItem(prev => ({
        ...prev,
        [currentItem.ItemCode]: []
      }));
    }
  };

  const handleAutoSelect = () => {
    if (!currentItem) return;
    const currentSelected = selectedBatchesByItem[currentItem.ItemCode] || [];
    const currentTotalSelected = currentSelected.reduce((sum, b) => sum + b.Quantity, 0);
    let needed = currentItem.Quantity - currentTotalSelected;
    
    if (needed <= 0) return;

    const available = availableStock[currentItem.ItemCode] || [];
    let updatedSelected = [...currentSelected];

    for (const batch of available) {
      if (needed <= 0) break;
      
      const alreadyAllocatedHere = updatedSelected.find(s => s.BatchNumber === batch.BatchNumber)?.Quantity || 0;
      const availableToTake = batch.Quantity - alreadyAllocatedHere;
      
      if (availableToTake > 0) {
        const qtyToTake = Math.min(availableToTake, needed);
        const existingIdx = updatedSelected.findIndex(s => s.BatchNumber === batch.BatchNumber);
        
        if (existingIdx >= 0) {
           updatedSelected[existingIdx].Quantity += qtyToTake;
        } else {
           updatedSelected.push({ BatchNumber: batch.BatchNumber, Quantity: qtyToTake });
        }
        needed -= qtyToTake;
      }
    }

    setSelectedBatchesByItem(prev => ({
      ...prev,
      [currentItem.ItemCode]: updatedSelected
    }));
  };

  const handleConfirm = () => {
    let isValid = true;
    for (const item of itemsToProcess) {
      const selected = selectedBatchesByItem[item.ItemCode] || [];
      const totalSelected = selected.reduce((sum, b) => sum + b.Quantity, 0);
      if (totalSelected !== item.Quantity) {
        isValid = false;
        toast.error(`Please select exactly ${item.Quantity} batches for item ${item.ItemCode}`);
        break;
      }
    }

    if (!isValid) return;

    onConfirm({ batches: selectedBatchesByItem });
    onClose();
  };

  const currentSelectedItems = selectedBatchesByItem[currentItem?.ItemCode] || [];
  const currentTotalSelected = currentSelectedItems.reduce((sum, b) => sum + b.Quantity, 0);

  const filteredAvailable = (availableStock[currentItem?.ItemCode] || []).filter(s => {
    return s.BatchNumber.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[85vw] w-[85vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border-none shadow-lg">
        <DialogHeader className="p-4 bg-neutral-900 shrink-0">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            Batch Number Selection
            {loading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-white">
          <div className="flex flex-col gap-2 shrink-0">
             <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Rows from Documents</h3>
             <div className="rounded-lg bg-white border border-neutral-200 shadow-sm max-h-[130px] min-h-[80px] overflow-y-auto">
               <table className="w-full text-xs border-collapse">
                 <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200">
                   <tr className="text-neutral-400">
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
                     const selected = selectedBatchesByItem[item.ItemCode] || [];
                     const totalSelected = selected.reduce((sum, b) => sum + b.Quantity, 0);
                     const isSelected = selectedItemIndex === idx;
                     const openQty = Math.max(0, item.Quantity - totalSelected);
                     
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
                         <td className="p-3 text-right font-black text-neutral-900 border-r border-neutral-100">{totalSelected}</td>
                         <td className={`p-3 text-right font-black border-r border-neutral-100 ${openQty > 0 ? 'text-red-500' : 'text-neutral-400'}`}>{openQty}</td>
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

          <div className="flex flex-row gap-6 flex-1 min-h-0">
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                <div className="flex flex-col gap-2">
                   <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Available Batches</h3>
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      <Input 
                        className="h-11 pl-12 text-sm border-neutral-300 bg-white rounded-lg shadow-sm" 
                        placeholder="Search batch numbers..."
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                      />
                   </div>
                </div>

                <div className="rounded-lg bg-white border border-neutral-200 shadow-sm overflow-auto flex-1">
                   <table className="w-full text-xs border-collapse">
                     <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200">
                       <tr className="text-neutral-400">
                         <th className="p-3 text-left w-12 font-bold text-[10px] border-r border-neutral-100">#</th>
                         <th className="p-3 text-left font-bold text-[10px] border-r border-neutral-100">BATCH NUMBER</th>
                         <th className="p-3 text-right w-24 font-bold text-[10px] border-r border-neutral-100">AVAIL</th>
                         <th className="p-3 text-right w-32 font-bold text-[10px]">SELECTED QTY</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-neutral-200">
                       {filteredAvailable.map((batch, idx) => {
                         const currentSelectedForBatch = currentSelectedItems.find(s => s.BatchNumber === batch.BatchNumber)?.Quantity || 0;
                         const remainingAvail = batch.Quantity - currentSelectedForBatch;
                         
                         return (
                           <tr 
                             key={batch.BatchNumber} 
                             className="hover:bg-neutral-50 transition-all group cursor-pointer"
                             onClick={() => handleSelectBatch(batch)}
                           >
                             <td className="p-3 text-neutral-600 border-r border-neutral-100 text-center font-medium">{idx + 1}</td>
                             <td className="p-3 font-bold text-neutral-800 border-r border-neutral-100 flex items-center gap-2">
                               <ChevronRight className="h-3 w-3 text-blue-500" />
                               {batch.BatchNumber}
                             </td>
                             <td className="p-3 text-right text-neutral-600 font-bold border-r border-neutral-100">{remainingAvail.toFixed(3)}</td>
                             <td className="p-0 bg-neutral-50/30" onClick={(e) => e.stopPropagation()}>
                               <input 
                                 type="number" 
                                 className="w-full h-full min-h-[44px] px-4 text-right text-sm font-bold bg-transparent outline-none focus:bg-white transition-colors"
                                 value={inputQuantities[batch.BatchNumber] || ''}
                                 onChange={(e) => handleInputChange(batch.BatchNumber, e.target.value)}
                                 onBlur={() => {
                                   if (inputQuantities[batch.BatchNumber]) handleSelectBatch(batch);
                                 }}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' || e.key === 'Tab') {
                                     if (e.key === 'Enter') e.preventDefault();
                                     handleSelectBatch(batch);
                                   }
                                 }}
                                 placeholder="0.000"
                               />
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                </div>
             </div>

             <div className="flex flex-col items-center justify-center gap-4 pt-12 opacity-0 pointer-events-none w-0 overflow-hidden">
                {/* Center buttons removed as per user request */}
             </div>

             <div className="flex-[0.6] flex flex-col gap-2 overflow-hidden border border-neutral-200 rounded-lg bg-white shadow-sm p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    Selected Batches
                  </h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">Selected:</span>
                     <span className="text-base font-black text-blue-600">{currentTotalSelected.toFixed(3)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end pb-1">
                  <Button size="sm" variant="ghost" onClick={() => handleMoveToAvailable()} className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] font-black uppercase">Remove All</Button>
                  <Button size="sm" onClick={handleAutoSelect} className="h-7 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-[10px] font-black uppercase shadow-sm rounded-md">Auto Select</Button>
                </div>

                <div className="rounded-lg bg-white overflow-y-auto border border-neutral-200 shadow-sm flex-1">
                   <table className="w-full text-xs border-collapse">
                     <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200">
                       <tr className="text-neutral-400">
                         <th className="p-3 text-left w-12 font-bold text-[10px] border-r border-neutral-100">#</th>
                         <th className="p-3 text-left font-bold text-[10px] border-r border-neutral-100">BATCH NUMBER</th>
                         <th className="p-3 text-right w-24 font-bold text-[10px] border-r border-neutral-100">QTY</th>
                         <th className="w-12 p-3 text-center font-bold text-[10px]"></th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-neutral-200">
                       {currentSelectedItems.map((cs, idx) => (
                         <tr 
                           key={`sel-${cs.BatchNumber}`} 
                           className="hover:bg-red-50/30 group cursor-pointer"
                           onClick={() => handleMoveToAvailable(cs.BatchNumber)}
                         >
                           <td className="p-3 text-neutral-600 border-r border-neutral-100 text-center font-medium">{idx + 1}</td>
                           <td className="p-3 font-bold text-neutral-900 border-r border-neutral-100">{cs.BatchNumber}</td>
                           <td className="p-3 text-right text-neutral-900 font-bold border-r border-neutral-100">{cs.Quantity.toFixed(3)}</td>
                           <td className="p-0 text-center">
                              <Trash2 className="h-4 w-4 text-neutral-200 group-hover:text-red-500 mx-auto transition-colors" />
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
             </div>
          </div>
        </div>

        <div className="p-6 bg-neutral-50 shrink-0 border-t border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">Available:</span>
               <span className="text-lg font-black text-neutral-900">
                 {((availableStock[currentItem?.ItemCode] || []).reduce((sum, b) => sum + b.Quantity, 0)).toFixed(3)}
               </span>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="h-11 px-10 font-bold text-xs uppercase" onClick={onClose}>Cancel</Button>
            <Button className="h-11 px-10 bg-neutral-900 text-white font-bold text-xs uppercase shadow-lg shadow-neutral-900/20" onClick={handleConfirm}>Confirm Selections</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
