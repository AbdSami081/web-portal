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
import { uploadAttachments } from "@/api+/sap/attachments/attachmentService";
import { UDFLayout } from "@/components/shared/UDFSheet";
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
    const { lines, DocEntry, lastLoadedDocType, reset: resetStore, attachments } = useSalesDocument.getState();

    // 1. First, identify which attachments need uploading
    const newAttachments = attachments.filter(att => att.File);
    const existingAttachments = attachments.filter(att => !att.File);

    let uploadedAttachments: any[] = [];
    if (newAttachments.length > 0) {
      try {
        const filesToUpload = newAttachments.map(att => att.File as File);
        const uploadResults = await uploadAttachments(filesToUpload, "Invoice");
        
        toast.success(`${uploadResults.length} attachments uploaded successfully`);

        // Map the results back to the attachment structure
        uploadedAttachments = newAttachments.map((att, index) => ({
          ...att,
          SourcePath: uploadResults[index].path,
        }));
      } catch (error) {
        console.error("Failed to upload attachments", error);
        toast.error("Failed to upload attachments");
        return; // Stop if upload fails
      }
    }

    const processedAttachments = [...existingAttachments, ...uploadedAttachments];

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.ARInvoice) {
      const payload = {
        Comments: data.Comments,
        Attachments2_Lines: processedAttachments.map((att) => ({
          FileExtension: att.FileName.split('.').pop(),
          FileName: att.FileName.split('.').slice(0, -1).join('.'),
          SourcePath: att.SourcePath,
          FreeText: att.FreeText,
          CopyToTarget: att.CopyToTarget ? "tYES" : "tNO",
        }))
      };

      try {
        await patchARInvoice(Number(DocEntry), payload);
        const docNum = useSalesDocument.getState().DocNum;
        toast.success(`A/R Invoice #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update AR Invoice");
      }
      return;
    }

    const payload = {
      ...data,
      DocumentLines: lines.map((line) => {
        const lineData: any = { ...line };

        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.ARInvoice) {
          lineData.BaseType = lastLoadedDocType;
          lineData.BaseEntry = DocEntry;
          lineData.BaseLine = line.LineNum;
        } else {
          lineData.BaseType = -1;
          lineData.BaseEntry = null;
          lineData.BaseLine = null;
        }
        return lineData;
      }),
      Attachments2_Lines: processedAttachments.map((att) => ({
        FileExtension: att.FileName.split('.').pop(),
        FileName: att.FileName.split('.').slice(0, -1).join('.'),
        SourcePath: att.SourcePath,
        UserID: "1",
        FreeText: att.FreeText
      }))
    };

    try {
      const response = await postARInvoice(payload);
      if (response?.DocEntry) {
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
