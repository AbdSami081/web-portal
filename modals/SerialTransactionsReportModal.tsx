"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface SerialEntry {
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

interface ReportLine {
  ItemCode: string;
  ItemName?: string;
  ItemDescription?: string;
  WarehouseCode?: string;
  SerialNumbers?: SerialEntry[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  line: ReportLine | null;
  docNum?: string | number;
  docDate?: string;
  cardName?: string;
  direction?: "In" | "Out";
}

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.${yy}`;
}

export function SerialTransactionsReportModal({ open, onClose, line, docNum, docDate, cardName, direction = "In" }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (open) setSelectedIndex(0);
  }, [open, line]);

  const serials = line?.SerialNumbers || [];
  const selectedSerial = serials[selectedIndex];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[85vw] w-[85vw] h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white border-none shadow-lg">
        <DialogHeader className="p-4 bg-neutral-900 shrink-0">
          <DialogTitle className="text-lg font-bold text-white">Serial Number Transactions Report</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-white">
          <div className="flex flex-col gap-2 shrink-0">
            <h3 className="text-sm font-semibold text-neutral-800">Serial Numbers</h3>
            <div className="rounded-lg bg-white border border-neutral-200 shadow-sm max-h-[200px] overflow-y-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200">
                  <tr className="text-neutral-400">
                    <th className="p-3 text-left w-12 font-bold uppercase text-[10px] border-r border-neutral-100">#</th>
                    <th className="p-3 text-left w-[150px] font-bold uppercase text-[10px] border-r border-neutral-100">Item No.</th>
                    <th className="p-3 text-left font-bold uppercase text-[10px] border-r border-neutral-100">Item Description</th>
                    <th className="p-3 text-left w-28 font-bold uppercase text-[10px] border-r border-neutral-100">Mfr Serial No.</th>
                    <th className="p-3 text-left w-28 font-bold uppercase text-[10px] border-r border-neutral-100">Serial Number</th>
                    <th className="p-3 text-left w-28 font-bold uppercase text-[10px] border-r border-neutral-100">Expiry Date</th>
                    <th className="p-3 text-left w-28 font-bold uppercase text-[10px] border-r border-neutral-100">Mfg Date</th>
                    <th className="p-3 text-left w-28 font-bold uppercase text-[10px]">Admission Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {serials.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-neutral-400 text-xs">No serial numbers assigned to this line.</td>
                    </tr>
                  )}
                  {serials.map((s, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <tr
                        key={s.InternalSerialNumber}
                        className={`cursor-pointer transition-all duration-200 ${isSelected ? "bg-neutral-100 shadow-inner" : "hover:bg-neutral-50/50"}`}
                        onClick={() => setSelectedIndex(idx)}
                      >
                        <td className="p-3 text-neutral-600 border-r border-neutral-100 text-center font-medium">{idx + 1}</td>
                        <td className="p-3 font-bold text-neutral-900 border-r border-neutral-100">{line?.ItemCode}</td>
                        <td className="p-3 text-neutral-600 font-medium border-r border-neutral-100">{line?.ItemName || line?.ItemDescription || ""}</td>
                        <td className="p-3 text-neutral-500 border-r border-neutral-100">{s.ManufacturerSerialNumber || ""}</td>
                        <td className="p-3 font-bold text-neutral-800 border-r border-neutral-100 flex items-center gap-1">
                          <ChevronRight className="h-3 w-3 text-emerald-500" />
                          {s.InternalSerialNumber}
                        </td>
                        <td className="p-3 text-neutral-500 border-r border-neutral-100">{formatDate(s.ExpiryDate)}</td>
                        <td className="p-3 text-neutral-500 border-r border-neutral-100">{formatDate(s.ManufactureDate)}</td>
                        <td className="p-3 text-neutral-500">{formatDate(s.ReceptionDate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <h3 className="text-sm font-semibold text-neutral-800">
              Transactions for Serial Number{selectedSerial ? `: ${selectedSerial.InternalSerialNumber}` : ""}
            </h3>
            <div className="rounded-lg bg-white border border-neutral-200 shadow-sm flex-1 overflow-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200">
                  <tr className="text-neutral-400">
                    <th className="p-3 text-left w-12 font-bold uppercase text-[10px] border-r border-neutral-100">#</th>
                    <th className="p-3 text-left w-28 font-bold uppercase text-[10px] border-r border-neutral-100">Document</th>
                    <th className="p-3 text-left w-24 font-bold uppercase text-[10px] border-r border-neutral-100">Date</th>
                    <th className="p-3 text-left w-20 font-bold uppercase text-[10px] border-r border-neutral-100">Whse</th>
                    <th className="p-3 text-left font-bold uppercase text-[10px] border-r border-neutral-100">G/L Acct/BP Name</th>
                    <th className="p-3 text-right w-24 font-bold uppercase text-[10px] border-r border-neutral-100">Qty</th>
                    <th className="p-3 text-center w-20 font-bold uppercase text-[10px]">Direction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {!selectedSerial ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-neutral-400 text-xs">Select a serial number above to view its transactions.</td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="p-3 text-neutral-600 border-r border-neutral-100 text-center font-medium">1</td>
                      <td className="p-3 font-bold text-neutral-900 border-r border-neutral-100">{docNum ? `PD ${docNum}` : ""}</td>
                      <td className="p-3 text-neutral-500 border-r border-neutral-100">{formatDate(docDate)}</td>
                      <td className="p-3 text-neutral-500 border-r border-neutral-100">{line?.WarehouseCode || ""}</td>
                      <td className="p-3 text-neutral-600 border-r border-neutral-100">{cardName || ""}</td>
                      <td className="p-3 text-right font-semibold border-r border-neutral-100">{Number(selectedSerial.Quantity ?? 1).toFixed(3)}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${direction === "In" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                          {direction}
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 bg-neutral-50 shrink-0 border-t border-neutral-100 flex items-center justify-end">
          <Button variant="outline" className="h-11 px-10 font-bold text-xs uppercase" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
