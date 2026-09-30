"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export interface NewBatchEntry {
  BatchNumber: string;
  Quantity: number;
  ExpiryDate?: string;
  ManufacturingDate?: string;
  AddmisionDate?: string;
  Notes?: string;
}

interface DocumentLine {
  ItemCode: string;
  ItemName?: string;
  ItemDescription?: string;
  WarehouseCode?: string;
  WhseCode?: string;
  Quantity: number;
  ManBtchNum?: string;
  BatchNumbers?: NewBatchEntry[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (selections: { batches: Record<string, NewBatchEntry[]> }) => void;
  lines: DocumentLine[];
  initialItemCode?: string;
}

const emptyForm = {
  batchNumber: "",
  quantity: "",
  expiryDate: "",
  manufacturingDate: "",
  admissionDate: "",
  notes: "",
};

export function CreateBatchDialog({ open, onClose, onConfirm, lines, initialItemCode }: Props) {
  const [itemsToProcess, setItemsToProcess] = useState<DocumentLine[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [batchesByItem, setBatchesByItem] = useState<Record<string, NewBatchEntry[]>>({});
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;

    const managedLines = lines.filter(
      (l) => String(l.ManBtchNum).toLowerCase() === "y" || String(l.ManBtchNum).toLowerCase() === "tyes"
    );
    setItemsToProcess(managedLines);

    let initialIndex = 0;
    if (initialItemCode) {
      const foundIndex = managedLines.findIndex((l) => l.ItemCode === initialItemCode);
      if (foundIndex !== -1) initialIndex = foundIndex;
    }
    setSelectedItemIndex(initialIndex);

    const initialBatches: Record<string, NewBatchEntry[]> = {};
    managedLines.forEach((l) => {
      if (l.BatchNumbers && l.BatchNumbers.length > 0) {
        initialBatches[l.ItemCode] = [...l.BatchNumbers];
      }
    });
    setBatchesByItem(initialBatches);
    setForm(emptyForm);
  }, [open, lines, initialItemCode]);

  const currentItem = itemsToProcess[selectedItemIndex];
  const currentBatches = (currentItem && batchesByItem[currentItem.ItemCode]) || [];
  const currentTotal = currentBatches.reduce((sum, b) => sum + Number(b.Quantity || 0), 0);

  const handleQuantityChange = (value: string) => {
    if (value === "") {
      setForm((f) => ({ ...f, quantity: "" }));
      return;
    }

    let num = Number(value);
    if (isNaN(num)) return;

    if (num < 0) {
      toast.error("Quantity cannot be negative.");
      num = 0;
    }

    const requiredQty = Number(currentItem?.Quantity) || 0;
    const remaining = requiredQty - currentTotal;
    if (num > remaining) {
      toast.error(`Quantity cannot exceed the remaining required quantity (${remaining.toFixed(3)}).`);
      num = remaining;
    }

    setForm((f) => ({ ...f, quantity: String(num) }));
  };

  const handleAdd = () => {
    if (!currentItem) return;

    const batchNumber = form.batchNumber.trim();
    const quantity = Number(form.quantity);

    if (!batchNumber) {
      toast.error("Enter a batch number.");
      return;
    }
    if (!quantity || quantity <= 0) {
      toast.error("Enter a quantity greater than 0.");
      return;
    }
    if (currentBatches.some((b) => b.BatchNumber === batchNumber)) {
      toast.error(`Batch "${batchNumber}" was already added for this item.`);
      return;
    }

    const requiredQty = Number(currentItem.Quantity) || 0;
    if (currentTotal + quantity > requiredQty) {
      toast.error(
        `Total batch quantity (${(currentTotal + quantity).toFixed(3)}) exceeds the required quantity (${requiredQty}).`
      );
      return;
    }

    const entry: NewBatchEntry = {
      BatchNumber: batchNumber,
      Quantity: quantity,
      ...(form.expiryDate && { ExpiryDate: form.expiryDate }),
      ...(form.manufacturingDate && { ManufacturingDate: form.manufacturingDate }),
      ...(form.admissionDate && { AddmisionDate: form.admissionDate }),
      ...(form.notes && { Notes: form.notes }),
    };

    setBatchesByItem((prev) => ({
      ...prev,
      [currentItem.ItemCode]: [...(prev[currentItem.ItemCode] || []), entry],
    }));
    setForm(emptyForm);
  };

  const handleRemove = (batchNumber: string) => {
    if (!currentItem) return;
    setBatchesByItem((prev) => ({
      ...prev,
      [currentItem.ItemCode]: (prev[currentItem.ItemCode] || []).filter((b) => b.BatchNumber !== batchNumber),
    }));
  };

  const handleConfirm = () => {
    for (const item of itemsToProcess) {
      const selected = batchesByItem[item.ItemCode] || [];
      const total = selected.reduce((sum, b) => sum + Number(b.Quantity || 0), 0);
      if (selected.length > 0 && total !== Number(item.Quantity)) {
        toast.error(`Batch quantity for item ${item.ItemCode} (${total}) does not match the required quantity (${item.Quantity}).`);
        return;
      }
    }

    onConfirm({ batches: batchesByItem });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[85vw] w-[85vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border-none shadow-lg">
        <DialogHeader className="p-4 bg-neutral-900 shrink-0">
          <DialogTitle className="text-lg font-bold text-white">Create Batch</DialogTitle>
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
                    <th className="p-3 text-right w-24 font-bold uppercase text-[10px] border-r border-neutral-100">Total Needed</th>
                    <th className="p-3 text-right w-32 font-bold uppercase text-[10px]">Total Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {itemsToProcess.map((item, idx) => {
                    const selected = batchesByItem[item.ItemCode] || [];
                    const total = selected.reduce((sum, b) => sum + Number(b.Quantity || 0), 0);
                    const isSelected = selectedItemIndex === idx;

                    return (
                      <tr
                        key={item.ItemCode}
                        className={`cursor-pointer transition-all duration-200 ${isSelected ? "bg-neutral-100 shadow-inner" : "hover:bg-neutral-50/50"}`}
                        onClick={() => {
                          setSelectedItemIndex(idx);
                          setForm(emptyForm);
                        }}
                      >
                        <td className="p-3 text-neutral-600 border-r border-neutral-100 text-center font-medium">{idx + 1}</td>
                        <td className="p-3 font-bold text-neutral-900 border-r border-neutral-100">{item.ItemCode}</td>
                        <td className="p-3 text-neutral-600 font-medium border-r border-neutral-100">{item.ItemName || item.ItemDescription || ""}</td>
                        <td className="p-3 text-neutral-500 text-center border-r border-neutral-100">{item.WarehouseCode || item.WhseCode || ""}</td>
                        <td className="p-3 text-right font-semibold border-r border-neutral-100">{Number(item.Quantity) || 0}</td>
                        <td className="p-3 text-right font-black text-neutral-900">{total}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-row gap-6 flex-1 min-h-0">
            <div className="flex-[0.7] flex flex-col gap-3 overflow-hidden">
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">New Batch</h3>

              <div className="rounded-lg bg-white border border-neutral-200 shadow-sm p-4 grid grid-cols-2 gap-3 overflow-y-auto">
                <div className="col-span-2 grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Batch Number</Label>
                  <Input
                    value={form.batchNumber}
                    onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                    placeholder="Batch number"
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Quantity</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    placeholder="0.000"
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Expiration Date</Label>
                  <Input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Manufacturing Date</Label>
                  <Input
                    type="date"
                    value={form.manufacturingDate}
                    onChange={(e) => setForm((f) => ({ ...f, manufacturingDate: e.target.value }))}
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Admission Date</Label>
                  <Input
                    type="date"
                    value={form.admissionDate}
                    onChange={(e) => setForm((f) => ({ ...f, admissionDate: e.target.value }))}
                  />
                </div>

                <div className="col-span-2 grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="min-h-[60px]"
                  />
                </div>

                <div className="col-span-2 flex justify-end">
                  <Button type="button" onClick={handleAdd} disabled={!currentItem}>
                    Add Batch
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-[0.6] flex flex-col gap-2 overflow-hidden border border-neutral-200 rounded-lg bg-white shadow-sm p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Created Batches</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest whitespace-nowrap">Total:</span>
                  <span className="text-base font-black text-blue-600">{currentTotal.toFixed(3)}</span>
                </div>
              </div>

              <ScrollArea className="rounded-lg bg-white border border-neutral-200 shadow-sm flex-1">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200">
                    <tr className="text-neutral-400">
                      <th className="p-3 text-left w-12 font-bold text-[10px] border-r border-neutral-100">#</th>
                      <th className="p-3 text-left font-bold text-[10px] border-r border-neutral-100">BATCH</th>
                      <th className="p-3 text-right w-24 font-bold text-[10px] border-r border-neutral-100">QTY</th>
                      <th className="w-12 p-3 text-center font-bold text-[10px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {currentBatches.map((b, idx) => (
                      <tr key={b.BatchNumber} className="hover:bg-red-50/30 group cursor-pointer" onClick={() => handleRemove(b.BatchNumber)}>
                        <td className="p-3 text-neutral-600 border-r border-neutral-100 text-center font-medium">{idx + 1}</td>
                        <td className="p-3 font-bold text-neutral-900 border-r border-neutral-100">{b.BatchNumber}</td>
                        <td className="p-3 text-right text-neutral-900 font-bold border-r border-neutral-100">{Number(b.Quantity).toFixed(3)}</td>
                        <td className="p-0 text-center">
                          <Trash2 className="h-4 w-4 text-neutral-200 group-hover:text-red-500 mx-auto transition-colors" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </div>
        </div>

        <div className="p-6 bg-neutral-50 shrink-0 border-t border-neutral-100 flex items-center justify-end gap-4">
          <Button variant="outline" className="h-11 px-10 font-bold text-xs uppercase" onClick={onClose}>Cancel</Button>
          <Button className="h-11 px-10 bg-neutral-900 text-white font-bold text-xs uppercase shadow-lg shadow-neutral-900/20" onClick={handleConfirm}>Confirm Selections</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
