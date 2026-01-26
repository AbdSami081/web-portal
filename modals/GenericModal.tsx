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
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

interface Column {
  key: string; // object key
  label: string; // column display name
}

interface GenericModalProps<T> {
  open: boolean;
  onClose: () => void;
  onSelect: (value: T) => void;
  data: T[];
  columns: Column[];
  title: string;
  getSelectValue?: (item: T) => any;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
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
  isLoading
}: GenericModalProps<T>) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<T | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      // toggle sort direction
      setSortDirection(sortDirection === "asc" ? "desc" : sortDirection === "desc" ? null : "asc");
      if (sortDirection === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const filteredData = data
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

  const handleChoose = () => {
    if (selected) {
      const value = getSelectValue ? getSelectValue(selected) : (selected as any)[columns[0].key];
      onSelect(value);
      onClose();
      setSelected(null);
      setSearch("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full"
        />

        <div className="max-h-60 overflow-y-auto border rounded">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className="cursor-pointer select-none"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{col.label}</span>
                      <span className="ml-1">
                        {sortKey === col.key ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : sortDirection === "desc" ? (
                            <ChevronDown className="w-3 h-3" />
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
              {filteredData.map((item, index) => (
                <TableRow
                  key={index}
                  className={`cursor-pointer ${selected === item ? "bg-blue-100" : ""
                    }`}
                  onClick={() => setSelected(item)}
                  onDoubleClick={handleChoose}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>{(item as any)[col.key]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {hasMore && (
            <div className="p-2 text-center border-t">
              <Button
                variant="ghost"
                className="w-full text-blue-600 h-8 text-xs"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleChoose} disabled={!selected}>Choose</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
