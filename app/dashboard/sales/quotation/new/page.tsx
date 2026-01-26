"use client"

import DocumentFooter from "@/components/sales/shared/DocumentFooter";
import { DocumentHeader } from "@/components/sales/shared/DocumentHeader";
import { DocumentItems } from "@/components/sales/shared/DocumentItems";
import { SalesDocumentLayout } from "@/components/sales/shared/SalesDocumentLayout";
import { QuotationFormData, quotationSchema } from "@/lib/schemas/quotationSchema";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { postQuotation, patchQuotation } from "@/api+/sap/quotation/salesService";
import { toast } from "sonner";

export default function NewQuotationPage() {
  const loadFromDocument = useSalesDocument((state) => state.loadFromDocument);

  // const {loadFromDocument} = useSalesDocument();

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

  // const handleSubmit = async (data: QuotationFormData) => {
  //   const { lines, DocTotal } = useSalesDocument.getState();
  //   const payload = {
  //     ...data,
  //     DocumentLines: lines,
  //   };

  //   console.log("Submitting Quotation Payload:", payload);
  //   console.log("Doc Total:", DocTotal);
  //   console.log("Lines Data:", lines);
  //   console.log("Quotation Form Data:", data);

  //   try {
  //     const res = {
  //       status: 201,
  //       data: {
  //         data: {
  //           DocEntry: Math.floor(Math.random() * 10000),
  //           DocNum: Math.floor(Math.random() * 1000000),
  //           CardCode: payload.CardCode,
  //           CardName: payload.CardName,
  //           DocDate: payload.DocDate || new Date().toISOString().split("T")[0],
  //           DocTotal: payload.DocTotal,
  //           DocumentLines: lines || [],
  //         },
  //       },
  //     };

  //     if (res.status !== 201) {
  //       throw new Error("Failed to create quotation");
  //     }

  //     const doc = res.data?.data;
  //     if (!doc?.DocEntry) throw new Error("Missing DocEntry from response");

  //     console.log("Quotation Created (Dummy):", doc);

  //   } catch (error) {
  //     console.error("Error while creating quotation:", error);
  //   }
  // };
  const handleSubmit = async (data: QuotationFormData) => {
    const { lines, DocTotal, freight, TaxTotal, additionalExpenses, DocEntry } = useSalesDocument.getState();

    if (DocEntry && Number(DocEntry) > 0) {
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

    // Create logic
    const { DocDate, DocDueDate, TaxDate, ...restData } = data;

    const payload = {
      ...restData,
      DocTotal,
      DocumentLines: lines,
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
      loadFromDocument(documentData);

      toast.success(`Quotation #${documentData.DocNum} created successfully`);
    } catch (error) {
      console.error("Error while creating quotation:", error);
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
