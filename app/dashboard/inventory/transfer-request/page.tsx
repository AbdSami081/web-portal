"use client"

import { toast } from "sonner";
import { postInventoryTransferRequest, InventoryTransferPayload, InventoryTransferLine, postInventoryTransfer } from "@/api+/sap/inventory/inventoryService";
import { z } from "zod";
import { QuotationFormData, quotationSchema } from "@/lib/schemas/quotationSchema";
import { InvDocumentLayout, useInvDocConfig } from "@/components/Inventory/shared/InvDocumentLayout";
import { InvDocumentHeader } from "@/components/Inventory/shared/InvDocumentHeader";
import { InvDocumentItems } from "@/components/Inventory/shared/InvDocumentItems";
import InvDocumentFooter from "@/components/Inventory/shared/InvDocumentFooter";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { useFormContext } from "react-hook-form";
import { useMemo, useState } from "react";
import { DocumentType } from "@/types/sales/salesDocuments.type";

const inventoryTransferSchema = quotationSchema.extend({
  JournalMemo: z.string().optional(),
  FromWarehouse: z.string().optional(),
  ToWarehouse: z.string().optional(),
});

type InventoryTransferFormData = z.infer<typeof inventoryTransferSchema>;

export default function InvTransferRequestPage() {
  const { lines } = useInventoryDocument();

  const defaultValues: InventoryTransferFormData = useMemo(() => ({
    CardCode: "",
    CardName: "",
    DocDate: new Date().toISOString().split("T")[0],
    DocDueDate: new Date().toISOString().split("T")[0],
    DiscountPercent: 0,
    Freight: 0,
    Rounding: 0,
    Comments: "",
    JournalMemo: "",
    TotalBeforeDiscount: 0,
    TaxTotal: 0,
    DocTotal: 0,
    TaxDate: "",
    DocumentLines: [],
    FromWarehouse: "",
    ToWarehouse: "",
  }), []);

  const handleSubmit = async (data: InventoryTransferFormData) => {
    try {
      const currentLines = lines.length > 0 ? lines : data.DocumentLines;


      const payload: InventoryTransferPayload = {
        CardCode: data.CardCode,
        Comments: data.Comments,
        JournalMemo: data.JournalMemo,
        FromWarehouse: data.FromWarehouse || "",
        ToWarehouse: data.ToWarehouse || "",
        StockTransferLines: currentLines.map((line: any) => ({
          ItemCode: line.ItemCode,
          Quantity: line.Quantity,
          UnitPrice: line.ItemCost || line.Price || 0,
          WarehouseCode: line.WhsCode || data.ToWarehouse || "",
          FromWarehouseCode: line.FromWhsCode || data.FromWarehouse || "",
          BaseType: line.BaseType,
          BaseEntry: line.BaseEntry,
          BaseLine: line.BaseLine
        }))
      };

      const result = await postInventoryTransferRequest(payload);

      toast.success(`Inventory Transfer Request created successfully! DocEntry: ${result.DocEntry}`);

    } catch (error: any) {
      console.error("Error while creating quotation:", error);
      toast.error(error.message || "Failed to create request");
    }
  };

  return (
    <InvDocumentLayout
      schema={inventoryTransferSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={1250000001}
    >
      <InvDocumentHeader />
      <InvDocumentItems />
      <InvDocumentFooter />
    </InvDocumentLayout>
  );
}
