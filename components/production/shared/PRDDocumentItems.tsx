import { useEffect, useState } from "react";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { Button } from "@/components/ui/button";
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
import { IFPRDDocumentLineRow } from "./PRDDocumentRow";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { usePRDDocConfig } from "./PRDDocumentLayout";


export function PRDDocumentItems() {
  const { watch, register } = useFormContext();
  const selectedCardCode = watch("CardCode");
  const { lines, addLine, customer, warehouses } = useIFPRDDocument();
  const config = usePRDDocConfig();

  // useEffect(() => {
  //   console.log("document items", lines);
  // }, [lines]);

  return (
    <div className="flex flex-col w-full">
      <div className="relative max-w-full border rounded mt-4">
        <div className="overflow-x-auto">
          <Table className="text-xs w-full">
            <TableHeader className="sticky top-0 bg-neutral-900 z-10">
              <TableRow className="border-neutral-600">
                {config.itemColumns.type && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">Type</TableHead>}
                {config.itemColumns.itemCode && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[150px]">Item No</TableHead>}
                {config.itemColumns.itemDescription && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[300px]">Item Description</TableHead>}
                {config.itemColumns.baseQty && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">Base Qty</TableHead>}
                {config.itemColumns.baseRatio && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">Base Ratio</TableHead>}
                {config.itemColumns.plannedQty && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[120px]">Planned Qty</TableHead>}
                {config.itemColumns.issued && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">Issued</TableHead>}
                {config.itemColumns.available && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">Available</TableHead>}
                {config.itemColumns.uomCode && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[100px]">UoM Code</TableHead>}
                {config.itemColumns.warehouse && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[180px]">Warehouse</TableHead>}
                {config.itemColumns.issueMethod && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[150px]">Issue Method</TableHead>}
                {config.itemColumns.actions && <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap min-w-[80px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>

            <TableBody className="text-center">
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={32} className="text-left text-gray-500 py-4">
                    No items added yet.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line, idx) => (
                  <TableRow key={idx}>
                    <IFPRDDocumentLineRow index={idx} line={line} warehouses={warehouses} />
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}


