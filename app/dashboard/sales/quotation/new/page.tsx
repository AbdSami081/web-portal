"use client"

import DocumentFooter from "@/components/sales/shared/DocumentFooter";
import { DocumentHeader } from "@/components/sales/shared/DocumentHeader";
import { DocumentItems } from "@/components/sales/shared/DocumentItems";
import { SalesDocumentLayout } from "@/components/sales/shared/SalesDocumentLayout";
import { QuotationFormData, quotationSchema } from "@/lib/schemas/quotationSchema";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { postQuotation, patchQuotation } from "@/api+/sap/quotation/salesService";
import { toast } from "sonner";
import { DocumentType } from "@/types/sales/salesDocuments.type";

export default function NewQuotationPage() {
  const loadFromDocument = useSalesDocument((state) => state.loadFromDocument);

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
    TaxDate: new Date().toISOString().split("T")[0],
    DocumentLines: [],
  };

  const handleSubmit = async (data: QuotationFormData) => {
    const { lines, DocTotal, freight, TaxTotal, additionalExpenses, DocEntry, lastLoadedDocType } = useSalesDocument.getState();

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.Quotation) {
      const payload = {
        Comments: data.Comments
      };

      try {
        await patchQuotation(Number(DocEntry), payload);
        toast.success(`Quotation #${DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update quotation");
      }
      return;
    }

    const payload = {
      ...data,
      DocTotal,
      DocumentLines: lines.map(line => {
        const lineData: any = { ...line };
        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.Quotation) {
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
      Freight: freight,
      TaxTotal: TaxTotal,
      DocumentLineAdditionalExpenses: additionalExpenses
    };

    try {
      const documentData = await postQuotation(payload);
      if (!documentData?.DocEntry) {
        throw new Error("Failed to create quotation");
      }
      loadFromDocument(documentData, DocumentType.Quotation);
      toast.success(`Quotation #${documentData.DocNum} created successfully`);
    } catch (error) {
      toast.error("Failed to create quotation. Please try again.");
    }
  };

  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.Quotation}
    >
      <DocumentHeader />
      <DocumentItems />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
