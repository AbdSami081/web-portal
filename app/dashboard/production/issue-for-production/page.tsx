"use client"

import { QuotationFormData, quotationSchema } from "@/lib/schemas/quotationSchema";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { DocumentType } from "@/types/sales/salesDocuments.type";

export default function IssueForProductionPage() {
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
    <PRDDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.IssueForProduction}
    >
      <PRDDocumentHeader />
      <PRDDocumentItems />
      <PRDDocumentFooter />
    </PRDDocumentLayout>
  );
}
