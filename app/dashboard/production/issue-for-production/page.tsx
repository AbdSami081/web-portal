"use client"

import { productionSchema, ProductionFormData } from "@/lib/schemas/productionSchema";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { patchIssueForProduction, saveProductionDocument } from "@/api+/sap/production/productionService";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { toast } from "sonner";
import { useMemo } from "react";
import { uploadAndPatchAttachments } from "@/api+/sap/attachments/attachmentService";
import { DocumentType } from "@/types/master/DocumentType";

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
    const { lines, attachments } = useIFPRDDocument.getState();

    try {
      if (!lines || lines.length === 0) {
        toast.error("Please add at least one line.");
        return;
      }

      const result = await saveProductionDocument(
        DocumentType.IssueForProduction,
        data,
        lines,
        []
      );

      const savedDocEntry = Number(data.DocEntry || result?.DocEntry || 0);

      if (savedDocEntry > 0 && attachments.length > 0) {
        const attachmentResult = await uploadAndPatchAttachments(
          attachments,
          "IssueForProduction",
          savedDocEntry,
          patchIssueForProduction
        );

        if (attachmentResult.uploadedCount > 0) {
          toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
        }
      }

      const isUpdate = !!data.DocEntry;
      const docNum = result?.DocNum || data.DocNum || "";

      toast.success(`Issue for Production #${docNum} ${isUpdate ? "updated" : "created"} successfully!`);

      reset();

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
