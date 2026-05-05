"use client"
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { PurchaseDocumentType } from "@/types/purchase/purchaseDocuments.type";
import { PurchaseDocumentLayout } from "@/components/purchase/PurchaseDocumentLayout";
import { PurchaseHeader } from "@/components/purchase/PurchaseHeader";
import { PurchaseItems } from "@/components/purchase/PurchaseItems";
import { PurchaseFooter } from "@/components/purchase/PurchaseFooter";
import { purchaseRequestSchema, PurchaseRequestFormData } from "@/lib/schemas/purchaseRequestSchema";
import { postPurchaseRequest } from "@/api+/sap/purchase/purchaseService";

export default function NewPurchaseRequestPage() {
  const { lines, DocTotal, DocEntry, freight, TaxTotal, discountPercent, requester, requesterName, branch, department } = usePurchaseDocument();

  const [defaultValues, setDefaultValues] = useState<PurchaseRequestFormData>({
    Requester: "",
    RequesterName: "",
    Branch: "",
    Department: "",
    DocDate: new Date().toISOString().split("T")[0],
    DocDueDate: new Date().toISOString().split("T")[0],
    TaxDate: new Date().toISOString().split("T")[0],
    RequiredDate: new Date().toISOString().split("T")[0],
    DocumentLines: [],
    DocStatus: "bost_Open",
    Comments: "",
  });

  const handleSubmit = async (data: PurchaseRequestFormData) => {
    // Basic validation
    if (lines.length === 0) {
      toast.error("Please add at least one item to the document.");
      return;
    }

    if (DocEntry && Number(DocEntry) > 0) {
      toast.error("Updating Purchase Requests is not yet implemented.");
      return;
    }

    const payload = {
      ...data,
      Requester: requester,
      RequesterName: requesterName,
      Branch: branch,
      Department: department,
      DocTotal,
      DiscountPercent: discountPercent,
      DocumentLines: lines.map(line => ({
        ...line,
        Quantity: Number(line.Quantity) || 0,
        Price: Number(line.Price) || 0,
      })),
      Freight: freight,
      TaxTotal: TaxTotal,
    };

    try {
      console.log("Purchase Request Payload (Request):", payload);
      // const documentData = await postPurchaseRequest(payload);
      // console.log("Purchase Request Data (Response):", documentData);
      // toast.success(`Purchase Request #${documentData?.DocNum || "Created"} successfully`);
      toast.success("Purchase Request payload generated! Check console.");
    } catch (error: any) {
      toast.error("Failed to create Purchase Request.");
      console.error(error);
    }
  };

  return (
    <PurchaseDocumentLayout
      schema={purchaseRequestSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={PurchaseDocumentType.PurchaseRequest}
    >
      <div className="flex flex-col gap-6">
        <PurchaseHeader />
        <PurchaseItems />
        <PurchaseFooter />
      </div>
    </PurchaseDocumentLayout>
  );
}
