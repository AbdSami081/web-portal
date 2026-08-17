"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { resolveDocNavParams } from "@/lib/docNavParams";
import { toast } from "sonner";
import { z } from "zod";
import { PRDDocumentHeader } from "@/components/production/shared/PRDDocumentHeader";
import { PRDDocumentItems } from "@/components/production/shared/PRDDocumentItems";
import PRDDocumentFooter from "@/components/production/shared/PRDDocumentFooter";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { PRDDocumentLayout } from "@/components/production/shared/PRDDocumentLayout";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { DocumentType } from "@/types/master/DocumentType";
import { getDraftDocument, SaveDraftToDocument } from "@/api+/sap/draft/draftService";
import { Loader2 } from "lucide-react";
import { getSapErrorMessage } from "@/lib/errorHelper";

const draftSchema = z.object({
  DocEntry: z.any().optional(),
  DocNum: z.any().optional(),
  PostDate: z.string().optional(),
  DocDate: z.string().optional(),
  DueDate: z.string().optional(),
  Comments: z.string().optional(),
  DocumentLines: z.array(z.any()).optional(),
});

type DraftFormData = z.infer<typeof draftSchema>;

export default function ProductionDraftPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const docNav = resolveDocNavParams(searchParams, pathname);
  const draftEntryStr = docNav.draftEntry ?? null;
  const docTypeParam = docNav.docType ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [targetDocType, setTargetDocType] = useState<DocumentType>(() => {
    const code = Number(docTypeParam);
    if (!isNaN(code) && code > 0) return code as DocumentType;
    return DocumentType.ProductionOrder;
  });

  const [defaultValues, setDefaultValues] = useState<DraftFormData>({
    PostDate: new Date().toISOString().split("T")[0],
    DocDate: new Date().toISOString().split("T")[0],
    DueDate: new Date().toISOString().split("T")[0],
    Comments: "",
    DocumentLines: [],
  });

  const { loadFromDocument } = useIFPRDDocument();

  useEffect(() => {
    const draftId = Number(draftEntryStr);
    if (!draftId || isNaN(draftId)) {
      toast.error("No valid draft entry provided.");
      setIsLoading(false);
      return;
    }

    const loadDraft = async () => {
      setIsLoading(true);
      try {
        const res = await getDraftDocument(draftId);
        if (res) {
          const documentData = {
            ...res,
            Comments: res.Comments ?? "",
            DocumentLines: (res.DocumentLines || []).map((line: any) => ({ ...line })),
          };

          useIFPRDDocument.getState().setLoadedDraftData(documentData);

          const inferredDocType = documentData.DocObjectCode
            ? (Number(documentData.DocObjectCode) as DocumentType)
            : targetDocType;

          setTargetDocType(inferredDocType);
          loadFromDocument(documentData, inferredDocType);

          setDefaultValues((prev) => ({
            ...prev,
            PostDate: documentData.DocDate
              ? documentData.DocDate.split("T")[0]
              : prev.PostDate,
            DocDate: documentData.DocDate
              ? documentData.DocDate.split("T")[0]
              : prev.DocDate,
            DueDate: documentData.DueDate
              ? documentData.DueDate.split("T")[0]
              : prev.DueDate,
            Comments: documentData.Comments || "",
            DocumentLines: documentData.DocumentLines,
          }));

          toast.success(`Production Draft #${draftId} loaded successfully.`);
        } else {
          toast.error(`Draft #${draftId} not found.`);
        }
      } catch (err: any) {
        toast.error(err?.message || "Failed to load draft document.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDraft();
  }, [draftEntryStr]);

  const handleCreateDocument = async (data: DraftFormData) => {
    const draftId = Number(draftEntryStr);
    if (!draftId || isNaN(draftId)) {
      toast.error("Invalid draft entry.");
      return;
    }

    const rawDate = data.PostDate || data.DocDate || new Date().toISOString().split("T")[0];

    const payload = {
      Document: {
        DocEntry: draftId,
        DocDueDate: String(rawDate),
      },
    };

    try {
      toast.loading("Creating document from draft...", { id: "save-draft-prd" });
      const created = await SaveDraftToDocument(payload);
      if (created) {
        toast.success("Document created successfully from draft!", { id: "save-draft-prd" });
      } else {
        toast.error("Failed to create document from draft.", { id: "save-draft-prd" });
      }
    } catch (err: any) {
      toast.error(getSapErrorMessage(err), { id: "save-draft-prd" });
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading draft document...</span>
        </div>
      </div>
    );
  }

  return (
    <PRDDocumentLayout
      key={targetDocType}
      schema={draftSchema}
      defaultValues={defaultValues}
      onSubmit={handleCreateDocument}
      docType={targetDocType}
      skipAutoReset 
    >
      <PRDDocumentHeader />
      <PRDDocumentItems />
      <UDFLayout docType={targetDocType} />
      <PRDDocumentFooter />
    </PRDDocumentLayout>
  );
}