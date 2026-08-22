"use client"

import { toast } from "sonner";
import { postInventoryTransferRequest, patchInventoryTransferRequest } from "@/api+/sap/inventory/inventoryService";
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
import { buildInventoryTransferRequestPayload, buildInventoryTransferRequestPatchPayload } from "@/lib/sap/helpers/inventoryPayloadHelper";
import { getSapErrorMessage } from "@/lib/errorHelper";

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

export default function InvTransferRequestPage() {
  const router = useRouter();

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
    TaxDate: "",
    DocumentLines: [],
    FromWarehouse: "",
    ToWarehouse: "",
  }), []);

  const handleSubmit = async (data: FormData) => {
    const {
      lines,
      fromWarehouse,
      toWarehouse,
      DocEntry,
      DocNum,
      attachments,
      lastLoadedDocType,
    } = useInventoryDocument.getState();

    try {
      if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.InvTransferReq) {
        const payload = buildInventoryTransferRequestPatchPayload({
          data,
          lines,
          fromWarehouse,
          toWarehouse,
        });

        await patchInventoryTransferRequest(Number(DocEntry), payload);

        if (attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "InventoryTransferRequest",
            Number(DocEntry),
            patchInventoryTransferRequest
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }

        toast.success(`Inventory Transfer Request #${DocNum || DocEntry} updated successfully!`);
        return;
      }

      // Create new document
      const payload = buildInventoryTransferRequestPayload({
        data,
        lines,
        fromWarehouse,
        toWarehouse,
      });

      const result = await postInventoryTransferRequest(payload);

      if (result?.IsDraft) {
        toast.success("Inventory Transfer Request submitted for approval.");
      } else if (result?.DocEntry) {
        if (attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "InventoryTransferRequest",
            Number(result.DocEntry),
            patchInventoryTransferRequest
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        toast.success(`Inventory Transfer Request created! #${result.DocNum || result.DocEntry}`);
      } else {
        throw new Error("Failed to process request");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to process request");
      throw error;
    }
  };

  return (
    <InvDocumentLayout schema={schema} defaultValues={defaultValues} onSubmit={handleSubmit} docType={DocumentType.InvTransferReq}>
      <InvDocumentHeader />
      <InvDocumentItems />
      <InvDocumentFooter />
    </InvDocumentLayout>
  );
}
