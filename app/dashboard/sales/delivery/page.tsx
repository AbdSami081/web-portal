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
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { postDelivery, patchDeliveryNote } from "@/api+/sap/quotation/salesService";
import { toast } from "sonner";

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
    const { lines, DocEntry, lastLoadedDocType, reset: resetStore } = useSalesDocument.getState();

    // If we have a DocEntry and the loaded type is DELIVERY (15), then it's an UPDATE.
    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.Delivery) {
      // Update logic
      const payload = {
        Comments: data.Comments
      };

      try {
        console.log("PATCH Delivery Note Payload:", payload);
        const response = await patchDeliveryNote(Number(DocEntry), payload);
        toast.success(`Delivery Note #${DocEntry} updated successfully`);
      } catch (error) {
        console.error("Error while updating Delivery Note:", error);
        toast.error("Failed to update Delivery Note");
      }
      return;
    }

    // Create logic (Manual or Copy From)
    const payload = {
      ...data,
      DocumentLines: lines.map((line) => {
        const lineData: any = { ...line };

        // CHECK MAPPING: If we have a source DocEntry (Order or Quotation)
        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.Delivery) {
          lineData.BaseType = lastLoadedDocType;
          lineData.BaseEntry = DocEntry;
          lineData.BaseLine = line.LineNum;
        } else {
          // DEFAULT VALUES
          lineData.BaseType = -1;
          lineData.BaseEntry = null;
          lineData.BaseLine = null;
        }
        return lineData;
      }),
    };

    try {
      console.log("POST DELIVERY NOTE PAYLOAD (CHECK BASE FIELDS):", JSON.stringify(payload, null, 2));
      const response = await postDelivery(payload);

      if (response?.DocEntry) {
        toast.success(`Delivery Note #${response.DocNum} created successfully!`);
        resetStore();
        router.push("/dashboard/sales/delivery");
      } else {
        throw new Error("Failed to create Delivery Note");
      }
    } catch (error) {
      console.error("Error while creating Delivery Note:", error);
      toast.error("Failed to create Delivery Note. Please try again.");
    }
  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={15}
    >
      <DocumentHeader />
      <DocumentItems />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
