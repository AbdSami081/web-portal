"use client"

import DocumentFooter from "@/components/sales/shared/DocumentFooter";
import { DocumentHeader } from "@/components/sales/shared/DocumentHeader";
import { DocumentItems } from "@/components/sales/shared/DocumentItems";
import { SalesDocumentLayout } from "@/components/sales/shared/SalesDocumentLayout";
import { QuotationFormData, quotationSchema } from "@/lib/schemas/quotationSchema";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { postQuotation, patchQuotation } from "@/api+/sap/sales/salesService";
import { toast } from "sonner";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { uploadAndPatchAttachments } from "@/api+/sap/attachments/attachmentService";
import { ReactJsxRuntime } from "next/dist/server/route-modules/app-page/vendored/rsc/entrypoints";
import { buildSalesDocumentPayload, buildSalesDocumentPatchPayload } from "@/lib/sap/helpers/salesPayloadHelper";
import { DocumentType } from "@/types/master/DocumentType";
import { useEffect } from "react";
import { useAuth } from "@/context/authContext";
import { getAllFields } from "@/api+/sap/administration/administrationService";

export default function NewQuotationPage() {
  const loadFromDocument = useSalesDocument((state) => state.loadFromDocument);

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
    TaxDate: new Date().toISOString().split("T")[0],
    BranchRegNo: "",
    DocumentLines: [],
  };

  const handleSubmit = async (data: QuotationFormData) => {
    const { lines, freight, discountPercent, DocEntry, lastLoadedDocType, attachments, additionalExpenses, salesPersonCode, documentMode } = useSalesDocument.getState();

    if (lines.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.Quotation) {
      const patchPayload = buildSalesDocumentPatchPayload({
        data,
        lines,
        discountPercent,
        freight,
        additionalExpenses,
        salesPersonCode,
        documentMode,
      });
      console.log("[Submit button] Sales Quotation update payload:", patchPayload);
      try {
        await patchQuotation(Number(DocEntry), patchPayload);
        if (attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "SalesQuotation",
            Number(DocEntry),
            patchQuotation
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        const docNum = useSalesDocument.getState().DocNum;
        toast.success(`Quotation #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update quotation");
        throw error;
      }
      return;
    }

    const payload = buildSalesDocumentPayload({
      data,
      lines,
      docEntry: DocEntry,
      lastLoadedDocType,
      targetDocType: DocumentType.Quotation,
      discountPercent,
      freight,
      additionalExpenses,
      salesPersonCode,
      documentMode,
    });

    try {
      console.log("[Submit button] Sales Quotation create payload:", payload);
      const documentData = await postQuotation(payload);

      if (!documentData?.DocEntry && !documentData?.IsDraft) throw new Error("Failed to create quotation");
      if (attachments.length > 0 && !documentData?.IsDraft) {
        const attachmentResult = await uploadAndPatchAttachments(
          attachments,
          "SalesQuotation",
          Number(documentData.DocEntry),
          patchQuotation
        );

        if (attachmentResult.uploadedCount > 0) {
          toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
        }
      }
      if (documentData?.IsDraft) {
        toast.success("Quotation submitted for approval.");
      } else {
        loadFromDocument(documentData, DocumentType.Quotation);
        toast.success(`Quotation #${documentData.DocNum} created successfully`);
      }
      return documentData;
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create quotation. Please try again.");
      throw error;
    }
  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.Quotation}
    >
      <DocumentHeader />
      <DocumentItems />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
