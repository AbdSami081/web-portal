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
import { postSalesOrder, patchSalesOrder } from "@/api+/sap/quotation/salesService";
import { toast } from "sonner";

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
    const { lines, DocEntry, lastLoadedDocType, reset: resetStore } = useSalesDocument.getState();

    console.log("SUBMIT DEBUG: DocEntry in Store:", DocEntry);
    console.log("SUBMIT DEBUG: lastLoadedDocType in Store:", lastLoadedDocType);

    // If we have a DocEntry and the loaded type is ORDER (17), then it's an UPDATE.
    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.Order) {
      // Update logic
      const payload = {
        Comments: data.Comments
      };

      try {
        console.log("PATCH Sales Order Payload:", payload);
        const response = await patchSalesOrder(Number(DocEntry), payload);
        toast.success(`Sales Order #${DocEntry} updated successfully`);
      } catch (error) {
        console.error("Error while updating Sales Order:", error);
        toast.error("Failed to update Sales Order");
      }
      return;
    }

    // Create logic (Manual or Copy From/To)
    const payload = {
      ...data,
      DocumentLines: lines.map((line) => {
        const lineData: any = { ...line };

        // CHECK MAPPING: If we have a DocEntry and it's NOT an Order (meaning it's a source doc)
        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.Order) {
          lineData.BaseType = lastLoadedDocType;
          lineData.BaseEntry = DocEntry;
          lineData.BaseLine = line.LineNum;
        } else {
          // DEFAULT VALUES: As requested, use -1 and nulls
          lineData.BaseType = -1;
          lineData.BaseEntry = null;
          lineData.BaseLine = null;
        }
        return lineData;
      }),
    };

    try {
      console.log("POST SALES ORDER PAYLOAD (CHECK BASE FIELDS):", JSON.stringify(payload, null, 2));
      const response = await postSalesOrder(payload);

      if (response?.DocEntry) {
        toast.success(`Sales Order #${response.DocNum} created successfully!`);
        resetStore();
        router.push("/dashboard/sales/order");
      } else {
        throw new Error("Failed to create Sales Order");
      }
    } catch (error) {
      console.error("Error while creating Sales Order:", error);
      toast.error("Failed to create Sales Order. Please try again.");
    }
  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={17}
    >
      <DocumentHeader />
      <DocumentItems />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
