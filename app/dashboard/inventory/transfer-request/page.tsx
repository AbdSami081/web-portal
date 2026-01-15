"use client"

import { QuotationFormData, quotationSchema } from "@/lib/schemas/quotationSchema";
import { InvDocumentLayout } from "@/components/Inventory/shared/InvDocumentLayout";
import { InvDocumentHeader } from "@/components/Inventory/shared/InvDocumentHeader";
import { InvDocumentItems } from "@/components/Inventory/shared/InvDocumentItems";
import InvDocumentFooter from "@/components/Inventory/shared/InvDocumentFooter";

export default function InvTransferRequestPage() {
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
    try {
      
    } catch (error) {
      console.error("Error while creating quotation:", error);
    }
  };

  return (
    <InvDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={1250000001}
    >
      <InvDocumentHeader />
      <InvDocumentItems />
      <InvDocumentFooter />
    </InvDocumentLayout>
  );
}
