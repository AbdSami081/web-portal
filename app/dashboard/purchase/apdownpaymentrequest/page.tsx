"use client";
import { uploadAttachments } from "@/api+/sap/attachments/attachmentService";
import {
  patchAPDownPaymentRequest,
  postAPDownPaymentRequest,
} from "@/api+/sap/purchase/purchaseService";
import { PurchaseDocumentLayout } from "@/components/purchase/PurchaseDocumentLayout";
import { PurchaseFooter } from "@/components/purchase/PurchaseFooter";
import { PurchaseItems } from "@/components/purchase/PurchaseItems";
import { PurchaseVendorHeader } from "@/components/purchase/PurchaseVendorHeader";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { getSapErrorMessage } from "@/lib/errorHelper";
import {
  APDownPaymentRequestFormData,
  APDownPaymentRequestSchema,
} from "@/lib/schemas/purchaseVendorSchemas";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { DocumentType } from "@/types/master/DocumentType";
import { useState } from "react";
import { toast } from "sonner";

export default function APDownPaymentRequestPage() {
  const today = new Date().toISOString().split("T")[0];
  const [defaultValues] = useState<APDownPaymentRequestFormData>({
    CardName: "",
    ContactPersonCode: "",
    DocDate: today,
    DocDueDate: today,
    TaxDate: today,
    DocStatus: "bost_Open",
    Comments: "",
    CardCode: "",
  });
  const handleSubmit = async (data: APDownPaymentRequestFormData) => {
    const {
      lines,
      DocEntry,
      lastLoadedDocType,
      reset: resetStore,
      attachments,
    } = usePurchaseDocument.getState();

    const newAttachments = attachments.filter((att) => att.File);
    const existingAttachments = attachments.filter((att) => !att.File);

    let uploadedAttachments: any[] = [];
    if (newAttachments.length > 0) {
      try {
        const filesToUpload = newAttachments.map((att) => att.File as File);
        const uploadResults = await uploadAttachments(
          filesToUpload,
          "PurchaseDownPayments",
        );

        toast.success(
          `${uploadResults.length} attachments uploaded successfully`,
        );

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

    const processedAttachments = [
      ...existingAttachments,
      ...uploadedAttachments,
    ];

    const payload = {
      ...data,
      DocumentLines: lines.map((line) => {
        const lineData: any = { ...line, DownPaymentType: "dptRequest" };
        if (
          DocEntry &&
          Number(DocEntry) > 0 &&
          lastLoadedDocType &&
          lastLoadedDocType !== DocumentType.APDownPaymentRequest
        ) {
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
        FileExtension: att.FileName.split(".").pop(),
        FileName: att.FileName.split(".").slice(0, -1).join("."),
        SourcePath: att.SourcePath,
        UserID: "1",
        FreeText: att.FreeText,
        CopyToTarget: att.CopyToTarget ? "tYES" : "tNO",
      })),
    };

    console.log(
      "Final AP Down Payment Request Payload:",
      JSON.stringify(payload, null, 2),
    );

    if (
      DocEntry &&
      Number(DocEntry) > 0 &&
      lastLoadedDocType === DocumentType.APDownPaymentRequest
    ) {
      try {
        await patchAPDownPaymentRequest(Number(DocEntry), payload);
        const docNum = usePurchaseDocument.getState().DocNum;
        toast.success(
          `APDownPaymentRequest #${docNum || DocEntry} updated successfully`,
        );
      } catch (error) {
        toast.error("Failed to update AP Down Payment Request");
      }
      return;
    }

    try {
      const response = await postAPDownPaymentRequest(payload);

      if (response?.DocEntry) {
        toast.success(
          `APDownPaymentRequest #${response.DocNum} created successfully!`,
        );
      } else {
        throw new Error("Failed to create AP Down Payment Request");
      }
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(
        message ||
          "Failed to create AP Down Payment Request. Please try again.",
      );
      throw error;
    }
  };

  return (
    <>
      <PurchaseDocumentLayout
        schema={APDownPaymentRequestSchema}
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        docType={DocumentType.APDownPaymentRequest}
        title={"AP Down Payment Request"}
      >
        <div className="flex flex-col gap-6">
          <PurchaseVendorHeader docType={DocumentType.APDownPaymentRequest} />
          <PurchaseItems />
          <UDFLayout docType={DocumentType.APDownPaymentRequest} />
          <PurchaseFooter />
        </div>
      </PurchaseDocumentLayout>
    </>
  );
}
