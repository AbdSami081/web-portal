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


export function PRDDocumentItems() {
  const { watch, register } = useFormContext();
  const selectedCardCode = watch("CardCode");
  const { lines, addLine, customer } = useIFPRDDocument();


  // useEffect(() => {
  //   console.log("document items", lines);
  // }, [lines]);

  return (
    <div className="grid overflow-x-auto w-full">

      <Tabs defaultValue="content" className="w-full pt-4">
        <TabsList className="mb-4">
          <TabsTrigger value="content" className="data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent">Content</TabsTrigger>
          <TabsTrigger value="Attachments" className="data-[state=active]:bg-primary dark:data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <div className="relative max-w-full border rounded">
            <div className={`min-w-max overflow-x-auto `}>
              <Table className="text-xs w-max">
              <TableHeader className="sticky top-0 bg-neutral-900 z-10">
                <TableRow className="border-neutral-600">
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Type</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Item No</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Item Description</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Quantity</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Whse</TableHead>
                  <TableHead className="text-gray-300 px-4 py-2 whitespace-nowrap">Actions</TableHead>
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
                        <IFPRDDocumentLineRow index={idx} line={line} />
                      </TableRow>
                    ))
                  )}
                </TableBody>

              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="Attachments">
          <div className={`grid grid-cols-2 gap-4 p-5 rounded `}>

          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}


