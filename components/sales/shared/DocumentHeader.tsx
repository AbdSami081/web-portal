import React, { useState, useEffect, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLabel } from "@/components/Custom/AppLabel";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { useSalesDocConfig } from "./SalesDocumentLayout";
import { toast } from "sonner";
import { getDocumentsList, getQuotationDocument, getSalesDeliveryDocument, getSalesOrderDocument, getARInvoiceDocument, getSalesReturnDocument } from "@/api+/sap/sales/salesService";
import { BusinessPartnerSelectorDialog } from "@/modals/BusinessPartnerSelectorDialog";
import { GenericModal } from "@/modals/GenericModal";
import { List } from "lucide-react";
import { DocumentType } from "@/types/master/DocumentType";
import { useUDFStore } from "@/stores/useUDFStore";

const statusMap: Record<string, string> = {
  bost_Open: "Open",
  bost_Close: "Closed",
};


export function DocumentHeader() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { customer, setCustomer, loadFromDocument, clearLines, reset, setDocDate, setDocDueDate, setTaxDate, setCurrency } = useSalesDocument();
  const watchedStatus = watch("DocStatus") || "bost_Open";
  const docEntry = watch("DocEntry");
  const config = useSalesDocConfig();
  const [searchValue, setSearchValue] = useState("");
  const [docListModalOpen, setDocListModalOpen] = useState(false);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;
  const currentDate = new Date().toISOString().split('T')[0];

  const isLoadedDocument = docEntry && Number(docEntry) > 0;
  const isHeaderDisabled = isLoadedDocument && watchedStatus === "bost_Close";

  useEffect(() => {
    if (!watchedStatus && !isLoadedDocument) {
      setValue("DocStatus", "bost_Open");
    }
  }, [watchedStatus, isLoadedDocument, setValue]);

  useEffect(() => {
    if (customer) {
      setValue("CardCode", customer.CardCode);
      setValue("CardName", customer.CardName);
    }
  }, [customer, setValue]);

  const docNum = watch("DocNum");
  useEffect(() => {
    if (docNum) {
      setSearchValue(docNum.toString());
    }
  }, [docNum]);

  const getResourceName = (type: number) => {
    switch (type) {
      case DocumentType.Quotation: return "Quotations";
      case DocumentType.Order: return "Orders";
      case DocumentType.Delivery: return "DeliveryNotes";
      case DocumentType.ARInvoice: return "Invoices";
      case DocumentType.SalesReturn: return "Returns";
      default: return "";
    }
  };

  const fetchDocumentsList = useCallback(async (isLoadMore = false) => {
    const resourceName = getResourceName(config.type);
    if (!resourceName) {
      console.error("Resource name not found for docType:", config.type);
      return;
    }

    const currentSkip = isLoadMore ? skip + PAGE_SIZE : 0;

    setIsLoadingList(true);
    try {
      const data = await getDocumentsList(resourceName, currentSkip, PAGE_SIZE);
      const newDocs = (data || []).map((d: any) => ({
        ...d,
        DocumentStatus: d.DocumentStatus?.replace("bost_", "") || d.DocumentStatus,
      }));

      if (isLoadMore) {
        setDocumentsList(prev => [...prev, ...newDocs]);
        setSkip(currentSkip);
      } else {
        setDocumentsList(newDocs);
        setSkip(0);
      }
      setHasMore(newDocs.length === PAGE_SIZE);

    } catch (error) {
      toast.error("Failed to fetch documents list.");
    } finally {
      setIsLoadingList(false);
    }
  }, [config.type, skip, PAGE_SIZE]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        e.stopPropagation();
        setDocListModalOpen(true);
        fetchDocumentsList(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [fetchDocumentsList]);

  useEffect(() => {
    if (!docListModalOpen) {
      setDocumentsList([]); 
    }
  }, [docListModalOpen]);


  const handleSelectBP = (bp: BusinessPartner) => {
    setCustomer(bp);
    setValue("listNum", bp.PriceListNum);
    
    // Set currency from selected customer
    if (bp.Currency) {
      setCurrency(bp.Currency as any);
    }

    setModalOpen(false);
  };

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const fetchUdfDefinitions = useUDFStore(state => state.fetchDefinitions);

  const fetchDocument = async (docNum: string) => {
    var documentData;
    clearLines();
    const docNumInt = parseInt(docNum);

    if (isNaN(docNumInt)) {
      toast.error("Invalid Document Number entered.");
      return;
    }

    setIsLoading(true);

    try {
      if (config.type === DocumentType.Quotation) {
        documentData = await getQuotationDocument(docNumInt);
      }
      else if (config.type === DocumentType.Order) {
        documentData = await getSalesOrderDocument(docNumInt);
      }
      else if (config.type === DocumentType.Delivery) {
        documentData = await getSalesDeliveryDocument(docNumInt);
      }
      else if (config.type === DocumentType.ARInvoice) {
        documentData = await getARInvoiceDocument(docNumInt);
      }
      else if (config.type === DocumentType.SalesReturn) {
        documentData = await getSalesReturnDocument(docNumInt);
      }

      if (!documentData?.DocEntry) {
        toast.info(`Document number ${docNumInt} not found.`);
      } else {
        fetchUdfDefinitions(config.type, true);

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
        toast.error(error.message || "An error occurred while fetching the document.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = () => {
    const val = searchInputRef.current?.value || searchValue;
    fetchDocument(val);
  };


  const getDateLabel = (type: number) => {
    switch (type) {
      case DocumentType.Order:
        return 'Delivery Date';
      case DocumentType.Quotation:
        return 'Valid Until';
      case DocumentType.ARInvoice:
        return 'Due Date';
      case DocumentType.Delivery:
        return 'Delivery Date';
      case DocumentType.SalesReturn:
        return 'Due Date';
      default:
        return 'Date';
    }
  };


  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AppLabel className="w-28 shrink-0">Customer</AppLabel>
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
              onClick={() => {
                setModalOpen(true);
              }}
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
          cardType="C"
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
            { key: "CardCode", label: "Customer Code" },
            { key: "CardName", label: "Customer Name" },
            { key: "DocDate", label: "Date" },
            { key: "DocTotal", label: "Total" },
            { key: "DocumentStatus", label: "Status" },
          ]}
          isLoading={isLoadingList}
          onLoadMore={() => fetchDocumentsList(true)}
          hasMore={hasMore}
        />
      </div>
    </div>
  );
}
