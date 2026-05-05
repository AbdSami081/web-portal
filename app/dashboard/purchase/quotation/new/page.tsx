"use client"
import { useState } from "react";
import { toast } from "sonner";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { PurchaseDocumentType } from "@/types/purchase/purchaseDocuments.type";
import { PurchaseDocumentLayout } from "@/components/purchase/PurchaseDocumentLayout";
import { PurchaseVendorHeader } from "@/components/purchase/PurchaseVendorHeader";
import { PurchaseItems } from "@/components/purchase/PurchaseItems";
import { PurchaseFooter } from "@/components/purchase/PurchaseFooter";
import { purchaseQuotationSchema, PurchaseQuotationFormData } from "@/lib/schemas/purchaseVendorSchemas";

const today = new Date().toISOString().split("T")[0];

export default function NewPurchaseQuotationPage() {
  const { lines, DocTotal, TaxTotal, freight, discountPercent } = usePurchaseDocument();

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
    if (lines.length === 0) { toast.error("Please add at least one item."); return; }
    const payload = { ...data, DocTotal, DiscountPercent: discountPercent, Freight: freight, TaxTotal, DocumentLines: lines };
    console.log("Purchase Quotation Payload:", payload);
    toast.success("Purchase Quotation payload ready — check console.");
  };

  return (
    <PurchaseDocumentLayout
      schema={purchaseQuotationSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={PurchaseDocumentType.PurchaseQuotation}
    >
      <div className="flex flex-col gap-6">
        <PurchaseVendorHeader docType={PurchaseDocumentType.PurchaseQuotation} />
        <PurchaseItems />
        <PurchaseFooter />
      </div>
    </PurchaseDocumentLayout>
  );
}
