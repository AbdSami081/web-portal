import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppLabel } from "@/components/Custom/AppLabel";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { closePurchaseOrder, closePurchaseQuotation, closePurchaseRequest, closePurchaseDeliveryNote, closePurchaseInvoice, closePurchaseReturn, closePurchaseCreditNote } from "@/api+/sap/purchase/purchaseService";
import { ConfirmationModal } from "@/modals/ConfirmationModal";
import { DocumentType } from "@/types/master/DocumentType";

const statusMap: Record<string, string> = {
  bost_Open: "Open",
  bost_Close: "Closed",
};

export function PurchaseHeader() {
  const { register, watch, setValue } = useFormContext();
  const { setDocDate, requester, setDocDueDate, setTaxDate, setRequiredDate, setRequester, setRequesterName, setBranch, setDepartment, DocEntry, lastLoadedDocType } = usePurchaseDocument();

  const watchedStatus = watch("DocStatus") || "bost_Open";
  const docNum = watch("DocNum");
  const docEntry = watch("DocEntry");

  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const isLoadedDocument = !!docEntry && Number(docEntry) > 0;
  const isHeaderDisabled = isLoadedDocument && watchedStatus === "bost_Close";
  const canChangeStatus = isLoadedDocument && !isClosing && watchedStatus === "bost_Open";

  const closeDocumentByType = (type: number | null, entry: number) => {
    switch (type) {
      case DocumentType.Order: return closePurchaseOrder(entry);
      case DocumentType.PurchaseQuotation: return closePurchaseQuotation(entry);
      case DocumentType.PurchaseRequests: return closePurchaseRequest(entry);
      case DocumentType.GoodsReceiptPO: return closePurchaseDeliveryNote(entry);
      case DocumentType.APInvoice: return closePurchaseInvoice(entry);
      case DocumentType.GoodsReturn: return closePurchaseReturn(entry);
      case DocumentType.APCreditMemo: return closePurchaseCreditNote(entry);
      default: return Promise.reject(new Error("Close is not supported for this document type"));
    }
  };

  const handleCloseDocument = async (entry: number) => {
    if (isClosing) return;
    setIsClosing(true);
    setValue("DocStatus", "bost_Close");
    try {
      await closeDocumentByType(lastLoadedDocType, entry);
      toast.success("Document closed successfully");
    } catch (error: any) {
      setValue("DocStatus", "bost_Open");
      toast.error(error?.response?.data?.error || "Failed to close document");
    } finally {
      setIsClosing(false);
      setCloseModalOpen(false);
    }
  };

  useEffect(() => {
    if (docNum) setSearchValue(docNum.toString());
  }, [docNum]);

  const fetchDocument = async (value: string) => {
    if (!value) return;
    setIsLoading(true);
    try {
      console.log("Fetch Purchase Request DocNum:", value);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (requester) {
      setValue("CardCode", requester.CardCode);
      setValue("CardName", requester.CardName);
    }
  }, [requester, setValue]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Requester</AppLabel>
          <div className="col-span-2">
            <Input
              {...register("Requester")}
              className="bg-yellow-50"
              onChange={(e) => setRequester(e.target.value as any)}
              placeholder="e.g. USER"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Requester Name</AppLabel>
          <div className="col-span-2">
            <Input
              {...register("RequesterName")}
              onChange={(e) => setRequesterName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Branch</AppLabel>
          <div className="col-span-2">
            <Input
              {...register("Branch")}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. Main"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Department</AppLabel>
          <div className="col-span-2">
            <Input
              {...register("Department")}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. General"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-end gap-2">
          <Input
            type="text"
            placeholder="Search document..."
            className="h-8 w-44"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                fetchDocument(searchValue);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => fetchDocument(searchValue)}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Status</AppLabel>
          <div className="col-span-2">
            <Select
              value={watchedStatus}
              onValueChange={(val) => {
                if (val === "bost_Close") {
                  setCloseModalOpen(true);
                } else {
                  setValue("DocStatus", val);
                }
              }}
              disabled={!canChangeStatus}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Select Status</SelectLabel>
                  {Object.entries(statusMap).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ConfirmationModal
          open={closeModalOpen}
          onOpenChange={setCloseModalOpen}
          title="Close Document"
          description="Are you sure you want to close this document? Once closed, it cannot be edited."
          cancelText="No"
          confirmText="Yes"
          onConfirm={() => {
            if (docEntry) {
              handleCloseDocument(Number(docEntry));
            }
          }}
          onCancel={() => setCloseModalOpen(false)}
        />

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Posting Date</AppLabel>
          <div className="col-span-2">
            <Input type="date" {...register("DocDate")} onChange={(e) => setDocDate(e.target.value)} required className="h-8" />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Valid Until</AppLabel>
          <div className="col-span-2">
            <Input type="date" {...register("DocDueDate")} onChange={(e) => setDocDueDate(e.target.value)} required className="h-8" />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Document Date</AppLabel>
          <div className="col-span-2">
            <Input type="date" {...register("TaxDate")} onChange={(e) => setTaxDate(e.target.value)} required className="h-8" />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Required Date</AppLabel>
          <div className="col-span-2">
            <Input type="date" {...register("RequiredDate")} onChange={(e) => setRequiredDate(e.target.value)} className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
