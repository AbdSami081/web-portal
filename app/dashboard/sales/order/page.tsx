"use client"
import DocumentFooter from "@/components/sales/shared/DocumentFooter";
import { DocumentHeader } from "@/components/sales/shared/DocumentHeader";
import { DocumentItems } from "@/components/sales/shared/DocumentItems";
import { SalesDocumentLayout } from "@/components/sales/shared/SalesDocumentLayout";

import { useRouter } from "next/navigation";
import {
  QuotationFormData,
  quotationSchema,
} from "@/lib/schemas/quotationSchema";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { uploadAndPatchAttachments } from "@/api+/sap/attachments/attachmentService";
import { postSalesOrder, patchSalesOrder } from "@/api+/sap/sales/salesService";
import { toast } from "sonner";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { buildSalesDocumentPayload, buildSalesDocumentPatchPayload } from "@/lib/sap/helpers/salesPayloadHelper";
import { DocumentType } from "@/types/master/DocumentType";

export default function OrderPage() {
  const router = useRouter();

  const defaultValues: QuotationFormData = {
    CardCode: "",
    CardName: "",
    DocDate: new Date().toISOString().split("T")[0],
    DocDueDate: new Date().toISOString().split("T")[0],
    DiscountPercent: 0,
    Freight: 0,
    Rounding: 0,
    Comments: "",
    TotalBeforeDiscount: 0,
    TaxTotal: 0,
    DocTotal: 0,
    TaxDate: "",
    DocumentLines: [],
  };

  const handleSubmit = async (data: QuotationFormData) => {
    const { lines, DocEntry, lastLoadedDocType, attachments, discountPercent, freight, additionalExpenses } = useSalesDocument.getState();

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.Order) {
      const payload = buildSalesDocumentPatchPayload({
        data,
        lines,
        discountPercent,
        freight,
        additionalExpenses,
      });

      try {
        await patchSalesOrder(Number(DocEntry), payload);
        if (attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "SalesOrder",
            Number(DocEntry),
            patchSalesOrder
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        const docNum = useSalesDocument.getState().DocNum;
        toast.success(`Sales Order #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update Sales Order");
      }
      return;
    }

    const payload = buildSalesDocumentPayload({
      data,
      lines,
      docEntry: DocEntry,
      lastLoadedDocType,
      targetDocType: DocumentType.Order,
      discountPercent,
      freight,
      additionalExpenses,
    });

    try {
      const response = await postSalesOrder(payload);

      if (response?.DocEntry || response?.IsDraft) {
        // When an approval process applies, SAP creates a DRAFT and the approval request
        // natively - the document is not final yet, so skip attachment upload.
        if (attachments.length > 0 && !response?.IsDraft) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "SalesOrder",
            Number(response.DocEntry),
            patchSalesOrder
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        if (response?.IsDraft) {
          toast.success("Sales Order submitted for approval.");
        } else {
          toast.success(`Sales Order #${response.DocNum} created successfully!`);
        }
      } else {
        throw new Error("Failed to create Sales Order");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create Sales Order. Please try again.");
      throw error;
    }
  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.Order}
    >
      <DocumentHeader />
      <DocumentItems />
      <UDFLayout docType={DocumentType.Order} />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
