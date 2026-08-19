"use client";

import { useState } from "react";
import { toast } from "sonner";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { PurchaseDocumentType } from "@/types/purchase/purchaseDocuments.type";
import { PurchaseDocumentLayout } from "@/components/purchase/PurchaseDocumentLayout";
import { PurchaseVendorHeader } from "@/components/purchase/PurchaseVendorHeader";
import { PurchaseItems } from "@/components/purchase/PurchaseItems";
import { PurchaseFooter } from "@/components/purchase/PurchaseFooter";
import { apInvoiceSchema, APInvoiceFormData } from "@/lib/schemas/purchaseVendorSchemas";
import { DocumentType } from "@/types/master/DocumentType";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { patchReservePurchaseInvoice, postReservePurchaseInvoice } from "@/api+/sap/purchase/purchaseService";
import { uploadAttachments } from "@/api+/sap/attachments/attachmentService";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { buildPurchaseDocumentPayload, buildPurchaseDocumentPatchPayload } from "@/lib/sap/helpers/purchasePayloadHelper";

const today = new Date().toISOString().split("T")[0];

export default function NewReserveInvoicePage() {
  const [defaultValues] = useState<APInvoiceFormData>({
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

  const handleSubmit = async (data: APInvoiceFormData) => {
    const { lines, DocEntry, lastLoadedDocType, attachments, discountPercent, freight, rounding, additionalExpenses } = usePurchaseDocument.getState();

    const newAttachments = attachments.filter(att => att.File);
    const existingAttachments = attachments.filter(att => !att.File);

    let uploadedAttachments: any[] = [];
    if (newAttachments.length > 0) {
      try {
        const filesToUpload = newAttachments.map(att => att.File as File);
        const uploadResults = await uploadAttachments(filesToUpload, "ReservePurchaseInvoice");
        
        toast.success(`${uploadResults.length} attachments uploaded successfully`);

        uploadedAttachments = newAttachments.map((att, index) => ({
          ...att,
          SourcePath: uploadResults[index].path,
        }));
      } catch (error) {
        console.error("Failed to upload attachments", error);
        toast.error("Failed to upload attachments");
        return;
      }
    }

    const processedAttachments = [...existingAttachments, ...uploadedAttachments];

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.APReserveInvoice) {
      const payload = buildPurchaseDocumentPatchPayload({
        data,
        lines,
        discountPercent,
        freight,
        rounding,
        additionalExpenses,
      });

      if (processedAttachments.length > 0) {
        (payload as any).Attachments2_Lines = processedAttachments.map((att) => ({
          FileExtension: att.FileName.split('.').pop(),
          FileName: att.FileName.split('.').slice(0, -1).join('.'),
          SourcePath: att.SourcePath,
          FreeText: att.FreeText,
          CopyToTarget: att.CopyToTarget ? "tYES" : "tNO",
        }));
      }

      try {
        await patchReservePurchaseInvoice(Number(DocEntry), payload);
        const docNum = usePurchaseDocument.getState().DocNum;
        toast.success(`A/P Reserve Invoice #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        const message = getSapErrorMessage(error);
        toast.error(message || "Failed to update A/P Reserve Invoice");
        throw error;
      }
      return;
    }

    const payload = buildPurchaseDocumentPayload({
      data,
      lines,
      docEntry: DocEntry,
      lastLoadedDocType,
      targetDocType: DocumentType.APReserveInvoice,
      discountPercent,
      freight,
      rounding,
      additionalExpenses,
    });

    if (processedAttachments.length > 0) {
      (payload as any).Attachments2_Lines = processedAttachments.map((att) => ({
        FileExtension: att.FileName.split('.').pop(),
        FileName: att.FileName.split('.').slice(0, -1).join('.'),
        SourcePath: att.SourcePath,
        UserID: "1",
        FreeText: att.FreeText,
        CopyToTarget: att.CopyToTarget ? "tYES" : "tNO",
      }));
    }

    try {
      const response = await postReservePurchaseInvoice(payload);

      if (response?.DocEntry) {
        toast.success(`A/P Reserve Invoice #${response.DocNum} created successfully!`);
      } else {
        throw new Error("Failed to create A/P Reserve Invoice");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create A/P Reserve Invoice. Please try again.");
      throw error;
    }
  };

  return (
    <PurchaseDocumentLayout
      schema={apInvoiceSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.APReserveInvoice}
    >
      <div className="flex flex-col gap-6">
        <PurchaseVendorHeader docType={PurchaseDocumentType.APReserveInvoice} />
        <PurchaseItems />
        <UDFLayout docType={DocumentType.APReserveInvoice} />
        <PurchaseFooter />
      </div>
    </PurchaseDocumentLayout>
  );
}
