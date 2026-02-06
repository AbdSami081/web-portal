"use client";

import React from "react";
import axios from "axios";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentHeader } from "@/components/sales/shared/DocumentHeader";
import { DocumentItems } from "@/components/sales/shared/DocumentItems";
import DocumentFooter from "@/components/sales/shared/DocumentFooter";
import { SalesDocumentLayout } from "@/components/sales/shared/SalesDocumentLayout";
import { useRouter } from "next/navigation";
import { QuotationFormData, quotationSchema } from "@/lib/schemas/quotationSchema";


export default function NewQuotationPage() {
  const router = useRouter();

  const defaultValues: QuotationFormData = {
    CardCode: "",
    CardName: "",
    DocDate: new Date().toISOString().split("T")[0],
    DocDueDate: new Date().toISOString().split("T")[0],
    DiscountPercent: 0,
    TaxDate: "",
    Freight: 0,
    Rounding: 0,
    Comments: "",
    TotalBeforeDiscount: 0,
    TaxTotal: 0,
    DocTotal: 0,
    DocumentLines: [],
  };

  const handleSubmit = async (data: QuotationFormData) => {
    const { lines } = useSalesDocument.getState();
    const payload = {
      ...data,
      DocumentLines: lines,
    };

    try {
      const res = await axios.post("/api/sap/salesdocument", {
        type: DocumentType.Quotation,
        data: payload,
      });
      if (res.status !== 201) {
        throw new Error("Failed to create quotation");
      }

      const doc = res.data?.data;

    } catch (error: any) {
      console.error("Error creating quotation:", error);
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
