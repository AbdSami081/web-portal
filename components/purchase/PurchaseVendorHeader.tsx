import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppLabel } from "@/components/Custom/AppLabel";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { Loader2, Search, List } from "lucide-react";
import { PurchaseDocumentType } from "@/types/purchase/purchaseDocuments.type";
import {
  getPurchaseOrderDocument,
  getPurchaseDeliveryDocument,
  getPurchaseQuotationDocument,
  getAPInvoiceDocument,
  getPurchaseRequestDocument,
} from "@/api+/sap/purchase/purchaseService";
import { BusinessPartnerSelectorDialog } from "@/modals/BusinessPartnerSelectorDialog";
import { GenericModal } from "@/modals/GenericModal";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessPartner } from "@/types/purchase/businessPartner.type";
import { usePurchaseDocConfig } from "../purchase/PurchaseDocumentLayout";
import { toast } from "sonner";
import { getDocumentsList } from "@/api+/sap/common/documentService";
import { DocumentType } from "@/types/master/DocumentType";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

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

const getResourceName = (type: number) => {
  switch (type) {
    case PurchaseDocumentType.PurchaseRequests:
      return "PurchaseRequests";
    case PurchaseDocumentType.PurchaseQuotation:
      return "PurchaseQuotations";
    case PurchaseDocumentType.PurchaseOrder:
      return "PurchaseOrders";
    case PurchaseDocumentType.GoodsReceiptPO:
      return "PurchaseDeliveryNotes";
    case PurchaseDocumentType.APInvoice:
      return "PurchaseInvoices";
    default:
      return "";
  }
};

export function PurchaseVendorHeader({ docType }: PurchaseVendorHeaderProps) {
  const {
    register,
    watch,
    setValue,
  } = useFormContext();
  const { requester, setRequester, loadFromDocument, setDocDate, setDocDueDate, setTaxDate } = usePurchaseDocument();

  const docEntry = watch("DocEntry");
  const watchedStatus = watch("DocStatus") || "bost_Open";
  const docNum = watch("DocNum");
  const isLoadedDocument = docEntry && Number(docEntry) > 0;
  const isHeaderDisabled = isLoadedDocument && watchedStatus === "bost_Close";
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const [docListModalOpen, setDocListModalOpen] = useState(false);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [skip, setSkip] = useState(0);
  const [listSearch, setListSearch] = useState("");
  const PAGE_SIZE = 20;

  const config = usePurchaseDocConfig();

  const searchRequestIdRef = useRef(0);

  const fetchDocumentsList = useCallback(
    async (isLoadMore = false, searchText?: string) => {
      const resourceName = getResourceName(config.type);
      if (!resourceName) {
        console.error("Resource name not found for docType:", config.type);
        return;
      }

      const requestId = ++searchRequestIdRef.current;
      const currentSkip = isLoadMore ? skip + PAGE_SIZE : 0;

      setIsLoadingList(true);
      try {
        const data = await getDocumentsList(
          resourceName,
          currentSkip,
          PAGE_SIZE,
          searchText,
        );

        if (requestId !== searchRequestIdRef.current) return;

        const newDocs = (data || []).map((d: any) => ({
          ...d,
          DocumentStatus:
            d.DocumentStatus?.replace("bost_", "") || d.DocumentStatus,
        }));

        if (isLoadMore) {
          setDocumentsList((prev) => [...prev, ...newDocs]);
          setSkip(currentSkip);
        } else {
          setDocumentsList(newDocs);
          setSkip(0);
        }
        setHasMore(newDocs.length === PAGE_SIZE);
      } catch (error) {
        if (requestId === searchRequestIdRef.current) {
          toast.error("Failed to fetch documents list.");
        }
      } finally {
        if (requestId === searchRequestIdRef.current) {
          setIsLoadingList(false);
        }
      }
    },
    [config.type, skip, PAGE_SIZE],
  );

  const debouncedFetchDocumentsList = useDebouncedCallback((val: string) => {
    fetchDocumentsList(false, val);
  }, 400);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (docNum) setSearchValue(docNum.toString());
  }, [docNum]);

  useEffect(() => {
    if (requester) {
      setValue("CardCode", requester.CardCode);
      setValue("CardName", requester.CardName);
    }
  }, [requester, setValue]);

  const fetchDocument = async (docNum: string) => {
    let documentData;
    const docNumInt = parseInt(docNum);

    if (isNaN(docNumInt)) {
      toast.error("Invalid Document Number entered.");
      return;
    }

    setIsLoading(true);

    try {
      if (config.type === DocumentType.PurchaseRequests) {
        documentData = await getPurchaseRequestDocument(docNumInt);
      } else if (config.type === DocumentType.PurchaseQuotation) {
        documentData = await getPurchaseQuotationDocument(docNumInt);
      } else if (config.type === DocumentType.PurchaseOrder) {
        documentData = await getPurchaseOrderDocument(docNumInt);
      } else if (config.type === DocumentType.GoodsReceiptPO) {
        documentData = await getPurchaseDeliveryDocument(docNumInt);
      } else if (config.type === DocumentType.APInvoice) {
        documentData = await getAPInvoiceDocument(docNumInt);
      }

      if (!documentData?.DocEntry) {
        toast.info(`Document number ${docNumInt} not found.`);
      } else {
        loadFromDocument(documentData, config.type);
        setValue("DocDate", documentData.DocDate?.split("T")[0]);
        setValue("DocDueDate", documentData.DocDueDate?.split("T")[0]);
        setValue("CardCode", documentData.CardCode);
        setValue("CardName", documentData.CardName);
        setValue("DocStatus", documentData.DocumentStatus);
        setValue("Address2", documentData.Address2);
        setValue("Address", documentData.Address);
        setValue("DocEntry", documentData.DocEntry);
        setValue("DocNum", documentData.DocNum);
        setValue("Comments", documentData.Comments);
        toast.success(`Document ${documentData.DocNum} loaded successfully.`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.info("Document not found.");
      } else {
        toast.error(
          error.message || "An error occurred while fetching the document.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getDateLabel = (type: number) => {
    switch (type) {
      case DocumentType.PurchaseRequests:
        return "Required Date";
      case DocumentType.PurchaseQuotation:
        return "Valid Until";
      case DocumentType.PurchaseOrder:
        return "Delivery Date";
      case DocumentType.APInvoice:
        return "Due Date";
      case DocumentType.GoodsReceiptPO:
        return "Delivery Date";
      default:
        return "Date";
    }
  };

  const handleSelectBP = (bp: BusinessPartner) => {
    setRequester(bp);
    setValue("CardCode", bp.CardCode);
    setValue("CardName", bp.CardName);
    setValue("listNum", bp.PriceListNum);
    setModalOpen(false);
  };

  const handleManualSearch = () => {
    const val = searchInputRef.current?.value || searchValue;
    fetchDocument(val);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        e.stopPropagation();
        setDocListModalOpen(true);
        fetchDocumentsList(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [fetchDocumentsList]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AppLabel className="w-28 shrink-0">Vendor</AppLabel>
          <div className="flex items-center">
            <Input
              id="card-code-field"
              type="text"
              {...register("CardCode")}
              className="h-8 w-48 pr-10"
              placeholder="Card Code"
              disabled
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="ml-2 h-8 w-8 cursor-pointer"
              onClick={() => setModalOpen(true)}
              disabled={isHeaderDisabled}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search document..."
            className="h-8 w-38"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleManualSearch();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={handleManualSearch}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => {
              setDocumentsList([]); 
              setDocListModalOpen(true);
              fetchDocumentsList(false);
            }}
            title="List documents (Ctrl+F)"
          >
            {isLoadingList ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <List className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex flex-col gap-2 w-full lg:w-1/2">
          <div className="flex items-center w-full gap-3">
            <AppLabel className="w-28 shrink-0">Name</AppLabel>
            <Input
              type="text"
              {...register("CardName")}
              className="h-8 w-48"
              placeholder="Card Name"
              disabled
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full lg:w-1/2">
          <div className="flex justify-end items-center w-full gap-3">
            <AppLabel className="w-28 shrink-0 text-right">Status</AppLabel>
            <Select
              value={watchedStatus}
              onValueChange={(val) => setValue("DocStatus", val)}
              disabled={true}
            >
              <SelectTrigger className="w-48">
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

          <div className="flex justify-end items-center w-full gap-3">
            <AppLabel className="w-28 shrink-0 text-right">Posting Date</AppLabel>
            <Input type="date" {...register("DocDate")} className="h-8 w-48" disabled={isHeaderDisabled} onChange={(e) => {
              register("DocDate").onChange(e);
              setDocDate(e.target.value);
            }} />
          </div>

          <div className="flex justify-end items-center w-full gap-3">
            <AppLabel className="w-28 shrink-0 text-right">
              {getDateLabel(config.type)}
            </AppLabel>
            <Input type="date" {...register("DocDueDate")} className="h-8 w-48" disabled={isHeaderDisabled} onChange={(e) => {
              register("DocDueDate").onChange(e);
              setDocDueDate(e.target.value);
            }} />
          </div>

          <div className="flex justify-end items-center w-full gap-3">
            <AppLabel className="w-28 shrink-0 text-right">Document Date</AppLabel>
            <Input type="date" {...register("TaxDate")} className="h-8 w-48" disabled={isHeaderDisabled} onChange={(e) => {
              register("TaxDate").onChange(e);
              setTaxDate(e.target.value);
            }} />
          </div>
        </div>
        <BusinessPartnerSelectorDialog
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSelect={(bp) => {
            handleSelectBP(bp);
            setModalOpen(false);
          }}
          cardType="S"
        />
        <GenericModal
          title={`Select ${getResourceName(config.type).replace(/([A-Z])/g, ' $1').trim()}`}
          open={docListModalOpen}
          onClose={() => setDocListModalOpen(false)}
          onSelect={(val) => {
            fetchDocument(val.toString());
            setDocListModalOpen(false);
          }}
          data={documentsList}
          getSelectValue={(item) => item.DocNum}
          columns={[
            { key: "DocNum", label: "Doc Num" },
            { key: "CardCode", label: "Vendor Code" },
            { key: "CardName", label: "Vendor Name" },
            { key: "DocDate", label: "Date" },
            { key: "DocTotal", label: "Total" },
            { key: "DocumentStatus", label: "Status" },
          ]}
          isLoading={isLoadingList}
          onLoadMore={() => fetchDocumentsList(true, listSearch)}
          hasMore={hasMore}
          onSearch={(value) => {
            setListSearch(value);
            setDocumentsList([]);
            setSkip(0);
            setIsLoadingList(true);
            debouncedFetchDocumentsList(value);
          }}
          searchValue={listSearch}
        />
      </div>
    </div>
  );
}
