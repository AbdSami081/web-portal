"use client"
import { useState } from "react";
import { toast } from "sonner";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { PurchaseDocumentLayout } from "@/components/purchase/PurchaseDocumentLayout";
import {PurchaseVendorHeader}  from "@/components/purchase/PurchaseVendorHeader";
import { PurchaseItems } from "@/components/purchase/PurchaseItems";
import { PurchaseFooter } from "@/components/purchase/PurchaseFooter";
import { APCreditMemoFormData, apCreditMemoSchema} from "@/lib/schemas/purchaseVendorSchemas";
import { DocumentType } from "@/types/master/DocumentType";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { patchApCreditMemo, postApCreditMemo, } from "@/api+/sap/purchase/purchaseService";
import { uploadAttachments } from "@/api+/sap/attachments/attachmentService";
import { UDFLayout } from "@/components/shared/UDFSheet";

const today = new Date().toISOString().split("T")[0];

export default function APCreditMemoPage() {
  // const { lines, DocTotal, TaxTotal, freight, discountPercent } = usePurchaseDocument();

  const [defaultValues] = useState<APCreditMemoFormData>({
    CardCode:"",
    CardName: "",
    ContactPersonCode: "",
    DocDate: today,
    DocDueDate: today,
    TaxDate: today,
    DocStatus: "bost_Open",
    BPL_IDAssignedToInvoice:5,
    Comments: "",
  });

  const handleSubmit = async (data: APCreditMemoFormData) => {
    const { lines, DocEntry, lastLoadedDocType, reset: resetStore, attachments } = usePurchaseDocument.getState();
    
    const newAttachments = attachments.filter(att => att.File);
    const existingAttachments = attachments.filter(att => !att.File);

    let uploadedAttachments: any[] = [];
    if (newAttachments.length > 0) {
      try {
        const filesToUpload = newAttachments.map(att => att.File as File);
        const uploadResults = await uploadAttachments(filesToUpload, "APCreditMemo");
        
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
    
    const payload = {
      ...data,
      DocumentLines: lines.map((line) => {
        const lineData: any = { ...line };

        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.APCreditMemo) {
          lineData.BaseType = lastLoadedDocType;
          lineData.BaseEntry = DocEntry;
          lineData.BaseLine = line.LineNum;
        } else if (!(DocEntry && Number(DocEntry) > 0)) {
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
        FreeText: att.FreeText,
        CopyToTarget: att.CopyToTarget ? "tYES" : "tNO",
      }))
    };

    console.log("Final AP Credit Memo Payload:", JSON.stringify(payload, null, 2));

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.APCreditMemo) {
      try {
        await patchApCreditMemo(Number(DocEntry), payload);
        const docNum = usePurchaseDocument.getState().DocNum;
        toast.success(`AP Credit Memo #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update Credit Memo");
      }
      return;
    }

    try {
      const response = await postApCreditMemo(payload);
   
      if (response?.DocEntry) {
        toast.success(`AP Credit Memo #${response.DocNum} created successfully!`);
      } else {
        throw new Error("Failed  to create Ap Credit Memo");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create Ap Credit Memo. Please try again.");
      throw error;
    }
  };

  return (
    <PurchaseDocumentLayout
      schema={apCreditMemoSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.APCreditMemo}
    >
      <div className="flex flex-col gap-6">
        <PurchaseVendorHeader docType={Number(DocumentType.APCreditMemo)} />
        <PurchaseItems />
          <UDFLayout docType={DocumentType.APCreditMemo} />
        <PurchaseFooter />
      </div>
    </PurchaseDocumentLayout>
  );
}
