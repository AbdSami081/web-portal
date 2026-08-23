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
import { postSalesReturn, patchSalesReturn } from "@/api+/sap/sales/salesService";
import { toast } from "sonner";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { buildSalesDocumentPayload, buildSalesDocumentPatchPayload } from "@/lib/sap/helpers/salesPayloadHelper";
import { DocumentType } from "@/types/master/DocumentType";
import { uploadAndPatchAttachments } from "@/api+/sap/attachments/attachmentService";
import { UDFLayout } from "@/components/shared/UDFSheet";

export default function ReturnPage() {
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

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.SalesReturn) {
      const patchPayload = buildSalesDocumentPatchPayload({
        data,
        lines,
        discountPercent,
        freight,
        additionalExpenses,
        includeLines: false,
      });

      try {
        await patchSalesReturn(Number(DocEntry), patchPayload);
        if (attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "SalesReturn",
            Number(DocEntry),
            patchSalesReturn
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        const docNum = useSalesDocument.getState().DocNum;
        toast.success(`Sales Return #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        const message = getSapErrorMessage(error);
        toast.error(message || "Failed to update Sales Return");
        throw error;
      }
      return;
    }

    const payload = buildSalesDocumentPayload({
      data,
      lines,
      docEntry: DocEntry,
      lastLoadedDocType,
      targetDocType: DocumentType.SalesReturn,
      discountPercent,
      freight,
      additionalExpenses,
    });

    try {
      const response = await postSalesReturn(payload);
      if (response?.DocEntry || response?.IsDraft) {
        if (attachments.length > 0 && !response?.IsDraft) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "SalesReturn",
            Number(response.DocEntry),
            patchSalesReturn
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        if (response?.IsDraft) {
          toast.success("Sales Return submitted for approval.");
        } else {
          toast.success(`Sales Return #${response.DocNum} created successfully!`);
        }
      } else {
        throw new Error("Failed to create Sales Return");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create Sales Return. Please try again.");
      throw error;
    }
  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.SalesReturn}
    >
      <DocumentHeader />
      <DocumentItems />
      <UDFLayout docType={DocumentType.SalesReturn} />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
