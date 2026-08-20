import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLabel } from "@/components/Custom/AppLabel";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { useSalesDocConfig } from "./SalesDocumentLayout";
import { getFieldSettings } from "@/lib/config/Client/clientSettings";
import { toast } from "sonner";
import { getDocumentsList, getQuotationDocument, getSalesDeliveryDocument, getSalesOrderDocument, getARInvoiceDocument, getSalesReturnDocument, getDraftDocument, closeQuotation, closeSalesOrder, closeDeliveryNote, closeARInvoice, closeSalesReturn, getSalesReturnRequestDocument, getSalesCreditMemoDocument, getARDownPaymentRequestDocument, getARDownPaymentInvoiceDocument } from "@/api+/sap/sales/salesService";
import { BusinessPartnerSelectorDialog } from "@/modals/BusinessPartnerSelectorDialog";
import { ConfirmationModal } from "@/modals/ConfirmationModal";
import { GenericModal } from "@/modals/GenericModal";
import { List } from "lucide-react";
import { DocumentType } from "@/types/master/DocumentType";
import { useUDFStore } from "@/stores/useUDFStore";
import { useSearchParams } from "next/navigation";
import { useDocNavParams } from "@/lib/docNavParams";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";

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
  const [listSearch, setListSearch] = useState("");
  const PAGE_SIZE = 20;

  // Use a real boolean so falsy short-circuits never render stray "0" in the DOM.
  const isLoadedDocument = !!docEntry && Number(docEntry) > 0;
  const isHeaderDisabled = isLoadedDocument && watchedStatus === "bost_Close";
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const closeDocumentByType = (type: number, entry: number) => {
    switch (type) {
      case DocumentType.Quotation: return closeQuotation(entry);
      case DocumentType.Order: return closeSalesOrder(entry);
      case DocumentType.Delivery: return closeDeliveryNote(entry);
      case DocumentType.ARInvoice: return closeARInvoice(entry);
      case DocumentType.SalesReturn: return closeSalesReturn(entry);
      default: return Promise.reject(new Error("Close is not supported for this document type"));
    }
  };

  const handleCloseDocument = async (entry: number) => {
    if (isClosing) return;
    setIsClosing(true);
    setValue("DocStatus", "bost_Close");
    try {
      await closeDocumentByType(config.type, entry);
      toast.success("Document closed successfully");
    } catch (error: any) {
      setValue("DocStatus", "bost_Open");
      toast.error(error?.response?.data?.error || error?.response?.data?.message || "Failed to close document");
    } finally {
      setIsClosing(false);
      setCloseModalOpen(false);
    }
  };

  // Status can only be changed when an OPEN document is loaded (edit mode).
  const canChangeStatus = isLoadedDocument && !isClosing && watchedStatus === "bost_Open";
  const searchParams = useSearchParams();
  const docNav = useDocNavParams();
  const autoCreatedRef = React.useRef(false);

  useEffect(() => {
    const draftParam = (docNav.draft ?? searchParams.get("draft")) === "1";

    const docEntryParam = docNav.docEntry ?? searchParams.get("docEntry") ?? "";
    const draftEntryParam = docNav.draftEntry ?? searchParams.get("draftEntry") ?? "";

    // Only auto-fetch if we have a regular docEntry, or a proper draftEntry with draft=1 flag
    if (!docEntryParam && !(draftParam && draftEntryParam)) return;

    setSearchValue(docEntryParam);
    fetchDocument(docEntryParam, { isDraft: draftParam }, Number(draftEntryParam));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      case DocumentType.SalesReturnRequest: return "ReturnRequest";
      case DocumentType.ARDownPaymentRequest: return "DownPayments";
      case DocumentType.ARDownPaymentInvoice: return "DownPayments";
      case DocumentType.ARCreditMemo: return "CreditNotes";
      default: return "";
    }
  };

  const searchRequestIdRef = useRef(0);

  const fetchDocumentsList = useCallback(async (isLoadMore = false, searchText?: string) => {
    const resourceName = getResourceName(config.type);
    if (!resourceName) {
      console.error("Resource name not found for docType:", config.type);
      return;
    }

    const requestId = ++searchRequestIdRef.current;
    const currentSkip = isLoadMore ? skip + PAGE_SIZE : 0;

    setIsLoadingList(true);
    try {
      const data = await getDocumentsList(resourceName, currentSkip, PAGE_SIZE, searchText);

      if (requestId !== searchRequestIdRef.current) return;

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
      if (requestId === searchRequestIdRef.current) {
        toast.error("Failed to fetch documents list.");
      }
    } finally {
      if (requestId === searchRequestIdRef.current) {
        setIsLoadingList(false);
      }
    }
  }, [config.type, skip, PAGE_SIZE]);

  const debouncedFetchDocumentsList = useDebouncedCallback((val: string) => {
    fetchDocumentsList(false, val);
  }, 400);

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
    
    if (bp.Currency) {
      setCurrency(bp.Currency as any);
    }

    setModalOpen(false);
  };

  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const fetchUdfDefinitions = useUDFStore(state => state.fetchDefinitions);

  const fetchDocument = async (
  docNum: string,
  opts?: { isDraft?: boolean },
  draftEntry?: number
) => {
  let documentData;

  clearLines();
  setIsLoading(true);

  try {
    if (opts?.isDraft && draftEntry) {
      documentData = await getDraftDocument(draftEntry);
    } else {
      const docNumInt = parseInt(docNum);

      if (isNaN(docNumInt)) {
        toast.error("Invalid Document Number entered.");
        return;
      }

      switch (config.type) {
        case DocumentType.Quotation:
          documentData = await getQuotationDocument(docNumInt);
          break;

        case DocumentType.Order:
          documentData = await getSalesOrderDocument(docNumInt);
          break;

        case DocumentType.Delivery:
          documentData = await getSalesDeliveryDocument(docNumInt);
          break;

        case DocumentType.ARInvoice:
          documentData = await getARInvoiceDocument(docNumInt);
          break;

        case DocumentType.SalesReturn:
          documentData = await getSalesReturnDocument(docNumInt);
          break;

        case DocumentType.SalesReturnRequest:
          documentData = await getSalesReturnRequestDocument(docNumInt);
          break;

        case DocumentType.ARDownPaymentRequest:
          documentData = await getARDownPaymentRequestDocument(docNumInt);
          break;

        case DocumentType.ARDownPaymentInvoice:
          documentData = await getARDownPaymentInvoiceDocument(docNumInt);
          break;

        case DocumentType.ARCreditMemo:
          documentData = await getSalesCreditMemoDocument(docNumInt);
          break;

        default:
          toast.error("Document type is not supported.");
          return;
      }
    }

    if (!documentData?.DocEntry) {
      toast.info(
        opts?.isDraft
          ? `Draft document ${draftEntry} not found.`
          : `Document number ${docNum} not found.`
      );
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

      if (opts?.isDraft) {
        useSalesDocument.getState().setLoadedDraftData(documentData);
      }
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      toast.info("Document not found.");
    } else {
      toast.error(
        error.message || "An error occurred while fetching the document."
      );
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
        {getFieldSettings(config.type, "headerFieds", "CardCode").visible !== false && (
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
                disabled={isHeaderDisabled || !getFieldSettings(config.type, "headerFieds", "CardCode").enable}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

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
          {getFieldSettings(config.type, "headerFieds", "CardName").visible !== false && (
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
          )}
        </div>

        <div className="flex flex-col gap-2 w-full lg:w-1/2">
          {getFieldSettings(config.type, "headerFieds", "DocStatus").visible !== false && (
            <div className="flex justify-end items-center w-full gap-3">
              <AppLabel className="w-28 shrink-0 text-right">Status</AppLabel>
              <Select
                value={watchedStatus}
                onValueChange={(val) => {
                  if (val === "bost_Close") {
                    // Ask for confirmation first - DocStatus only flips to Closed on Yes.
                    setCloseModalOpen(true);
                  } else {
                    setValue("DocStatus", val);
                  }
                }}
                disabled={!canChangeStatus || !getFieldSettings(config.type, "headerFieds", "DocStatus").enable}
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
          )}

          {getFieldSettings(config.type, "headerFieds", "DocDate").visible !== false && (
            <div className="flex justify-end items-center w-full gap-3">
              <AppLabel className="w-28 shrink-0 text-right">Posting Date</AppLabel>
              <Input type="date" {...register("DocDate")} className="h-8 w-48" disabled={isHeaderDisabled || !getFieldSettings(config.type, "headerFieds", "DocDate").enable} onChange={(e) => {
                register("DocDate").onChange(e);
                setDocDate(e.target.value);
              }} />
            </div>
          )}

          {getFieldSettings(config.type, "headerFieds", "DocDueDate").visible !== false && (
            <div className="flex justify-end items-center w-full gap-3">
              <AppLabel className="w-28 shrink-0 text-right">
                {getDateLabel(config.type)}
              </AppLabel>
              <Input type="date" {...register("DocDueDate")} className="h-8 w-48" disabled={isHeaderDisabled || !getFieldSettings(config.type, "headerFieds", "DocDueDate").enable} onChange={(e) => {
                register("DocDueDate").onChange(e);
                setDocDueDate(e.target.value);
              }} />
            </div>
          )}

          {getFieldSettings(config.type, "headerFieds", "TaxDate").visible !== false && (
            <div className="flex justify-end items-center w-full gap-3">
              <AppLabel className="w-28 shrink-0 text-right">Document Date</AppLabel>
              <Input type="date" {...register("TaxDate")} className="h-8 w-48" disabled={isHeaderDisabled || !getFieldSettings(config.type, "headerFieds", "TaxDate").enable} onChange={(e) => {
                register("TaxDate").onChange(e);
                setTaxDate(e.target.value);
              }} />
            </div>
          )}
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

        <ConfirmationModal
          open={closeModalOpen}
          onOpenChange={setCloseModalOpen}
          title="Close Document"
          description={`Are you sure you want to close this ${config.title}? Once closed, it cannot be edited.`}
          cancelText="No"
          confirmText="Yes"
          onConfirm={() => {
            if (docEntry) {
              handleCloseDocument(Number(docEntry));
            }
          }}
          onCancel={() => setCloseModalOpen(false)}
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
