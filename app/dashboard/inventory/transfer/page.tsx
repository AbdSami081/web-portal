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
import { useMemo } from "react";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { useRouter } from "next/navigation";

const inventoryTransferSchema = quotationSchema.extend({
  JournalMemo: z.string().optional(),
  FromWarehouse: z.string().optional(),
  ToWarehouse: z.string().optional(),
});

type InventoryTransferFormData = z.infer<typeof inventoryTransferSchema>;

export default function InvTransferPage() {
  const router = useRouter();
  const { lines, reset: resetStore, DocEntry, lastLoadedDocType } = useInventoryDocument();

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
      const payload: InventoryTransferPayload = {
        CardCode: data.CardCode,
        Comments: data.Comments,
        JournalMemo: data.JournalMemo,
        FromWarehouse: data.FromWarehouse || "",
        ToWarehouse: data.ToWarehouse || "",
        StockTransferLines: lines.map((line: any) => {
          const lineData: any = {
            ItemCode: line.ItemCode,
            Quantity: line.Quantity,
            UnitPrice: line.ItemCost || line.Price || 0,
            WarehouseCode: line.WhsCode || data.ToWarehouse || "",
            FromWarehouseCode: line.FromWhsCode || data.FromWarehouse || "",
          };

          if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType === DocumentType.InvTransferReq) {
            lineData.BaseType = DocumentType.InvTransferReq;
            lineData.BaseEntry = DocEntry;
            lineData.BaseLine = line.LineNum;
          } else {
            lineData.BaseType = -1;
            lineData.BaseEntry = null;
            lineData.BaseLine = null;
          }
          return lineData;
        })
      };

      const result = await postInventoryTransfer(payload);
      if (result?.DocEntry) {
        toast.success(`Inventory Transfer created successfully! DocEntry: ${result.DocEntry}`);
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
    <InvDocumentLayout
      schema={inventoryTransferSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.InvTransfer}
    >
      <InvDocumentHeader />
      <InvDocumentItems />
      <InvDocumentFooter />
    </InvDocumentLayout>
  );
}
