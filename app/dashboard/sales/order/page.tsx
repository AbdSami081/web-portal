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

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.Order) {
      const payload = {
        Comments: data.Comments
      };

      try {
        await patchSalesOrder(Number(DocEntry), payload);
        toast.success(`Sales Order #${DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update Sales Order");
      }
      return;
    }

    const payload = {
      ...data,
      DocumentLines: lines.map((line) => {
        const lineData: any = { ...line };

        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.Order) {
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
    };

    try {
      const response = await postSalesOrder(payload);

      if (response?.DocEntry) {
        toast.success(`Sales Order #${response.DocNum} created successfully!`);
        resetStore();
        router.push("/dashboard/sales/order");
      } else {
        throw new Error("Failed to create Sales Order");
      }
    } catch (error) {
      toast.error("Failed to create Sales Order. Please try again.");
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
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
