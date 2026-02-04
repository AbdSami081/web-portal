"use client"

import { toast } from "sonner";
import { postInventoryTransfer, InventoryTransferPayload } from "@/api+/sap/inventory/inventoryService";
import { z } from "zod";
import { QuotationFormData, quotationSchema } from "@/lib/schemas/quotationSchema";
import { InvDocumentLayout } from "@/components/Inventory/shared/InvDocumentLayout";
import { InvDocumentHeader } from "@/components/Inventory/shared/InvDocumentHeader";
import { InvDocumentItems } from "@/components/Inventory/shared/InvDocumentItems";
import InvDocumentFooter from "@/components/Inventory/shared/InvDocumentFooter";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { useMemo } from "react";

const inventoryTransferSchema = quotationSchema.extend({
  JournalMemo: z.string().optional(),
  FromWarehouse: z.string().optional(),
  ToWarehouse: z.string().optional(),
});

type InventoryTransferFormData = z.infer<typeof inventoryTransferSchema>;

export default function InvTransferPage() {
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
    TaxDate: new Date().toISOString().split("T")[0],
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

      const result = await postInventoryTransfer(payload);
      toast.success(`Inventory Transfer created successfully! DocEntry: ${result.DocEntry}`);

    } catch (error: any) {
      console.error("Error while creating inventory transfer:", error);
      toast.error(error.message || "Failed to create transfer");
    }
  };

  return (
    <InvDocumentLayout
      schema={inventoryTransferSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={67}
    >
      <InvDocumentHeader />
      <InvDocumentItems />
      <InvDocumentFooter />
    </InvDocumentLayout>
  );
}
