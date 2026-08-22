"use client"

import { toast } from "sonner";
import { postInventoryTransfer, patchInventoryTransfer, InventoryTransferPayload } from "@/api+/sap/inventory/inventoryService";
import { z } from "zod";
import { InvDocumentLayout } from "@/components/Inventory/shared/InvDocumentLayout";
import { InvDocumentHeader } from "@/components/Inventory/shared/InvDocumentHeader";
import { InvDocumentItems } from "@/components/Inventory/shared/InvDocumentItems";
import InvDocumentFooter from "@/components/Inventory/shared/InvDocumentFooter";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { uploadAndPatchAttachments } from "@/api+/sap/attachments/attachmentService";
import { DocumentType } from "@/types/master/DocumentType";
import { buildInventoryTransferPayload, buildInventoryTransferPatchPayload } from "@/lib/sap/helpers/inventoryPayloadHelper";

const inventoryLineSchema = z.object({
  ItemCode: z.string().optional(),
  Dscription: z.string().optional(),
  Quantity: z.number().optional(),
  UoMCode: z.string().optional(),
  unitMsr: z.string().optional(),
  WhsCode: z.string().optional(),
  FromWhsCode: z.string().optional(),
  WarehouseCode: z.string().optional(),
  FromWarehouseCode: z.string().optional(),
  BaseType: z.number().nullable().optional(),
  BaseEntry: z.number().nullable().optional(),
  BaseLine: z.number().nullable().optional(),
});

const schema = z.object({
  CardCode: z.string().optional(),
  CardName: z.string().optional(),
  DocDate: z.string().optional(),
  DocDueDate: z.string().optional(),
  TaxDate: z.string().optional(),
  DocumentLines: z.array(inventoryLineSchema).optional(),
  JournalMemo: z.string().optional(),
  Comments: z.string().optional(),
  FromWarehouse: z.string().optional(),
  ToWarehouse: z.string().optional(),
  DiscountPercent: z.number().optional(),
  Freight: z.number().optional(),
  Rounding: z.number().optional(),
  TotalBeforeDiscount: z.number().optional(),
  TaxTotal: z.number().optional(),
  DocTotal: z.number().optional(),
  BPL_IDAssignedToInvoice: z.number().optional(),
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
    DocEntry,
    attachments,
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
    let result;

    if (DocEntry && DocEntry > 0) {
      // Update: send lines with LineNum for existing, without for new
      const payload = buildInventoryTransferPatchPayload({
        data,
        lines,
        fromWarehouse,
        toWarehouse,
      });
      result = await patchInventoryTransfer(DocEntry, payload);
      toast.success(`Inventory Transfer updated!`);
    }
    else {
      // Create new document
      const payload = buildInventoryTransferPayload({
        data,
        lines,
        fromWarehouse,
        toWarehouse,
      });

      result = await postInventoryTransfer(payload);

      if (result?.IsDraft) {
        toast.success("Inventory Transfer submitted for approval.");
      } else if (result?.DocEntry) {
        toast.success(`Inventory Transfer created! #${result.DocNum}`);
      }
    }

    if (result || (DocEntry && DocEntry > 0)) {
      const savedDocEntry = Number(DocEntry || result?.DocEntry || 0);

      if (savedDocEntry > 0 && attachments.length > 0) {
        const attachmentResult = await uploadAndPatchAttachments(
          attachments,
          "InventoryTransfer",
          savedDocEntry,
          patchInventoryTransfer
        );

        if (attachmentResult.uploadedCount > 0) {
          toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
        }
      }

      resetStore();
      router.push("/dashboard/inventory/transfer");
    } else {
      throw new Error("Failed to process transfer");
    }

  } catch (error: any) {
    toast.error(error.message || "Failed to create transfer");
    throw error;
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
