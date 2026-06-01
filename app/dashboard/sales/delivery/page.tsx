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
import { postDelivery, patchDeliveryNote } from "@/api+/sap/sales/salesService";
import { toast } from "sonner";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { uploadAndPatchAttachments } from "@/api+/sap/attachments/attachmentService";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { DocumentType } from "@/types/master/DocumentType";

export default function DeliveryPage() {
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
    
    const payload = {
      ...data,
      DocumentLines: lines.map((line) => {
        const lineData: any = { ...line };

        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.Delivery) {
          lineData.BaseType = lastLoadedDocType;
          lineData.BaseEntry = DocEntry;
          lineData.BaseLine = line.LineNum;
        } else if (!(DocEntry && Number(DocEntry) > 0)) {
          lineData.BaseType = -1;
          lineData.BaseEntry = null;
          lineData.BaseLine = null;
        }
        return lineData;
      }),
    };


    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.Delivery) {
      try {
        await patchDeliveryNote(Number(DocEntry), payload);
        if (attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "Delivery",
            Number(DocEntry),
            patchDeliveryNote
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        const docNum = useSalesDocument.getState().DocNum;
        toast.success(`Delivery Note #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update Delivery Note");
      }
      return;
    }

    try {
      const response = await postDelivery(payload);
   
      if (response?.DocEntry) {
        if (attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "Delivery",
            Number(response.DocEntry),
            patchDeliveryNote
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        toast.success(`Delivery Note #${response.DocNum} created successfully!`);
      } else {
        throw new Error("Failed to create Delivery Note");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create Delivery Note. Please try again.");
      throw error;
    }
  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.Delivery}
    >
      <DocumentHeader />
      <DocumentItems />
      <UDFLayout docType={DocumentType.Delivery} />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
