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
import { uploadAttachments } from "@/api+/sap/attachments/attachmentService";

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

      const newAttachments = attachments.filter(att => att.File);
      const existingAttachments = attachments.filter(att => !att.File);

      let uploadedAttachments: any[] = [];

      if (newAttachments.length > 0) {
        try {
          const filesToUpload = newAttachments.map(att => att.File as File);

          const uploadResults = await uploadAttachments(filesToUpload, "IssueForProduction");

          toast.success(`${uploadResults.length} attachments uploaded successfully`);

          uploadedAttachments = newAttachments.map((att, index) => ({
            ...att,
            SourcePath: uploadResults[index].path, 
          }));
        } catch (error) {
          console.error("Attachment upload failed", error);
          toast.error("Failed to upload attachments");
          return; 
        }
      }

      const processedAttachments = [...existingAttachments, ...uploadedAttachments];

      const result = await saveProductionDocument(
        DocumentType.IssueForProduction,
        data,
        lines,
        processedAttachments
      );

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
