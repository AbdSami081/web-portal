"use client"

import { toast } from "sonner";
import { postInventoryTransfer, InventoryTransferPayload } from "@/api+/sap/inventory/inventoryService";
import { z } from "zod";
import { quotationSchema } from "@/lib/schemas/quotationSchema";
import { InvDocumentLayout } from "@/components/Inventory/shared/InvDocumentLayout";
import { InvDocumentHeader } from "@/components/Inventory/shared/InvDocumentHeader";
import { InvDocumentItems } from "@/components/Inventory/shared/InvDocumentItems";
import InvDocumentFooter from "@/components/Inventory/shared/InvDocumentFooter";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { useMemo, useEffect } from "react";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { useRouter } from "next/navigation";

const schema = quotationSchema.extend({
  CardCode: z.string().optional(),
  CardName: z.string().optional(),
  JournalMemo: z.string().optional(),
  FromWarehouse: z.string().optional(),
  ToWarehouse: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function InvTransferPage() {
  const router = useRouter();
  const {
    lines,
    reset: resetStore,
    fromWarehouse,
    toWarehouse,
    comments,
    journalMemo,
    customer,
  } = useInventoryDocument();

  const defaultValues: FormData = useMemo(() => ({
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

  const handleSubmit = async (data: FormData) => {
    try {
      const payload: InventoryTransferPayload = {
        CardCode: customer?.CardCode || "",
        Comments: comments,
        JournalMemo: journalMemo,
        FromWarehouse: fromWarehouse || "",
        ToWarehouse: toWarehouse || "",
        StockTransferLines: lines.map((line) => ({
          ItemCode: line.ItemCode,
          Quantity: line.Quantity,
          UnitPrice: line.ItemCost || 0,
          WarehouseCode: line.WhsCode || toWarehouse || "",
          FromWarehouseCode: line.FromWhsCode || fromWarehouse || "",
          BaseType: line.BaseType ?? -1,
          BaseEntry: line.BaseEntry ?? null,
          BaseLine: line.BaseLine ?? null,
        })),
      };

      const result = await postInventoryTransfer(payload);
      if (result?.DocEntry) {
        toast.success(`Inventory Transfer created! DocEntry: ${result.DocEntry}`);
        resetStore();
        router.push("/dashboard/inventory/transfer");
      } else {
        throw new Error("Failed to create transfer");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create transfer");
    }
  };

  return (
    <InvDocumentLayout schema={schema} defaultValues={defaultValues} onSubmit={handleSubmit} docType={DocumentType.InvTransfer}>
      <InvDocumentHeader />
      <InvDocumentItems />
      <InvDocumentFooter />
    </InvDocumentLayout>
  );
}
