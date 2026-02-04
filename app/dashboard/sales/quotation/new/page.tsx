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

    // If we have a DocEntry and it's a QUOTATION, perform an UPDATE.
    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.Quotation) {
      // Update logic
      const payload = {
        Comments: data.Comments
      };

      try {
        console.log("Updating Quotation Payload:", payload);
        const documentData = await patchQuotation(Number(DocEntry), payload);
        toast.success(`Quotation #${DocEntry} updated successfully`);
      } catch (error) {
        console.error("Error while updating quotation:", error);
        toast.error("Failed to update quotation");
      }
      return;
    }

    // Create logic (Manual creation - Quotations usually don't have base docs in this UI)
    const payload = {
      ...data,
      DocTotal,
      DocumentLines: lines.map(line => {
        const lineData: any = { ...line };
        // Even if copied from another quotation (unlikely here), we ensure mapping logic is consistent
        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.Quotation) {
          lineData.BaseType = lastLoadedDocType;
          lineData.BaseEntry = DocEntry;
          lineData.BaseLine = line.LineNum;
        } else {
          delete lineData.BaseType;
          delete lineData.BaseEntry;
          delete lineData.BaseLine;
        }
        return lineData;
      }),
      Freight: freight,
      TaxTotal: TaxTotal,
      DocumentLineAdditionalExpenses: additionalExpenses
    };

    try {
      console.log("Quotation Created Payload:", payload);

      const documentData = await postQuotation(payload);

      if (!documentData?.DocEntry) {
        throw new Error("Failed to create quotation");
      }

      console.log("Quotation Created:", documentData);
      loadFromDocument(documentData, DocumentType.Quotation);

      toast.success(`Quotation #${documentData.DocNum} created successfully`);
    } catch (error) {
      console.error("Error while creating quotation:", error);
      toast.error("Failed to create quotation. Please try again.");
    }
  };


  return (
    <SalesDocumentLayout
      schema={quotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={23}
    >
      <DocumentHeader />
      <DocumentItems />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
