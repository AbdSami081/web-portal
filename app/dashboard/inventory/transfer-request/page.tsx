"use client"

import { toast } from "sonner";
import { postInventoryTransferRequest, patchInventoryTransferRequest, InventoryTransferPayload } from "@/api+/sap/inventory/inventoryService";
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


  const buildTransferRequestLinePayload = (line: any) => {
    const item: any = {
      ItemCode: line.ItemCode,
      Quantity: line.Quantity,
      UnitPrice: line.ItemCost || 0,
      UoMCode: line.UoMCode || line.unitMsr || "",
      MeasureUnit: line.unitMsr || line.UoMCode || "",
      WarehouseCode: line.WhsCode || toWarehouse || "",
      FromWarehouseCode: line.FromWhsCode || fromWarehouse || "",
    };

    if (line.BaseType !== undefined && line.BaseType !== null && line.BaseType !== -1) {
      item.BaseType = line.BaseType;
    }

    if (line.BaseEntry !== undefined && line.BaseEntry !== null && line.BaseEntry !== -1) {
      item.BaseEntry = line.BaseEntry;
    }

    if (line.BaseLine !== undefined && line.BaseLine !== null && line.BaseLine !== -1) {
      item.BaseLine = line.BaseLine;
    }

    return item;
  };

  const handleSubmit = async (data: FormData) => {
    try {
      const basePayload: any = {
        Comments: comments,
        JournalMemo: journalMemo,
      };

      let result;

      if (DocEntry && DocEntry > 0) {
        const mappedLines = lines.map(buildTransferRequestLinePayload);
        const payload = {
          ...basePayload,
          CardCode: customer?.CardCode || "",
          FromWarehouse: fromWarehouse || "",
          ToWarehouse: toWarehouse || "",
          StockTransferLines: mappedLines,
          DocumentLines: mappedLines,
        };

        result = await patchInventoryTransferRequest(DocEntry, payload);
        toast.success(`Inventory Transfer Request updated!`);
      }
      else {
        const payload = {
          ...basePayload,
          CardCode: customer?.CardCode || "",
          FromWarehouse: fromWarehouse || "",
          ToWarehouse: toWarehouse || "",
          StockTransferLines: lines.map(buildTransferRequestLinePayload),
        };

        result = await postInventoryTransferRequest(payload);

        if (result?.IsDraft) {
          toast.success("Inventory Transfer Request submitted for approval.");
        } else if (result?.DocEntry) {
          toast.success(`Inventory Transfer Request created! #${result.DocNum}`);
        }
      }

      if (result || (DocEntry && DocEntry > 0)) {
        const savedDocEntry = Number(DocEntry || result?.DocEntry || 0);

        if (savedDocEntry > 0 && attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "InventoryTransferRequest",
            savedDocEntry,
            patchInventoryTransferRequest
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }

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
