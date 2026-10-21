"use client";

import React, { useEffect, useState } from "react";
import { readDocNavFromBrowser, type DocNavParams } from "@/lib/docNavParams";
import { toast } from "sonner";
import { z } from "zod";
import { PurchaseVendorHeader } from "@/components/purchase/PurchaseVendorHeader";
import { PurchaseItems } from "@/components/purchase/PurchaseItems";
import { PurchaseFooter } from "@/components/purchase/PurchaseFooter";
import { PurchaseDocumentLayout } from "@/components/purchase/PurchaseDocumentLayout";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { DocumentType } from "@/types/master/DocumentType";
import { SaveDraftToDocument } from "@/api+/sap/draft/draftService";
import { Loader2 } from "lucide-react";
import { getSapErrorMessage } from "@/lib/errorHelper";

const draftSchema = z.object({
  CardCode: z.string().optional(),
  CardName: z.string().optional(),
  ContactPersonCode: z.string().optional(),
  NumAtCard: z.string().optional(),
  DocDate: z.string().optional(),
  TaxDate: z.string().optional(),
  DocDueDate: z.string().optional(),
  RequiredDate: z.string().optional(),
  Comments: z.string().optional(),
  DocStatus: z.string().optional(),
  DocEntry: z.any().optional(),
  DocNum: z.any().optional(),
  BPL_IDAssignedToInvoice: z.number().optional(),
}).loose();

type DraftFormData = z.infer<typeof draftSchema>;

export default function PurchaseDraftPage() {
  const [docNav, setDocNav] = useState<DocNavParams | null>(null);

  useEffect(() => {
    setDocNav(readDocNavFromBrowser());
  }, []);

  const draftEntryStr = docNav?.draftEntry ?? null;
  const docTypeParam = docNav?.docType ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [targetDocType, setTargetDocType] = useState<DocumentType>(DocumentType.PurchaseQuotation);

  const [defaultValues] = useState<DraftFormData>({
    CardCode: "",
    CardName: "",
    DocDate: new Date().toISOString().split("T")[0],
    TaxDate: new Date().toISOString().split("T")[0],
    DocDueDate: new Date().toISOString().split("T")[0],
    Comments: "",
    DocStatus: "bost_Open",
    DocNum: 0,
    DocEntry: 0,
  });

  const fieldAccess = usePurchaseDocument((s) => s.fieldAccess);

  useEffect(() => {
    if (!docNav) return;

    const navDocType = Number(docTypeParam);
    if (!isNaN(navDocType) && navDocType > 0) {
      setTargetDocType(navDocType as DocumentType);
    }

    setIsLoading(false);
  }, [docNav, docTypeParam]);

  const handleCreateDocument = async (data: DraftFormData) => {
    const draftId = Number((draftEntryStr ?? "").toString().trim().split(/\s+/)[0]);
    if (!draftId || isNaN(draftId)) {
      toast.error("Invalid draft entry.");
      return;
    }

    const docDueDate = data.DocDueDate || data.DocDate || new Date().toISOString().split("T")[0];

    const payload = {
      Document: {
        DocEntry: draftId,
        DocDueDate: String(docDueDate),
      },
    };

    try {
      toast.loading("Creating document from draft...", { id: "save-draft-purchase" });
      const created = await SaveDraftToDocument(payload);
      if (created) {
        toast.success("Document created successfully from draft!", { id: "save-draft-purchase" });
      } else {
        toast.error("Failed to create document from draft.", { id: "save-draft-purchase" });
      }
    } catch (err: any) {
      toast.error(getSapErrorMessage(err), { id: "save-draft-purchase" });
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
    <PurchaseDocumentLayout
      key={targetDocType}
      schema={draftSchema}
      defaultValues={defaultValues}
      onSubmit={handleCreateDocument}
      docType={targetDocType}
    >
      <PurchaseVendorHeader docType={targetDocType} />
      <PurchaseItems />
      <PurchaseFooter />
    </PurchaseDocumentLayout>
  );
}
