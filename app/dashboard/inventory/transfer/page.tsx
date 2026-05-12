"use client"

import { toast } from "sonner";
import { postInventoryTransfer, patchInventoryTransfer, InventoryTransferPayload } from "@/api+/sap/inventory/inventoryService";
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
    const newAttachments = attachments.filter(att => att.File);
    const existingAttachments = attachments.filter(att => !att.File);

    let uploadedAttachments: any[] = [];

    if (newAttachments.length > 0) {
      try {
        const filesToUpload = newAttachments.map(att => att.File as File);

        const uploadResults = await uploadAttachments(filesToUpload, "InventoryTransfer");

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
      result = await patchInventoryTransfer(DocEntry, basePayload);
      toast.success(`Inventory Transfer updated!`);
    }
    else {
      const payload = {
        ...basePayload,
        CardCode: customer?.CardCode || "",
        FromWarehouse: fromWarehouse || "",
        ToWarehouse: toWarehouse || "",
        StockTransferLines: lines.map((line) => {
          const item: any = {
            ItemCode: line.ItemCode,
            Quantity: line.Quantity,
            UnitPrice: line.ItemCost || 0,
            WarehouseCode: line.WhsCode || toWarehouse || "",
            FromWarehouseCode: line.FromWhsCode || fromWarehouse || "",
          };

          if (line.BaseType !== undefined && line.BaseType !== -1)
            item.BaseType = line.BaseType;

          if (line.BaseEntry !== undefined && line.BaseEntry !== -1)
            item.BaseEntry = line.BaseEntry;

          if (line.BaseLine !== undefined && line.BaseLine !== -1)
            item.BaseLine = line.BaseLine;

          return item;
        }),
      };

      result = await postInventoryTransfer(payload);

      if (result?.DocEntry) {
        toast.success(`Inventory Transfer created! #${result.DocNum}`);
      }
    }

    if (result || (DocEntry && DocEntry > 0)) {
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
