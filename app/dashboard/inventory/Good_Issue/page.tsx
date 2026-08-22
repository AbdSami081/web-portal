"use client"

import { toast } from "sonner";
import { postGoodIssue, patchGoodIssue } from "@/api+/sap/inventory/inventoryService";
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
import { buildGoodIssuePayload, buildGoodIssuePatchPayload } from "@/lib/sap/helpers/inventoryPayloadHelper";

const InventoryGenLineSchema = z.object({
  ItemCode: z.string(),
  Quantity: z.number(),
  WarehouseCode: z.string().optional(),

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
  DocumentLines: z.array(InventoryGenLineSchema).optional(),
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
});

type FormData = z.infer<typeof schema>;

export default function InvTransferPage() {
  const router = useRouter();
  const {
    lines,
    reset: resetStore,
    fromWarehouse,
    toWarehouse,
    series,
    priceList,
    postingDate,
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
    Series: series || "",
    PriceList: priceList || "",
    PostingDate: postingDate || "",
  }), []);

  const handleSubmit = async (data: FormData) => {
    try {
      let result;

      if (DocEntry && DocEntry > 0) {
        const payload = buildGoodIssuePatchPayload({
          data,
          lines,
        });
        result = await patchGoodIssue(DocEntry, payload);
        toast.success(`Good Issue updated!`);
      } else {
        const payload = buildGoodIssuePayload({
          data,
          lines,
        });

        console.log("Good Issue Result:", payload);
        result = await postGoodIssue(payload);

        
        if (result?.IsDraft) {
          toast.success("Good Issue submitted for approval.");
        } else if (result?.DocEntry) {
          toast.success(`Good Issue created! #${result.DocNum || result.DocEntry}`);
        }
      }

      if (result || (DocEntry && DocEntry > 0)) {
        const savedDocEntry = Number(DocEntry || result?.DocEntry || 0);

        if (savedDocEntry > 0 && attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "GoodIssue",
            savedDocEntry,
            patchGoodIssue
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        resetStore();
        router.push("/dashboard/inventory/Good_Issue");
      } else {
        throw new Error("Failed to process good issue");
      }

    } catch (error: any) {
      toast.error(error.message || "Failed to create Good Issue");
      throw error;
    }
  };

  return (
    <InvDocumentLayout schema={schema} defaultValues={defaultValues} onSubmit={handleSubmit} docType={DocumentType.GoodIssue}>
      <InvDocumentHeader />
      <InvDocumentItems />
      <InvDocumentFooter />
    </InvDocumentLayout>
  );
}
