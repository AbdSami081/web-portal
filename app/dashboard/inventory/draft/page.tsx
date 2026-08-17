"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { resolveDocNavParams } from "@/lib/docNavParams";
import { toast } from "sonner";
import { z } from "zod";
import { InvDocumentHeader } from "@/components/Inventory/shared/InvDocumentHeader";
import { InvDocumentItems } from "@/components/Inventory/shared/InvDocumentItems";
import InvDocumentFooter from "@/components/Inventory/shared/InvDocumentFooter";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { InvDocumentLayout } from "@/components/Inventory/shared/InvDocumentLayout";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { DocumentType } from "@/types/master/DocumentType";
import { getDraftDocument, SaveDraftToDocument } from "@/api+/sap/draft/draftService";
import { Loader2 } from "lucide-react";
import { getSapErrorMessage } from "@/lib/errorHelper";

const draftSchema = z.object({
  CardCode: z.string().optional(),
  CardName: z.string().optional(),
  DocDate: z.string().optional(),
  TaxDate: z.string().optional(),
  DocDueDate: z.string().optional(),
  FromWarehouse: z.string().optional(),
  ToWarehouse: z.string().optional(),
  Comments: z.string().optional(),
  DocEntry: z.any().optional(),
  DocNum: z.any().optional(),
});

type DraftFormData = z.infer<typeof draftSchema>;

export default function InventoryDraftPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const docNav = resolveDocNavParams(searchParams, pathname);
  const draftEntryStr = docNav.draftEntry ?? null;
  const docTypeParam = docNav.docType ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [targetDocType, setTargetDocType] = useState<DocumentType>(() => {
    const code = Number(docTypeParam);
    if (!isNaN(code) && code > 0) return code as DocumentType;
    return DocumentType.InvTransfer;
  });

  const [defaultValues, setDefaultValues] = useState<DraftFormData>({
    CardCode: "",
    CardName: "",
    DocDate: new Date().toISOString().split("T")[0],
    TaxDate: new Date().toISOString().split("T")[0],
    DocDueDate: new Date().toISOString().split("T")[0],
    FromWarehouse: "",
    ToWarehouse: "",
    Comments: "",
  });

  const { loadFromDocument } = useInventoryDocument();

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

          useInventoryDocument.getState().setLoadedDraftData(documentData);

          const inferredDocType = documentData.DocObjectCode
            ? (Number(documentData.DocObjectCode) as DocumentType)
            : targetDocType;

          setTargetDocType(inferredDocType);
          loadFromDocument(documentData, inferredDocType, true);

          setDefaultValues((prev) => ({
            ...prev,
            CardCode: documentData.CardCode || "",
            CardName: documentData.CardName || "",
            DocDate: documentData.DocDate ? documentData.DocDate.split("T")[0] : prev.DocDate,
            TaxDate: documentData.TaxDate ? documentData.TaxDate.split("T")[0] : prev.TaxDate,
            DocDueDate: documentData.DocDueDate ? documentData.DocDueDate.split("T")[0] : prev.DocDueDate,
            FromWarehouse: documentData.FromWarehouse || "",
            ToWarehouse: documentData.ToWarehouse || "",
            Comments: documentData.Comments || "",
          }));

          toast.success(`Inventory Draft #${draftId} loaded successfully.`);
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

    const docDueDate = data.TaxDate || data.DocDate || new Date().toISOString().split("T")[0];

    const payload = {
      Document: {
        DocEntry: draftId,
        DocDueDate: String(docDueDate),
      },
    };

    try {
      toast.loading("Creating document from draft...", { id: "save-draft-inv" });
      const created = await SaveDraftToDocument(payload);
      if (created) {
        toast.success("Document created successfully from draft!", { id: "save-draft-inv" });
      } else {
        toast.error("Failed to create document from draft.", { id: "save-draft-inv" });
      }
    } catch (err: any) {
      toast.error(getSapErrorMessage(err), { id: "save-draft-inv" });
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
    <InvDocumentLayout
      key={targetDocType}
      schema={draftSchema}
      defaultValues={defaultValues}
      onSubmit={handleCreateDocument}
      docType={targetDocType}
      skipAutoReset   
    >
      <InvDocumentHeader />
      <InvDocumentItems />
      <UDFLayout docType={targetDocType} />
      <InvDocumentFooter />
    </InvDocumentLayout>
  );
}