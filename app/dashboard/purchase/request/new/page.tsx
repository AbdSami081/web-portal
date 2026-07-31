"use client"
import { useState } from "react";
import { toast } from "sonner";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { PurchaseDocumentType } from "@/types/purchase/purchaseDocuments.type";
import { PurchaseDocumentLayout } from "@/components/purchase/PurchaseDocumentLayout";
import { PurchaseVendorHeader } from "@/components/purchase/PurchaseVendorHeader";
import { PurchaseItems } from "@/components/purchase/PurchaseItems";
import { PurchaseFooter } from "@/components/purchase/PurchaseFooter";
import { PurchaseRequestFormData, purchaseRequestSchema } from "@/lib/schemas/purchaseVendorSchemas";
import { DocumentType } from "@/types/master/DocumentType";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { patchPurchaseRequest, postPurchaseRequest } from "@/api+/sap/purchase/purchaseService";
import { uploadAttachments } from "@/api+/sap/attachments/attachmentService";
import { UDFLayout } from "@/components/shared/UDFSheet";

const today = new Date().toISOString().split("T")[0];

export default function PurchaseRequestPage() {
  const loadFromDocument = usePurchaseDocument((state) => state.loadFromDocument);

  const [defaultValues] = useState<PurchaseRequestFormData>({
    CardCode: "",
    CardName: "",
    ContactPersonCode: "",
    NumAtCard: "",
    DocDate: today,
    DocDueDate: today,
    TaxDate: today,
    DocStatus: "bost_Open",
    Comments: "",
    DocNum: 0,
    DocEntry: 0,
  });

  const handleSubmit = async (data: PurchaseRequestFormData) => {
    const { lines, freight, discountPercent, DocEntry, lastLoadedDocType, attachments, additionalExpenses } = usePurchaseDocument.getState();

    if (lines.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }

    const newAttachments = attachments.filter(att => att.File);
    const existingAttachments = attachments.filter(att => !att.File);
    let uploadedAttachments: any[] = [];

    if (newAttachments.length > 0) {
      try {
        const filesToUpload = newAttachments.map(att => att.File as File);
        const uploadResults = await uploadAttachments(filesToUpload, "PurchaseQuotation");
        toast.success(`${uploadResults.length} attachments uploaded successfully`);
        uploadedAttachments = newAttachments.map((att, index) => ({
          ...att,
          SourcePath: uploadResults[index].path,
        }));
      } catch (error) {
        toast.error("Failed to upload attachments");
        return;
      }
    }

    const processedAttachments = [...existingAttachments, ...uploadedAttachments];

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.Quotation) {
      const patchPayload = {
        Comments: data.Comments,
        Attachments2_Lines: processedAttachments.map((att) => ({
          FileExtension: att.FileName.split('.').pop(),
          FileName: att.FileName.split('.').slice(0, -1).join('.'),
          SourcePath: att.SourcePath,
          FreeText: att.FreeText,
          CopyToTarget: att.CopyToTarget ? "tYES" : "tNO",
        }))
      };
      try {
        await patchPurchaseRequest(Number(DocEntry), patchPayload);
        const docNum = usePurchaseDocument.getState().DocNum;
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
      RequriedDate: data.DocDueDate, 
      TaxDate: data.TaxDate,
      Comments: data.Comments,
      DiscountPercent: discountPercent || 0,
      DocumentLines: lines.map((line) => {
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
      ...(processedAttachments.length > 0 && {
        Attachments2_Lines: processedAttachments.map((att) => ({
          FileExtension: att.FileName.split('.').pop(),
          FileName: att.FileName.split('.').slice(0, -1).join('.'),
          SourcePath: att.SourcePath,
          FreeText: att.FreeText,
        }))
      }),
    };

    try {
      console.log("Submitting Purchase Request with payload:", payload);
      const documentData = await postPurchaseRequest(payload);
      if (!documentData?.DocEntry) throw new Error("Failed to create request");
      loadFromDocument(documentData, DocumentType.PurchaseRequests);
      toast.success(`Request #${documentData.DocNum} created successfully`);
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create quotation. Please try again.");
      throw error;
    }
  };

  return (
    <PurchaseDocumentLayout
      schema={purchaseRequestSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.PurchaseRequests}
    >
      <div className="flex flex-col gap-6">
        <PurchaseVendorHeader docType={PurchaseDocumentType.PurchaseRequests} />
        <PurchaseItems />
        <UDFLayout docType={DocumentType.PurchaseRequests} />
        <PurchaseFooter />
      </div>
    </PurchaseDocumentLayout>
  );
}
