"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  rows: Record<string, unknown>[];
  columns: string[];
  targetField: string;
  onSelect: (value: string) => void;
}

const FMSSelectionModal: React.FC<Props> = ({
  open,
  onClose,
  rows,
  columns,
  targetField,
  onSelect,
}) => {
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const lower = search.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((v) => String(v ?? "").toLowerCase().includes(lower))
    );
  }, [rows, search]);

  const handleSelect = (row: Record<string, unknown>) => {
    const firstValue = columns.length > 0 ? String(row[columns[0]] ?? "") : "";
    onSelect(firstValue);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="text-base font-semibold">
            Select Value for <span className="text-blue-600">{targetField}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Click a row to fill the field.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="px-4 py-2 border-b bg-slate-50">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2 text-left font-medium whitespace-nowrap border-b text-xs"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center py-8 text-muted-foreground text-xs"
                  >
                    No results found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, i) => (
                  <tr
                    key={i}
                    onClick={() => handleSelect(row)}
                    className="cursor-pointer hover:bg-blue-50 border-b border-slate-100 transition-colors"
                  >
                    {columns.map((col) => (
                      <td key={col} className="px-3 py-1.5 whitespace-nowrap text-xs">
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t bg-slate-50 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {filteredRows.length} of {rows.length} record{rows.length !== 1 ? "s" : ""}
          </span>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 text-xs">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FMSSelectionModal;
