"use client"
import { useState } from "react";
import { toast } from "sonner";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { PurchaseDocumentLayout } from "@/components/purchase/PurchaseDocumentLayout";
import { PurchaseVendorHeader } from "@/components/purchase/PurchaseVendorHeader";
import { PurchaseItems } from "@/components/purchase/PurchaseItems";
import { PurchaseFooter } from "@/components/purchase/PurchaseFooter";
import { GoodsReturnRequestSchema, GoodsReturnRequestFormData } from "@/lib/schemas/purchaseVendorSchemas";
import { DocumentType } from "@/types/master/DocumentType";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { patchGoodsReturnRequest , postGoodsReturnRequest } from "@/api+/sap/purchase/purchaseService";
import { uploadAttachments } from "@/api+/sap/attachments/attachmentService";
import { UDFLayout } from "@/components/shared/UDFSheet";
const today = new Date().toISOString().split("T")[0];

export default function GoodsReturnRequestPage() {
  // const { lines, DocTotal, TaxTotal, freight, discountPercent } = usePurchaseDocument();

  const [defaultValues] = useState<GoodsReturnRequestFormData>({
    CardCode: "",
    CardName: "",
    ContactPersonCode: "",
    NumAtCard: "",
    DocDate: today,
    DocDueDate: today,
    TaxDate: today,
    DocStatus: "bost_Open",
    Comments: "",
    BPL_IDAssignedToInvoice:5,
    DocNum: 0,
    DocEntry: 0,
  });

  const handleSubmit = async (data: GoodsReturnRequestFormData) => {
    const { lines, DocEntry, lastLoadedDocType, reset: resetStore, attachments } = usePurchaseDocument.getState();
    
    const newAttachments = attachments.filter(att => att.File);
    const existingAttachments = attachments.filter(att => !att.File);

    let uploadedAttachments: any[] = [];
    if (newAttachments.length > 0) {
      try {
        const filesToUpload = newAttachments.map(att => att.File as File);
        const uploadResults = await uploadAttachments(filesToUpload, "GoodsReturnRequest");
        
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

        if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType && lastLoadedDocType !== DocumentType.Delivery) {
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

    console.log("Final Goods Return Request Payload:", JSON.stringify(payload, null, 2));

    if (DocEntry && Number(DocEntry) > 0 && lastLoadedDocType === DocumentType.GoodsReceiptPO) {
      try {
        await patchGoodsReturnRequest(Number(DocEntry), payload);
        const docNum = usePurchaseDocument.getState().DocNum;
        toast.success(`Goods Return Request #${docNum || DocEntry} updated successfully`);
      } catch (error) {
        toast.error("Failed to update Goods Return Request");
      }
      return;
    }

    try {
      const response = await postGoodsReturnRequest(payload);
   
      if (response?.DocEntry) {
        toast.success(`Goods Return Request #${response.DocNum} created successfully!`);
      } else {
        throw new Error("Failed to create Goods Return Request");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to create Goods Return Request. Please try again.");
      throw error;
    }
  };

  return (
    <PurchaseDocumentLayout
      schema={GoodsReturnRequestSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={DocumentType.GoodsReturnRequest}
    >
      <div className="flex flex-col gap-6">
        <PurchaseVendorHeader docType={DocumentType.GoodsReturnRequest} />
        <PurchaseItems />
          <UDFLayout docType={DocumentType.GoodsReturnRequest} />
        <PurchaseFooter />
      </div>
    </PurchaseDocumentLayout>
  );
}
