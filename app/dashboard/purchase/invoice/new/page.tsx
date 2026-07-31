"use client"
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
import { patchPurchaseInvoice, postPurchaseInvoice } from "@/api+/sap/purchase/purchaseService";
import { uploadAttachments } from "@/api+/sap/attachments/attachmentService";
import { UDFLayout } from "@/components/shared/UDFSheet";

const today = new Date().toISOString().split("T")[0];

export default function NewAPInvoicePage() {
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
    const { lines, DocEntry, lastLoadedDocType, attachments } = usePurchaseDocument.getState();

    const newAttachments = attachments.filter(att => att.File);
    const existingAttachments = attachments.filter(att => !att.File);

    let uploadedAttachments: any[] = [];
    if (newAttachments.length > 0) {
      try {
        const filesToUpload = newAttachments.map(att => att.File as File);
        const uploadResults = await uploadAttachments(filesToUpload, "PurchaseOrder");
        
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

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.Order) {
      const payload = {
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
        await patchPurchaseInvoice(Number(DocEntry), payload);
        const docNum = usePurchaseDocument.getState().DocNum;
        toast.success(`AP Invoice #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update AP Invoice");
      }
      return;
    }

    const payload = {
      ...data,
      DocumentLines: lines.map((line) => {
        const lineData: any = { ...line };

        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.Order) {
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
      Attachments2_Lines: processedAttachments.map((att) => ({
        FileExtension: att.FileName.split('.').pop(),
        FileName: att.FileName.split('.').slice(0, -1).join('.'),
        SourcePath: att.SourcePath,
        UserID: "1",
        FreeText: att.FreeText
      }))
    };

    try {
      const response = await postPurchaseInvoice(payload);

      if (response?.DocEntry) {
        toast.success(`AP Invoice #${response.DocNum} created successfully!`);
      } else {
        throw new Error("Failed to create AP Invoice");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create AP Invoice. Please try again.");
      throw error;
    }
  };

  return (
    <PurchaseDocumentLayout
      schema={apInvoiceSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.APInvoice}
    >
      <div className="flex flex-col gap-6">
        <PurchaseVendorHeader docType={PurchaseDocumentType.APInvoice} />
        <PurchaseItems />
        <UDFLayout docType={DocumentType.APInvoice} />
        <PurchaseFooter />
      </div>
    </PurchaseDocumentLayout>
  );
}
