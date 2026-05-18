import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppLabel } from "@/components/Custom/AppLabel";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { Loader2, Search } from "lucide-react";
import { PurchaseDocumentType } from "@/types/purchase/purchaseDocuments.type";
import { BusinessPartnerSelectorDialog } from "@/modals/BusinessPartnerSelectorDialog";
import { BusinessPartner } from "@/types/sales/businessPartner.type";

const statusMap: Record<string, string> = {
  bost_Open: "Open",
  bost_Close: "Closed",
};

const dateLabel2: Record<number, string> = {
  [PurchaseDocumentType.PurchaseQuotation]: "Valid Until",
  [PurchaseDocumentType.PurchaseOrder]: "Delivery Date",
  [PurchaseDocumentType.GoodsReceiptPO]: "Due Date",
  [PurchaseDocumentType.APInvoice]: "Due Date",
};

interface PurchaseVendorHeaderProps {
  docType: PurchaseDocumentType;
}

export function PurchaseVendorHeader({ docType }: PurchaseVendorHeaderProps) {
  const { register, watch, setValue } = useFormContext();
  const { vendor, setVendor, setDocDate, setDocDueDate, setTaxDate } = usePurchaseDocument();

  const watchedStatus = watch("DocStatus") || "bost_Open";
  const docNum = watch("DocNum");

  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (docNum) setSearchValue(docNum.toString());
  }, [docNum]);

  useEffect(() => {
    if (vendor) {
      setValue("CardCode", vendor.CardCode);
      setValue("CardName", vendor.CardName);
    }
  }, [vendor, setValue]);

  const fetchDocument = async (value: string) => {
    if (!value) return;
    setIsLoading(true);
    try {
      console.log(`Fetch ${docType} DocNum:`, value);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVendor = (bp: BusinessPartner) => {
    setVendor(bp);
    setModalOpen(false);
  };

  const dueDateLabel = dateLabel2[docType] || "Valid Until";

  const showDueDate = docType !== PurchaseDocumentType.APInvoice;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
      {/* Left Column */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Vendor</AppLabel>
          <div className="col-span-2 flex items-center gap-2">
            <Input {...register("CardCode")} className="bg-yellow-50 flex-1" placeholder="Vendor Code" readOnly />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer shrink-0"
              onClick={() => setModalOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Name</AppLabel>
          <div className="col-span-2">
            <Input {...register("CardName")} readOnly className="bg-slate-50" />
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Input
            type="text"
            placeholder="Search document..."
            className="h-8 w-44"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); fetchDocument(searchValue); }
            }}
          />
          <Button type="button" variant="outline" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => fetchDocument(searchValue)}>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </Button>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Status</AppLabel>
          <div className="col-span-2">
            <div className="h-8 px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-900 flex items-center">
              {statusMap[watchedStatus] || watchedStatus}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Posting Date</AppLabel>
          <div className="col-span-2">
            <Input type="date" {...register("DocDate")} onChange={(e) => setDocDate(e.target.value)} required className="h-8" />
          </div>
        </div>

        {showDueDate && (
          <div className="grid grid-cols-3 items-center gap-4">
            <AppLabel>{dueDateLabel}</AppLabel>
            <div className="col-span-2">
              <Input type="date" {...register("DocDueDate")} onChange={(e) => setDocDueDate(e.target.value)} required className="h-8" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Document Date</AppLabel>
          <div className="col-span-2">
            <Input type="date" {...register("TaxDate")} onChange={(e) => setTaxDate(e.target.value)} required className="h-8" />
          </div>
        </div>
      </div>

      <BusinessPartnerSelectorDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectVendor}
        cardType="S"
      />
    </div>
  );
}
