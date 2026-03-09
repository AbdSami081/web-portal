"use client"

import { productionSchema, ProductionFormData } from "@/lib/schemas/productionSchema";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { useMemo } from "react";

export default function ReceiptFromProductionPage() {
  const defaultValues: Partial<ProductionFormData> = useMemo(() => ({
    DocDate: new Date().toISOString().split("T")[0],
    DocDueDate: new Date().toISOString().split("T")[0],
    TaxDate: new Date().toISOString().split("T")[0],
    Comments: "",
    JournalMemo: "",
    DocumentLines: [],
  }), []);

  const handleSubmit = async (data: ProductionFormData) => {
    try {

    } catch (error) {
      console.error("Error while creating receipt from production:", error);
    }
  };

  return (
    <PRDDocumentLayout
      schema={productionSchema}
      defaultValues={defaultValues as any}
      onSubmit={handleSubmit}
      docType={DocumentType.ReceiptFromProduction}
    >
      <PRDDocumentHeader />
      <PRDDocumentItems />
      <PRDDocumentFooter />
    </PRDDocumentLayout>
  );
}
