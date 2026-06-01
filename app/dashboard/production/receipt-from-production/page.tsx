"use client"

import { productionSchema, ProductionFormData } from "@/lib/schemas/productionSchema";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { useMemo } from "react";
import { patchReceiptFromProduction, saveProductionDocument } from "@/api+/sap/production/productionService";
import { toast } from "sonner";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { useRouter } from "next/navigation";
import { uploadAndPatchAttachments } from "@/api+/sap/attachments/attachmentService";
import { DocumentType } from "@/types/master/DocumentType";

export default function ReceiptFromProductionPage() {
  const defaultValues: Partial<ProductionFormData> = useMemo(() => ({
    DocDate: new Date().toISOString().split("T")[0],
    DocDueDate: new Date().toISOString().split("T")[0],
    TaxDate: new Date().toISOString().split("T")[0],
    Comments: "",
    JournalMemo: "",
    DocumentLines: [],
  }), []);

  const { lines, attachments, reset: resetStore } = useIFPRDDocument();
  const router = useRouter();

  const handleSubmit = async (data: ProductionFormData) => {
    const { lines, attachments } = useIFPRDDocument.getState();

    if (!lines || lines.length === 0) {
      toast.error("Please add at least one line.");
      return;
    }

    try {
      const result = await saveProductionDocument(
        DocumentType.ReceiptFromProduction,
        data,
        lines,
        []
      );

      const savedDocEntry = Number(data.DocEntry || result?.DocEntry || 0);

      if (savedDocEntry > 0 && attachments.length > 0) {
        const attachmentResult = await uploadAndPatchAttachments(
          attachments,
          "ReceiptFromProduction",
          savedDocEntry,
          patchReceiptFromProduction
        );

        if (attachmentResult.uploadedCount > 0) {
          toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
        }
      }

      const isUpdate = !!data.DocEntry;
      const newDocNum = result?.DocNum || data.DocNum || "New";

      toast.success(`Receipt From Production #${newDocNum} ${isUpdate ? "updated" : "created"} successfully!`);

      resetStore();
      router.refresh();

    } catch (error: any) {
      console.error("Error while creating receipt from production:", error);
      toast.error(error.message || "Failed to create Receipt From Production");
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
