"use client"
import DocumentFooter from "@/components/sales/shared/DocumentFooter";
import { DocumentHeader } from "@/components/sales/shared/DocumentHeader";
import { DocumentItems } from "@/components/sales/shared/DocumentItems";
import { SalesDocumentLayout } from "@/components/sales/shared/SalesDocumentLayout";

import { useRouter } from "next/navigation";
import {
  QuotationFormData,
  quotationSchema,
} from "@/lib/schemas/quotationSchema";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { postSalesReturn } from "@/api+/sap/quotation/salesService";
import { toast } from "sonner";
import { getSapErrorMessage } from "@/lib/errorHelper";

export default function ReturnPage() {
  const router = useRouter();

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
    const { lines, DocEntry, lastLoadedDocType, reset: resetStore, attachments } = useSalesDocument.getState();

    const payload = {
      ...data,
      DocumentLines: lines.map((line) => {
        const lineData: any = { ...line };

        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.SalesReturn) {
          lineData.BaseType = lastLoadedDocType;
          lineData.BaseEntry = DocEntry;
          lineData.BaseLine = line.LineNum;
        } else {
          lineData.BaseType = -1;
          lineData.BaseEntry = null;
          lineData.BaseLine = null;
        }
        return lineData;
      }),
      Attachments2_Lines: attachments.map((att) => ({
        FileExtension: att.FileName.split('.').pop(),
        FileName: att.FileName.split('.').slice(0, -1).join('.'),
        SourcePath: att.SourcePath,
        UserID: "1",
        FreeText: att.FreeText
      }))
    };

    try {
      const response = await postSalesReturn(payload);
      if (response?.DocEntry) {
        toast.success(`Sales Return #${response.DocNum} created successfully!`);
        resetStore();
        router.push("/dashboard/sales/return");
      } else {
        throw new Error("Failed to create Sales Return");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create Sales Return. Please try again.");
    }
  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.SalesReturn}
    >
      <DocumentHeader />
      <DocumentItems />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
