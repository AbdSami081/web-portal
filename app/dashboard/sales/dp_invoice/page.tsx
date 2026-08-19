"use client";

import DocumentFooter from "@/components/sales/shared/DocumentFooter";
import { DocumentHeader } from "@/components/sales/shared/DocumentHeader";
import { DocumentItems } from "@/components/sales/shared/DocumentItems";
import { SalesDocumentLayout } from "@/components/sales/shared/SalesDocumentLayout";
import { QuotationFormData, quotationSchema } from "@/lib/schemas/quotationSchema";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { postDelivery, patchDeliveryNote } from "@/api+/sap/sales/salesService";
import { toast } from "sonner";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { buildSalesDocumentPayload, buildSalesDocumentPatchPayload } from "@/lib/sap/helpers/salesPayloadHelper";
import { DocumentType } from "@/types/master/DocumentType";
import { uploadAndPatchAttachments } from "@/api+/sap/attachments/attachmentService";
import { UDFLayout } from "@/components/shared/UDFSheet";

export default function ARDownPaymentInvoicePage() {
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

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.DownPaymentInvoice) {
      const patchPayload = buildSalesDocumentPatchPayload({
        data,
        lines,
        discountPercent,
        freight,
        additionalExpenses,
      });

      try {
        await patchDeliveryNote(Number(DocEntry), patchPayload);
        if (attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "DownPaymentInvoice",
            Number(DocEntry),
            patchDeliveryNote
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        const docNum = useSalesDocument.getState().DocNum;
        toast.success(`A/R Down Payment Invoice #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        const message = getSapErrorMessage(error);
        toast.error(message || "Failed to update A/R Down Payment Invoice");
        throw error;
      }
      return;
    }

    const payload = buildSalesDocumentPayload({
      data,
      lines,
      docEntry: DocEntry,
      lastLoadedDocType,
      targetDocType: DocumentType.DownPaymentInvoice,
      discountPercent,
      freight,
      additionalExpenses,
    });

    try {
      const response = await postDelivery(payload);
      if (response?.DocEntry || response?.IsDraft) {
        if (attachments.length > 0 && !response?.IsDraft) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "DownPaymentInvoice",
            Number(response.DocEntry),
            patchDeliveryNote
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        if (response?.IsDraft) {
          toast.success("A/R Down Payment Invoice submitted for approval.");
        } else {
          toast.success(`A/R Down Payment Invoice #${response.DocNum} created successfully!`);
        }
      } else {
        throw new Error("Failed to create A/R Down Payment Invoice");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create A/R Down Payment Invoice. Please try again.");
      throw error;
    }
  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.DownPaymentInvoice}
    >
      <DocumentHeader />
      <DocumentItems />
      <UDFLayout docType={DocumentType.DownPaymentInvoice} />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
