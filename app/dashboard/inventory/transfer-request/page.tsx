"use client"

import { toast } from "sonner";
import { postInventoryTransferRequest, patchInventoryTransferRequest, InventoryTransferPayload } from "@/api+/sap/inventory/inventoryService";
import { z } from "zod";
import { quotationSchema } from "@/lib/schemas/quotationSchema";
import { InvDocumentLayout } from "@/components/Inventory/shared/InvDocumentLayout";
import { InvDocumentHeader } from "@/components/Inventory/shared/InvDocumentHeader";
import { InvDocumentItems } from "@/components/Inventory/shared/InvDocumentItems";
import InvDocumentFooter from "@/components/Inventory/shared/InvDocumentFooter";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadAttachments } from "@/api+/sap/attachments/attachmentService";
import { DocumentType } from "@/types/master/DocumentType";

const schema = quotationSchema.extend({
  CardCode: z.string().optional(),
  CardName: z.string().optional(),
  JournalMemo: z.string().optional(),
  FromWarehouse: z.string().optional(),
  ToWarehouse: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function InvTransferRequestPage() {
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
    TaxDate: "",
    DocumentLines: [],
    FromWarehouse: "",
    ToWarehouse: "",
  }), []);


  const handleSubmit = async (data: FormData) => {
    try {
      const newAttachments = attachments.filter(att => att.File);
      const existingAttachments = attachments.filter(att => !att.File);

      let uploadedAttachments: any[] = [];

      if (newAttachments.length > 0) {
        try {
          const filesToUpload = newAttachments.map(att => att.File as File);

          const uploadResults = await uploadAttachments(filesToUpload, "InventoryTransferRequest");

          toast.success(`${uploadResults.length} attachments uploaded successfully`);

          uploadedAttachments = newAttachments.map((att, index) => ({
            ...att,
            SourcePath: uploadResults[index].path,
          }));

        } catch (error) {
          console.error("Attachment upload failed", error);
          toast.error("Failed to upload attachments");
          return;
        }
      }

      const processedAttachments = [...existingAttachments, ...uploadedAttachments];

      const basePayload: any = {
        Comments: comments,
        JournalMemo: journalMemo,
        Attachments2_Lines: processedAttachments.map((att) => ({
          FileExtension: att.FileName.split('.').pop(),
          FileName: att.FileName.split('.').slice(0, -1).join('.'),
          SourcePath: att.SourcePath,
          FreeText: att.FreeText,
          CopyToTarget: att.CopyToTarget ? "tYES" : "tNO",
        })),
      };

      let result;

      if (DocEntry && DocEntry > 0) {
        result = await patchInventoryTransferRequest(DocEntry, basePayload);
        toast.success(`Inventory Transfer Request updated!`);
      }
      else {
        const payload = {
          ...basePayload,
          CardCode: customer?.CardCode || "",
          FromWarehouse: fromWarehouse || "",
          ToWarehouse: toWarehouse || "",
          StockTransferLines: lines.map((line) => ({
            ItemCode: line.ItemCode,
            Quantity: line.Quantity,
            UnitPrice: line.ItemCost || 0,
            UoMCode: line.UomCode || line.unitMsr || "",
            MeasureUnit: line.unitMsr || line.UomCode || "",
            WarehouseCode: line.WhsCode || toWarehouse || "",
            FromWarehouseCode: line.FromWhsCode || fromWarehouse || "",
            BaseType: line.BaseType ?? null,
            BaseEntry: line.BaseEntry ?? null,
            BaseLine: line.BaseLine ?? null,
          })),
        };

        result = await postInventoryTransferRequest(payload);

        if (result?.DocEntry) {
          toast.success(`Inventory Transfer Request created! #${result.DocNum}`);
        }
      }

      if (result || (DocEntry && DocEntry > 0)) {
        resetStore();
        router.push("/dashboard/inventory/transfer-request");
      } else {
        throw new Error("Failed to process request");
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to create request");
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
