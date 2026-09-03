"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Column = {
  key: string;
  title: string;
  width?: number;
  className?: string;
};

type Props<T> = {
  columns: Column[];
  data: T[];

  renderRow: (row: T, index: number) => React.ReactNode;

  emptyMessage?: string;

  onRowContextMenu?: (
    e: React.MouseEvent,
    row: T
  ) => void;

  rowClassName?: (row: T, index: number) => string;
};

export function ResizableTable<T>({
  columns,
  data,
  renderRow,
  emptyMessage = "No data found",
  onRowContextMenu,
  rowClassName,
}: Props<T>) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () =>
      columns.reduce((acc, col) => {
        acc[col.key] = col.width || 180;
        return acc;
      }, {} as Record<string, number>)
  );

  const columnSignature = useMemo(
    () =>
      columns
        .map((col) => `${col.key}:${col.width || 180}`)
        .join("|"),
    [columns]
  );

  useEffect(() => {
    setColumnWidths((prev) =>
      columns.reduce((acc, col) => {
        acc[col.key] = prev[col.key] || col.width || 180;
        return acc;
      }, {} as Record<string, number>)
    );
  }, [columnSignature]);

  const tableWidth = useMemo(
    () =>
      columns.reduce(
        (total, col) =>
          total +
          (columnWidths[col.key] || col.width || 180),
        0
      ),
    [columns, columnWidths]
  );

  const startResize = (
    e: React.MouseEvent,
    key: string
  ) => {
    e.preventDefault();

    const startX = e.clientX;
    const startWidth = columnWidths[key];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth =
        startWidth + (moveEvent.clientX - startX);

      setColumnWidths((prev) => ({
        ...prev,
        [key]: Math.max(newWidth, 80),
      }));
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div className="resizable-table overflow-auto w-full max-w-full min-w-0">
      <Table
        className="table-fixed text-xs"
        style={{ minWidth: tableWidth }}
      >
        <colgroup>
          {columns.map((col) => (
            <col
              key={col.key}
              style={{ width: columnWidths[col.key] }}
            />
          ))}
        </colgroup>

        <TableHeader className="sticky top-0 bg-neutral-900 z-10">
          <TableRow className="border-neutral-700">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                data-fms-field={col.key}
                className={`relative whitespace-nowrap border-r border-neutral-700 px-4 py-2 text-gray-300 ${
                  col.className || ""
                }`}
              >
                <div className="pr-2">{col.title}</div>

                <div
                  onMouseDown={(e) => startResize(e, col.key)}
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-white/30"
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-4 text-left text-gray-500"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, index) => (
              <TableRow
                key={index}
                onContextMenu={(e) =>
                  onRowContextMenu?.(e, row)
                }
                className={rowClassName?.(row, index)}
              >
                {renderRow(row, index)}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}