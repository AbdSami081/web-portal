"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface Column {
  key: string; 
  label: string; 
}

interface GenericModalProps<T> {
  open: boolean;
  onClose: () => void;
  onSelect: (value: any) => void;
  data: T[];
  columns: Column[];
  title: string;
  getSelectValue?: (item: T) => any;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  multiple?: boolean;
}

type SortDirection = "asc" | "desc" | null;

export function GenericModal<T>({
  open,
  onClose,
  onSelect,
  data,
  columns,
  title,
  getSelectValue,
  onLoadMore,
  hasMore,
  isLoading,
  multiple = false
}: GenericModalProps<T>) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<T | null>(null);
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      if (sortDirection === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filteredData = (Array.isArray(data) ? data : [])
    .filter((item) =>
      columns.some((col) => {
        const val = String((item as any)[col.key] || "").toLowerCase();
        return val.includes(search.toLowerCase());
      })
    )
    .sort((a, b) => {
      if (!sortKey || !sortDirection) return 0;
      const valA = (a as any)[sortKey];
      const valB = (b as any)[sortKey];
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredData.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredData);
    }
  };

  const toggleSelectItem = (item: T) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleChoose = () => {
    if (multiple) {
      if (selectedItems.length > 0) {
        const values = selectedItems.map((item) =>
          getSelectValue ? getSelectValue(item) : (item as any)[columns[0].key]
        );
        onSelect(values);
        onClose();
        setSelectedItems([]);
        setSearch("");
      }
    } else {
      if (selected) {
        const value = getSelectValue ? getSelectValue(selected) : (selected as any)[columns[0].key];
        onSelect(value);
        onClose();
        setSelected(null);
        setSearch("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Input area fixed top */}
        <div className="shrink-0 mt-2">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Main responsive structural box */}
        <div className="flex-1 min-h-0 border rounded-md mt-3 relative flex flex-col bg-white overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-[100] flex items-center justify-center transition-all duration-300">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 animate-spin text-zinc-900 stroke-[1.5]" />
                <span className="text-xs font-semibold tracking-wider text-zinc-700 uppercase">Loading data...</span>
              </div>
            </div>
          )}

          {/* Table Container handles BOTH vertical and horizontal scroll */}
          <div className="flex-1 overflow-auto max-h-full">
            <div className="inline-block min-w-full align-middle">
              <Table className="relative min-w-full border-collapse">
                <TableHeader className="bg-zinc-50 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(228,228,231,1)]">
                  <TableRow>
                    {multiple && (
                      <TableHead className="w-[50px] bg-zinc-50">
                        <Checkbox
                          checked={filteredData.length > 0 && selectedItems.length === filteredData.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead className="w-[60px] bg-zinc-50 text-xs font-semibold">S#</TableHead>
                    {columns.map((col) => (
                      <TableHead
                        key={col.key}
                        className="cursor-pointer select-none px-4 py-3 bg-zinc-50 text-xs font-semibold text-zinc-700 whitespace-nowrap"
                        onClick={() => handleSort(col.key)}
                      >
                        <div className="flex items-center gap-1.5 justify-between">
                          <span>{col.label}</span>
                          <span className="shrink-0">
                            {sortKey === col.key ? (
                              sortDirection === "asc" ? (
                                <ChevronUp className="w-3 h-3 text-zinc-900" />
                              ) : sortDirection === "desc" ? (
                                <ChevronDown className="w-3 h-3 text-zinc-900" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-30" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-30" />
                            )}
                          </span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredData.length === 0 && !isLoading ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + (multiple ? 2 : 1)} className="h-40 text-center text-sm text-zinc-400">
                        No records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, index) => (
                      <TableRow
                        key={index}
                        className={`cursor-pointer transition-colors ${
                          multiple
                            ? selectedItems.includes(item)
                              ? "bg-zinc-100/70 hover:bg-zinc-100"
                              : "hover:bg-zinc-50"
                            : selected === item
                            ? "bg-zinc-100 hover:bg-zinc-100"
                            : "hover:bg-zinc-50"
                        }`}
                        onClick={() => (multiple ? toggleSelectItem(item) : setSelected(item))}
                        onDoubleClick={!multiple ? handleChoose : undefined}
                      >
                        {multiple && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedItems.includes(item)}
                              onCheckedChange={() => toggleSelectItem(item)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="text-zinc-500 font-mono text-xs">{index + 1}</TableCell>
                        {columns.map((col) => {
                          const rawVal = col.key === "index"
                            ? index + 1
                            : (item as any)[col.key] ?? (item as any)[col.key.charAt(0).toLowerCase() + col.key.slice(1)] ?? (item as any)[col.key.toUpperCase()] ?? "";

                          const displayVal = typeof rawVal === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(rawVal)
                            ? rawVal.split('T')[0]
                            : (typeof rawVal === 'object' && rawVal !== null) 
                              ? JSON.stringify(rawVal) 
                              : String(rawVal);

                          return (
                            <TableCell key={col.key} className="px-4 py-2.5 text-xs text-zinc-700 whitespace-nowrap max-w-xs truncate">
                              {displayVal}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Load More section fixed at the bottom inside the frame */}
          {hasMore && (
            <div className="p-2 text-center border-t bg-zinc-50 shrink-0 sticky bottom-0 z-20">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-zinc-900 hover:bg-zinc-200 h-8 text-xs font-medium"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? "Loading dynamic data..." : "Load More"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 shrink-0 flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="button" size="sm" onClick={handleChoose} disabled={multiple ? selectedItems.length === 0 : !selected}>
            Choose Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}