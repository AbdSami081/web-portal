"use client"
import { useState } from "react";
import { toast } from "sonner";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { PurchaseDocumentType } from "@/types/purchase/purchaseDocuments.type";
import { PurchaseDocumentLayout } from "@/components/purchase/PurchaseDocumentLayout";
import { PurchaseVendorHeader } from "@/components/purchase/PurchaseVendorHeader";
import { PurchaseItems } from "@/components/purchase/PurchaseItems";
import { PurchaseFooter } from "@/components/purchase/PurchaseFooter";
import { goodsReceiptPOSchema, GoodsReceiptPOFormData } from "@/lib/schemas/purchaseVendorSchemas";

const today = new Date().toISOString().split("T")[0];

export default function NewGoodsReceiptPOPage() {
  const { lines, DocTotal, TaxTotal, freight, discountPercent } = usePurchaseDocument();

  const [defaultValues] = useState<GoodsReceiptPOFormData>({
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

  const handleSubmit = async (data: GoodsReceiptPOFormData) => {
    if (lines.length === 0) { toast.error("Please add at least one item."); return; }
    const payload = { ...data, DocTotal, DiscountPercent: discountPercent, Freight: freight, TaxTotal, DocumentLines: lines };
    toast.success("Goods Receipt PO payload ready — check console.");
  };

  return (
    <PurchaseDocumentLayout
      schema={goodsReceiptPOSchema}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      docType={PurchaseDocumentType.GoodsReceiptPO}
    >
      <div className="flex flex-col gap-6">
        <PurchaseVendorHeader docType={PurchaseDocumentType.GoodsReceiptPO} />
        <PurchaseItems />
        <PurchaseFooter />
      </div>
    </PurchaseDocumentLayout>
  );
}
