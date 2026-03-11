"use client"

import { productionSchema, ProductionFormData } from "@/lib/schemas/productionSchema";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { saveProductionDocument } from "@/api+/sap/production/productionService";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { toast } from "sonner";
import { useMemo } from "react";

export default function IssueForProductionPage() {
  const { lines, attachments, reset } = useIFPRDDocument();

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
      if (lines.length === 0) {
        toast.error("Please add at least one line.");
        return;
      }

      const result = await saveProductionDocument(DocumentType.IssueForProduction, data, lines, attachments);
      toast.success(`Issue for Production #${result?.DocNum || ""} created successfully!`);
      reset(); // Clear store
    } catch (error: any) {
      console.error("Error while creating issue for production:", error);
      toast.error(error.message || "Failed to create document");
    }
  };

  return (
    <PRDDocumentLayout
      schema={productionSchema}
      defaultValues={defaultValues as any}
      onSubmit={handleSubmit}
      docType={DocumentType.IssueForProduction}
    >
      <PRDDocumentHeader />
      <PRDDocumentItems />
      <PRDDocumentFooter />
    </PRDDocumentLayout>
  );
}
