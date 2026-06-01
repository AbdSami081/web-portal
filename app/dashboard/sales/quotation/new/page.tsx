"use client"

import DocumentFooter from "@/components/sales/shared/DocumentFooter";
import { DocumentHeader } from "@/components/sales/shared/DocumentHeader";
import { DocumentItems } from "@/components/sales/shared/DocumentItems";
import { SalesDocumentLayout } from "@/components/sales/shared/SalesDocumentLayout";
import { QuotationFormData, quotationSchema } from "@/lib/schemas/quotationSchema";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { postQuotation, patchQuotation } from "@/api+/sap/sales/salesService";
import { toast } from "sonner";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { uploadAndPatchAttachments } from "@/api+/sap/attachments/attachmentService";
import { ReactJsxRuntime } from "next/dist/server/route-modules/app-page/vendored/rsc/entrypoints";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { DocumentType } from "@/types/master/DocumentType";

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
    const { lines, freight, discountPercent, DocEntry, lastLoadedDocType, attachments, additionalExpenses } = useSalesDocument.getState();

    if (lines.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.Quotation) {
      const patchPayload = {
        Comments: data.Comments,
      };
      try {
        await patchQuotation(Number(DocEntry), patchPayload);
        if (attachments.length > 0) {
          const attachmentResult = await uploadAndPatchAttachments(
            attachments,
            "SalesQuotation",
            Number(DocEntry),
            patchQuotation
          );

          if (attachmentResult.uploadedCount > 0) {
            toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
          }
        }
        const docNum = useSalesDocument.getState().DocNum;
        toast.success(`Quotation #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update quotation");
        throw error;
      }
      return;
    }

    const payload = {
      CardCode: data.CardCode,
      CardName: data.CardName,
      DocDate: data.DocDate,
      DocDueDate: data.DocDueDate,
      TaxDate: data.TaxDate,
      Comments: data.Comments,
      DiscountPercent: discountPercent || 0,
      DocumentLines: lines.map((line, index) => {
        const baseFields: any = {
          ItemCode: line.ItemCode,
          Quantity: Number(line.Quantity) || 1,
          UnitPrice: Number(line.Price) || 0,
          DiscountPercent: Number(line.DiscountPercent) || 0,
          VatGroup: line.TaxCode || "",
          WarehouseCode: line.WarehouseCode || "",
          UoMCode: line.UoMCode || "",
        };
        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.Quotation) {
          baseFields.BaseType = lastLoadedDocType;
          baseFields.BaseEntry = DocEntry;
          baseFields.BaseLine = line.LineNum;
        }
        // Line-level freight
        const lineExpenses: any[] = [];
        if (line.Freight1Type && Number(line.Freight1LCAmount) > 0) {
          lineExpenses.push({ ExpenseCode: Number(line.Freight1Type), LineTotal: Number(line.Freight1LCAmount), VatGroup: line.Freight1TaxGroup || "" });
        }
        if (line.Freight2Type && Number(line.Freight2LCAmount) > 0) {
          lineExpenses.push({ ExpenseCode: Number(line.Freight2Type), LineTotal: Number(line.Freight2LCAmount), VatGroup: line.Freight2TaxGroup || "" });
        }
        if (line.Freight3Type && Number(line.Freight3LCAmount) > 0) {
          lineExpenses.push({ ExpenseCode: Number(line.Freight3Type), LineTotal: Number(line.Freight3LCAmount), VatGroup: line.Freight3TaxGroup || "" });
        }
        if (lineExpenses.length > 0) baseFields.DocumentLineAdditionalExpenses = lineExpenses;
        return baseFields;
      }),
      ...(additionalExpenses.length > 0 && {
        DocumentAdditionalExpenses: additionalExpenses.map(e => ({
          ExpenseCode: e.ExpenseCode,
          LineTotal: e.LineTotal,
          VatGroup: e.VatGroup || e.TaxCode || "",
        }))
      }),
      ...(freight > 0 && { Freight: freight }),
    };


    try {
      const documentData = await postQuotation(payload);
      if (!documentData?.DocEntry) throw new Error("Failed to create quotation");
      if (attachments.length > 0) {
        const attachmentResult = await uploadAndPatchAttachments(
          attachments,
          "SalesQuotation",
          Number(documentData.DocEntry),
          patchQuotation
        );

        if (attachmentResult.uploadedCount > 0) {
          toast.success(`${attachmentResult.uploadedCount} attachments uploaded successfully`);
        }
      }
      loadFromDocument(documentData, DocumentType.Quotation);
      toast.success(`Quotation #${documentData.DocNum} created successfully`);
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create quotation. Please try again.");
      throw error;
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
      <UDFLayout docType={DocumentType.Quotation} />
      <DocumentFooter />
    </SalesDocumentLayout>
  );
}
