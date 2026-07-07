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
import { postARInvoice, patchARInvoice } from "@/api+/sap/sales/salesService";
import { toast } from "sonner";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { uploadAndPatchAttachments } from "@/api+/sap/attachments/attachmentService";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { buildSalesDocumentPayload } from "@/lib/sap/helpers/salesPayloadHelper";
import { DocumentType } from "@/types/master/DocumentType";

export default function InvoicePage() {
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

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.ARInvoice) {
      const payload = {
        Comments: data.Comments,
      };

      try {
        await patchARInvoice(Number(DocEntry), payload);
        if (attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "Invoice",
            Number(DocEntry),
            patchARInvoice
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        const docNum = useSalesDocument.getState().DocNum;
        toast.success(`A/R Invoice #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update AR Invoice");
      }
      return;
    }

    const payload = buildSalesDocumentPayload({
      data,
      lines,
      docEntry: DocEntry,
      lastLoadedDocType,
      targetDocType: DocumentType.ARInvoice,
      discountPercent,
      freight,
      additionalExpenses,
    });

    try {
      const response = await postARInvoice(payload);
      if (response?.DocEntry) {
        if (attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "Invoice",
            Number(response.DocEntry),
            patchARInvoice
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        toast.success(`A/R Invoice #${response.DocNum} created successfully!`);
      } else {
        throw new Error("Failed to create AR Invoice");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create AR Invoice. Please try again.");
      throw error;
    }
  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.ARInvoice}
    >
      <DocumentHeader />
      <DocumentItems />
      <UDFLayout docType={DocumentType.ARInvoice} />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
