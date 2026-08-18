"use client"
import { useState } from "react";
import { toast } from "sonner";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { PurchaseDocumentType } from "@/types/purchase/purchaseDocuments.type";
import { PurchaseDocumentLayout } from "@/components/purchase/PurchaseDocumentLayout";
import { PurchaseVendorHeader } from "@/components/purchase/PurchaseVendorHeader";
import { purchaseQuotationSchema, PurchaseQuotationFormData } from "@/lib/schemas/purchaseVendorSchemas";
import { PurchaseFooter } from "@/components/purchase/PurchaseFooter";
import { PurchaseItems } from "@/components/purchase/PurchaseItems";
import { DocumentType } from "@/types/master/DocumentType";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { patchPurchaseQuotation, postPurchaseQuotation } from "@/api+/sap/purchase/purchaseService";
import { uploadAttachments } from "@/api+/sap/attachments/attachmentService";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { buildPurchaseDocumentPayload, buildPurchaseDocumentPatchPayload } from "@/lib/sap/helpers/purchasePayloadHelper";

const today = new Date().toISOString().split("T")[0];

export default function NewPurchaseQuotationPage() {
  const loadFromDocument = usePurchaseDocument((state) => state.loadFromDocument);

  const [defaultValues] = useState<PurchaseQuotationFormData>({
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

  const handleSubmit = async (data: PurchaseQuotationFormData) => {
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

    const rounding = 0;

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.PurchaseQuotation) {
      const patchPayload = buildPurchaseDocumentPatchPayload({
        data,
        lines,
        discountPercent,
        freight,
        rounding,
        additionalExpenses,
      });

      // Add attachments to payload
      if (processedAttachments.length > 0) {
        (patchPayload as any).Attachments2_Lines = processedAttachments.map((att) => ({
          FileExtension: att.FileName.split('.').pop(),
          FileName: att.FileName.split('.').slice(0, -1).join('.'),
          SourcePath: att.SourcePath,
          FreeText: att.FreeText,
          CopyToTarget: att.CopyToTarget ? "tYES" : "tNO",
        }));
      }

      try {
        await patchPurchaseQuotation(Number(DocEntry), patchPayload);
        const docNum = usePurchaseDocument.getState().DocNum;
        toast.success(`Quotation #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update quotation");
        throw error;
      }
      return;
    }

    const payload = buildPurchaseDocumentPayload({
      data,
      lines,
      docEntry: DocEntry,
      lastLoadedDocType,
      targetDocType: DocumentType.PurchaseQuotation,
      discountPercent,
      freight,
      rounding,
      additionalExpenses,
    });

    // Add attachments to payload
    if (processedAttachments.length > 0) {
      (payload as any).Attachments2_Lines = processedAttachments.map((att) => ({
        FileExtension: att.FileName.split('.').pop(),
        FileName: att.FileName.split('.').slice(0, -1).join('.'),
        SourcePath: att.SourcePath,
        FreeText: att.FreeText,
      }));
    }

    try {
      console.log("Submitting Purchase Quotation with payload:", payload);
      const documentData = await postPurchaseQuotation(payload);
      if (!documentData?.DocEntry) throw new Error("Failed to create quotation");
      loadFromDocument(documentData, DocumentType.Quotation);
      toast.success(`Quotation #${documentData.DocNum} created successfully`);
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create quotation. Please try again.");
      throw error;
    }
  };

  return (
    <PurchaseDocumentLayout
      schema={purchaseQuotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.PurchaseQuotation}
    >
      <div className="flex flex-col gap-6">
        <PurchaseVendorHeader docType={PurchaseDocumentType.PurchaseQuotation} />
        <PurchaseItems />
        <UDFLayout docType={DocumentType.PurchaseQuotation} />
        <PurchaseFooter />
      </div>
    </PurchaseDocumentLayout>
  );
}
