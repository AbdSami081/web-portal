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

export interface NewSerialEntry {
  InternalSerialNumber: string;
  ManufacturerSerialNumber?: string;
  Quantity?: number;
  ExpiryDate?: string;
  ManufactureDate?: string;
  ReceptionDate?: string;
  WarrantyStart?: string;
  WarrantyEnd?: string;
  Location?: string;
  Notes?: string;
}

interface DocumentLine {
  ItemCode: string;
  ItemName?: string;
  ItemDescription?: string;
  WarehouseCode?: string;
  WhseCode?: string;
  Quantity: number;
  ManSerNum?: string;
  SerialNumbers?: NewSerialEntry[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (selections: { serials: Record<string, NewSerialEntry[]> }) => void;
  lines: DocumentLine[];
  initialItemCode?: string;
}

const emptyForm = {
  serialNumber: "",
  manufacturerSerialNumber: "",
  expiryDate: "",
  manufactureDate: "",
  receptionDate: "",
  warrantyStart: "",
  warrantyEnd: "",
  location: "",
  notes: "",
};

export function CreateSerialDialog({ open, onClose, onConfirm, lines, initialItemCode }: Props) {
  const [itemsToProcess, setItemsToProcess] = useState<DocumentLine[]>([]);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [serialsByItem, setSerialsByItem] = useState<Record<string, NewSerialEntry[]>>({});
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;

    const managedLines = lines.filter(
      (l) => String(l.ManSerNum).toLowerCase() === "y" || String(l.ManSerNum).toLowerCase() === "tyes"
    );
    setItemsToProcess(managedLines);

    let initialIndex = 0;
    if (initialItemCode) {
      const foundIndex = managedLines.findIndex((l) => l.ItemCode === initialItemCode);
      if (foundIndex !== -1) initialIndex = foundIndex;
    }
    setSelectedItemIndex(initialIndex);

    const initialSerials: Record<string, NewSerialEntry[]> = {};
    managedLines.forEach((l) => {
      if (l.SerialNumbers && l.SerialNumbers.length > 0) {
        initialSerials[l.ItemCode] = [...l.SerialNumbers];
      }
    });
    setSerialsByItem(initialSerials);
    setForm(emptyForm);
  }, [open, lines, initialItemCode]);

  const currentItem = itemsToProcess[selectedItemIndex];
  const currentSerials = (currentItem && serialsByItem[currentItem.ItemCode]) || [];

  const handleAdd = () => {
    if (!currentItem) return;

    const serialNumber = form.serialNumber.trim();
    if (!serialNumber) {
      toast.error("Enter a serial number.");
      return;
    }
    if (currentSerials.some((s) => s.InternalSerialNumber === serialNumber)) {
      toast.error(`Serial "${serialNumber}" was already added for this item.`);
      return;
    }

    const requiredQty = Number(currentItem.Quantity) || 0;
    if (currentSerials.length + 1 > requiredQty) {
      toast.error(`Total serial count (${currentSerials.length + 1}) exceeds the required quantity (${requiredQty}).`);
      return;
    }

    const entry: NewSerialEntry = {
      InternalSerialNumber: serialNumber,
      Quantity: 1,
      ...(form.manufacturerSerialNumber && { ManufacturerSerialNumber: form.manufacturerSerialNumber }),
      ...(form.expiryDate && { ExpiryDate: form.expiryDate }),
      ...(form.manufactureDate && { ManufactureDate: form.manufactureDate }),
      ...(form.receptionDate && { ReceptionDate: form.receptionDate }),
      ...(form.warrantyStart && { WarrantyStart: form.warrantyStart }),
      ...(form.warrantyEnd && { WarrantyEnd: form.warrantyEnd }),
      ...(form.location && { Location: form.location }),
      ...(form.notes && { Notes: form.notes }),
    };

    setSerialsByItem((prev) => ({
      ...prev,
      [currentItem.ItemCode]: [...(prev[currentItem.ItemCode] || []), entry],
    }));
    setForm(emptyForm);
  };

  const handleRemove = (serialNumber: string) => {
    if (!currentItem) return;
    setSerialsByItem((prev) => ({
      ...prev,
      [currentItem.ItemCode]: (prev[currentItem.ItemCode] || []).filter((s) => s.InternalSerialNumber !== serialNumber),
    }));
  };

  const handleConfirm = () => {
    for (const item of itemsToProcess) {
      const selected = serialsByItem[item.ItemCode] || [];
      if (selected.length > 0 && selected.length !== Number(item.Quantity)) {
        toast.error(`Serial count for item ${item.ItemCode} (${selected.length}) does not match the required quantity (${item.Quantity}).`);
        return;
      }
    }

    onConfirm({ serials: serialsByItem });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[85vw] w-[85vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border-none shadow-lg">
        <DialogHeader className="p-4 bg-neutral-900 shrink-0">
          <DialogTitle className="text-lg font-bold text-white">Create Serial</DialogTitle>
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
                    const selected = serialsByItem[item.ItemCode] || [];
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
                        <td className="p-3 text-right font-black text-neutral-900">{selected.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-row gap-6 flex-1 min-h-0">
            <div className="flex-[0.7] flex flex-col gap-3 overflow-hidden">
              <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">New Serial</h3>

              <div className="rounded-lg bg-white border border-neutral-200 shadow-sm p-4 grid grid-cols-2 gap-3 overflow-y-auto">
                <div className="col-span-2 grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Serial Number</Label>
                  <Input
                    value={form.serialNumber}
                    onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAdd();
                      }
                    }}
                    placeholder="Serial number"
                  />
                </div>

                <div className="col-span-2 grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Manufacturer Serial No.</Label>
                  <Input
                    value={form.manufacturerSerialNumber}
                    onChange={(e) => setForm((f) => ({ ...f, manufacturerSerialNumber: e.target.value }))}
                    placeholder="Manufacturer serial number"
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
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Manufacture Date</Label>
                  <Input
                    type="date"
                    value={form.manufactureDate}
                    onChange={(e) => setForm((f) => ({ ...f, manufactureDate: e.target.value }))}
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Admission Date</Label>
                  <Input
                    type="date"
                    value={form.receptionDate}
                    onChange={(e) => setForm((f) => ({ ...f, receptionDate: e.target.value }))}
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    placeholder="Location"
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Warranty Start</Label>
                  <Input
                    type="date"
                    value={form.warrantyStart}
                    onChange={(e) => setForm((f) => ({ ...f, warrantyStart: e.target.value }))}
                  />
                </div>

                <div className="grid gap-1">
                  <Label className="text-[10px] font-bold uppercase text-neutral-500">Warranty End</Label>
                  <Input
                    type="date"
                    value={form.warrantyEnd}
                    onChange={(e) => setForm((f) => ({ ...f, warrantyEnd: e.target.value }))}
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
                    Add Serial
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-[0.6] flex flex-col gap-2 overflow-hidden border border-neutral-200 rounded-lg bg-white shadow-sm p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Created Serials</h3>
                <span className="text-base font-black text-blue-600">{currentSerials.length}</span>
              </div>

              <ScrollArea className="rounded-lg bg-white border border-neutral-200 shadow-sm flex-1">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200">
                    <tr className="text-neutral-400">
                      <th className="p-3 text-left w-12 font-bold text-[10px] border-r border-neutral-100">#</th>
                      <th className="p-3 text-left font-bold text-[10px] border-r border-neutral-100">SERIAL NUMBER</th>
                      <th className="w-12 p-3 text-center font-bold text-[10px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {currentSerials.map((s, idx) => (
                      <tr key={s.InternalSerialNumber} className="hover:bg-red-50/30 group cursor-pointer" onClick={() => handleRemove(s.InternalSerialNumber)}>
                        <td className="p-3 text-neutral-600 border-r border-neutral-100 text-center font-medium">{idx + 1}</td>
                        <td className="p-3 font-bold text-neutral-900 border-r border-neutral-100">{s.InternalSerialNumber}</td>
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
