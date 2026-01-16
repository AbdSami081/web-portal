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
import { useEffect, useState } from "react";
import { postSalesOrder } from "@/api+/sap/quotation/salesService";
import { toast } from "sonner";

export default function NewQuotationPage() {
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
    const { lines, DocEntry, reset: resetStore } = useSalesDocument.getState();
    const payload = {
      ...data,
      DocumentLines: lines.map((line) => ({
        ...line,
        BaseType: DocumentType.Quotation,
        BaseEntry: DocEntry || 0,
        BaseLine: line.LineNum,
      })),
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





