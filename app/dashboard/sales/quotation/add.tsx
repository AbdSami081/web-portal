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
// import { Schema } from "zod/v3";


export default function NewQuotationPage() {
  // const { toast } = useToast();
  const router = useRouter();

  const defaultValues: QuotationFormData = {
    CardCode: "",
    CardName: "",
    DocDate: new Date().toISOString().split("T")[0],
    DocDueDate: new Date().toISOString().split("T")[0],
    DiscountPercent: 0,
    TaxDate:"",
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
        // show toast error message
        const serverErrorMessage =
          res.data?.error || "Unknown error occurred while creating quotation";
        // toast({
        //   title: "Error",
        //   description: serverErrorMessage,
        //   variant: "destructive",
        // });
        throw new Error("Failed to create quotation");
      }

      const doc = res.data?.data;
      //if (!doc?.DocEntry) throw new Error("Missing DocEntry from response");

      // queueToastForNextPage({
      //   title: "Quotation Created",
      //   description: `Quotation #${doc.DocNum} saved successfully`,
      // });
      const toastPayload = {
        title: "Quotation Created",
        description: `Quotation #${doc.DocNum} saved successfully`,
      };
      
      // Navigate SPA-style
      // navigate(`/dashboard/sales/quotations/${doc.DocEntry}?toast=${encodeToastParam(toastPayload)}`);
      
    } catch (error: any) {
      console.error("Error creating quotation:", error);  
      const message =
        error?.response?.data?.error ||
        error?.message ||
        "Unknown SAP error occurred";
      // toast({
      //   title: "Failed to Save Quotation",
      //   description: message,
      //   variant: "destructive",
      // });
    }
  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={23}
    >
      <DocumentHeader />
      <DocumentItems />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
