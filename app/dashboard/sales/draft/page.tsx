"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { resolveDocNavParams } from "@/lib/docNavParams";
import { toast } from "sonner";
import { DocumentHeader } from "@/components/sales/shared/DocumentHeader";
import { DocumentItems } from "@/components/sales/shared/DocumentItems";
import DocumentFooter from "@/components/sales/shared/DocumentFooter";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { SalesDocumentLayout } from "@/components/sales/shared/SalesDocumentLayout";
import { quotationSchema, QuotationFormData } from "@/lib/schemas/quotationSchema";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentType } from "@/types/master/DocumentType";
import { getDraftDocument, SaveDraftToDocument } from "@/api+/sap/draft/draftService";
import { Loader2 } from "lucide-react";
import { BaseSalesDocument } from "@/types/sales/salesDocuments.type";
import { getSapErrorMessage } from "@/lib/errorHelper";

export default function SalesDraftPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const docNav = resolveDocNavParams(searchParams, pathname);
  const draftEntryStr = docNav.draftEntry ?? null;
  const docTypeParam = docNav.docType ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [targetDocType, setTargetDocType] = useState<DocumentType>(() => {
    const code = Number(docTypeParam);
    if (!isNaN(code) && code > 0) return code as DocumentType;
    return DocumentType.Order;
  });

  const [defaultValues, setDefaultValues] = useState<QuotationFormData>({
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
  });

  const { loadFromDocument } = useSalesDocument();

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

          const documentData: BaseSalesDocument = {
            ...res,
            comments: res.Comments ?? "",
            DocumentLines: (res.DocumentLines || []).map((line: any) => ({
              ...line,
            })),
          };

          useSalesDocument.getState().setLoadedDraftData(documentData);

          const inferredDocType = documentData.DocObjectCode
            ? (Number(documentData.DocObjectCode) as DocumentType)
            : targetDocType;

          setTargetDocType(inferredDocType);
          loadFromDocument(documentData, inferredDocType, true);

          setDefaultValues((prev) => ({
            ...prev,
            CardCode: documentData.CardCode || "",
            CardName: documentData.CardName || "",
            DocDate: documentData.DocDate
              ? documentData.DocDate.split("T")[0]
              : new Date().toISOString().split("T")[0],
            DocDueDate: documentData.DocDueDate
              ? documentData.DocDueDate.split("T")[0]
              : new Date().toISOString().split("T")[0],
            TaxDate: documentData.TaxDate ? documentData.TaxDate.split("T")[0] : "",
            Comments: documentData.Comments || "",
            DocumentLines: documentData.DocumentLines,
          }));

          toast.success(`Draft #${draftId} loaded successfully.`);
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

  const handleCreateDocument = async (data: QuotationFormData) => {
    const draftId = Number(draftEntryStr);
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
      toast.loading("Creating document from draft...", { id: "save-draft-sales" });
      const created = await SaveDraftToDocument(payload);
      if (created) {
        toast.success("Document created successfully from draft!", { id: "save-draft-sales" });
      } else {
        toast.error("Failed to create document from draft.", { id: "save-draft-sales" });
      }
    } catch (err: any) {
      toast.error(getSapErrorMessage(err), { id: "save-draft-sales" });
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
    <SalesDocumentLayout
      key={targetDocType}
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleCreateDocument}
      docType={targetDocType}
      skipAutoReset
    >
      <DocumentHeader />
      <DocumentItems />
      <UDFLayout docType={targetDocType} />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}