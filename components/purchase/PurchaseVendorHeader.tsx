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
  getAPCreditMemoDocument,
  getGoodsReturnDocument,
  getGoodsReturnRequestDocument,
  getAPDownPaymentRequestDocument,
  getAPDownPaymentInvoiceDocument,
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
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/authContext";
import { getAdminSettings } from "@/api+/sap/administration/administrationService";
import { useBranchStore } from "@/stores/useBranchStore";
import { hydrateLineAllocations } from "@/lib/sap/helpers/hydrateLineAllocations";

const statusMap: Record<string, string> = {
  bost_Open: "Open",
  bost_Close: "Closed",
};

// PurchaseRequests and APDownPaymentRequest share the same SAP object code
// (1470000113), so this can't disambiguate them by number alone — the "Valid Until"
// label for Purchase Request is applied separately below via isPurchaseRequest,
// which already disambiguates by route path.
const dateLabel2: Record<number, string> = {
  [PurchaseDocumentType.PurchaseQuotation]: "Valid Until",
  [PurchaseDocumentType.PurchaseOrder]: "Delivery Date",
  [PurchaseDocumentType.GoodsReceiptPO]: "Due Date",
  [PurchaseDocumentType.APInvoice]: "Due Date",
};

interface PurchaseVendorHeaderProps {
  docType: PurchaseDocumentType | DocumentType;
}

const getResourceName = (type: number, pathname = "") => {
  const currentPath = pathname.toLowerCase();

  // APDownPaymentRequest and PurchaseRequests share the same SAP object code
  // (1470000113), so disambiguate by route path instead of by object code.
  if (currentPath.includes("apdownpaymentrequest")) return "PurchaseDownPayments";
  if (currentPath.includes("apdownpaymentinvoice")) return "PurchaseDownPayments";
  if (currentPath.includes("purchase/request")) return "PurchaseRequests";

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
    case DocumentType.APCreditMemo:
      return "PurchaseCreditNotes";
    case DocumentType.GoodsReturn:
      return "PurchaseReturns";
    case DocumentType.GoodsReturnRequest:
      return "GoodsReturnRequest";
    case DocumentType.APDownPaymentInvoice:
      return "PurchaseDownPayments";
    default:
      return "";
  }
};

export function PurchaseVendorHeader({ docType }: PurchaseVendorHeaderProps) {
  const pathname = usePathname();
  const {
    register,
    watch,
    setValue,
  } = useFormContext();
  const { requester, setRequester, loadFromDocument, setDocDate, setDocDueDate, setTaxDate, setRequiredDate, setComments } = usePurchaseDocument();
  const { user } = useAuth();

  const config = usePurchaseDocConfig();
  const isPurchaseRequest =
    (config.type as number) === DocumentType.PurchaseRequests &&
    !pathname.toLowerCase().includes("apdownpaymentrequest");
  const [notifyRqr, setNotifyRqr] = useState<string>("N");

  const docEntry = watch("DocEntry");
  const watchedStatus = watch("DocStatus") || "bost_Open";
  const docNum = watch("DocNum");
  const isLoadedDocument = docEntry && Number(docEntry) > 0;
  const isHeaderDisabled = isLoadedDocument && watchedStatus === "bost_Close";

  const { assignedBranches, sessionDefaultBranch } = useBranchStore();
  const watchedBranch = watch("BPL_IDAssignedToInvoice");

  useEffect(() => {
    if (!isLoadedDocument && !watchedBranch && sessionDefaultBranch !== null) {
      setValue("BPL_IDAssignedToInvoice", sessionDefaultBranch);
    }
  }, [isLoadedDocument, watchedBranch, sessionDefaultBranch, setValue]);

  const needsRequiredDate = isPurchaseRequest || config.type === DocumentType.PurchaseQuotation;
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

  const searchRequestIdRef = useRef(0);

  useEffect(() => {
    if (isPurchaseRequest) {
      getAdminSettings().then((settings) => {
        if (settings?.notifyRqr || settings?.NotifyRequester) {
          setNotifyRqr(settings.notifyRqr || settings.NotifyRequester);
        }
      });
    }
  }, [isPurchaseRequest]);

  useEffect(() => {
    if (isPurchaseRequest && user) {
      if (!watch("Requester")) {
        setValue("Requester", user.userName || user.empId || "");
      }
      if (!watch("RequesterName")) {
        setValue("RequesterName", user.fullName || user.userName || "");
      }
    }
  }, [isPurchaseRequest, user, setValue, watch]);

  const fetchDocumentsList = useCallback(
    async (isLoadMore = false, searchText?: string) => {
      const resourceName = getResourceName(config.type, pathname);
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
    [config.type, skip, PAGE_SIZE, pathname],
  );

  const debouncedFetchDocumentsList = useDebouncedCallback((val: string) => {
    fetchDocumentsList(false, val);
  }, 400);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (docNum) setSearchValue(docNum.toString());
  }, [docNum]);

  useEffect(() => {
    if (requester && !isPurchaseRequest) {
      setValue("CardCode", requester.CardCode);
      setValue("CardName", requester.CardName);
    }
  }, [requester, setValue, isPurchaseRequest]);

  const fetchDocument = async (docNum: string) => {
    let documentData;
    const docNumInt = parseInt(docNum);

    if (isNaN(docNumInt)) {
      toast.error("Invalid Document Number entered.");
      return;
    }

    setIsLoading(true);

    try {
      const currentPath = pathname.toLowerCase();

      if (currentPath.includes("apdownpaymentrequest")) {
        documentData = await getAPDownPaymentRequestDocument(docNumInt);
      } else if (currentPath.includes("apdownpaymentinvoice")) {
        documentData = await getAPDownPaymentInvoiceDocument(docNumInt);
      } else if (currentPath.includes("purchase/request")) {
        documentData = await getPurchaseRequestDocument(docNumInt);
      } else {
        switch (config.type) {
          case DocumentType.PurchaseOrder:
            documentData = await getPurchaseOrderDocument(docNumInt);
            break;
          case DocumentType.GoodsReceiptPO:
            documentData = await getPurchaseDeliveryDocument(docNumInt);
            break;
          case DocumentType.PurchaseQuotation:
            documentData = await getPurchaseQuotationDocument(docNumInt);
            break;
          case DocumentType.APInvoice: // covers APReserveInvoice too (same value=18)
            documentData = await getAPInvoiceDocument(docNumInt);
            break;
          case DocumentType.APCreditMemo:
            documentData = await getAPCreditMemoDocument(docNumInt);
            break;
          case DocumentType.GoodsReturn:
            documentData = await getGoodsReturnDocument(docNumInt);
            break;
          case DocumentType.GoodsReturnRequest:
            documentData = await getGoodsReturnRequestDocument(docNumInt);
            break;
          default:
            toast.error("Document type not supported.");
            return;
        }
      }

      if (documentData) {
        loadFromDocument(documentData, config.type);

        // SAP Service Layer GET omits line SerialNumbers/BatchNumbers — pull the
        // allocations from SAP so re-opening a saved document shows them.
        if (Number(documentData.DocEntry) > 0) {
          void hydrateLineAllocations(
            config.type,
            Number(documentData.DocEntry),
            usePurchaseDocument.getState().lines,
            (patch) => {
              usePurchaseDocument.setState((s) => ({
                lines: s.lines.map((line, idx) => {
                  const key = (line as any).LineNum ?? idx;
                  return patch.has(key) ? { ...line, ...patch.get(key) } : line;
                }),
              }));
            }
          );
        }

        usePurchaseDocument.getState().setLoadedDraftData(documentData);
        setValue("DocDate", (documentData.DocDate || "").split("T")[0]);
        setValue("DocDueDate", (documentData.DocDueDate || "").split("T")[0]);
        setValue("TaxDate", (documentData.TaxDate || "").split("T")[0]);
        if (needsRequiredDate) {
          const requiredDateValue = (documentData.RequriedDate || documentData.RequiredDate || "").split("T")[0];
          setValue("RequiredDate", requiredDateValue);
          setRequiredDate(requiredDateValue);
        }
        setValue("Comments", documentData.Comments || "");
        setComments(documentData.Comments || "");
        setValue("DocStatus", documentData.DocumentStatus || documentData.DocStatus || "bost_Open");
        setValue("DocNum", documentData.DocNum);
        setValue("DocEntry", documentData.DocEntry);
        setValue("BPL_IDAssignedToInvoice", documentData.BPL_IDAssignedToInvoice ?? documentData.BPLId);

        if (isPurchaseRequest) {
          setValue("Requester", documentData.Requester || user?.userName || "");
          setValue("RequesterName", documentData.RequesterName || user?.fullName || "");
          setValue("RequesterEmail", documentData.RequesterEmail || "");
          setValue("SendNotification", documentData.SendNotification || "tNO");
        } else {
          setValue("CardCode", documentData.CardCode || "");
          setValue("CardName", documentData.CardName || "");
        }

        toast.success(`Document #${docNumInt} loaded successfully.`);
      } else {
        toast.error("Document not found.");
      }
    } catch (error) {
      toast.error("Error fetching document.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateLabel = (type: number) => {
    if (isPurchaseRequest) return "Valid Until";
    return dateLabel2[type] || "Due Date";
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
          {isPurchaseRequest ? (
            <>
              <AppLabel className="w-28 shrink-0">Requester</AppLabel>
              <div className="flex items-center">
                <Input
                  id="requester-field"
                  type="text"
                  {...register("Requester")}
                  className="h-8 w-48"
                  placeholder="Requester"
                  disabled
                />
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
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
            <AppLabel className="w-28 shrink-0">
              {isPurchaseRequest ? "Requester Full Name" : "Name"}
            </AppLabel>
            <Input
              type="text"
              {...register(isPurchaseRequest ? "RequesterName" : "CardName")}
              className="h-8 w-48"
              placeholder={isPurchaseRequest ? "Requester Full Name" : "Card Name"}
              disabled
            />
          </div>

          <div className="flex items-center w-full gap-3">
            <AppLabel className="w-28 shrink-0">Branch</AppLabel>
            <Select
              value={watchedBranch ? String(watchedBranch) : ""}
              onValueChange={(val) => setValue("BPL_IDAssignedToInvoice", Number(val))}
              disabled={isHeaderDisabled}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Select Branch</SelectLabel>
                  {assignedBranches.map((b) => (
                    <SelectItem key={b.BPLID} value={String(b.BPLID)}>
                      {b.BPLName}
                      {b.Disabled === "tYES" ? " (Inactive)" : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {isPurchaseRequest && (
            <>
              <div className="flex items-center w-full gap-3 pt-1">
                <div className="flex items-center h-8">
                  <input
                    type="checkbox"
                    id="send-notification-checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={watch("SendNotification") === "tYES"}
                    disabled={isHeaderDisabled}
                    onChange={(e) =>
                      setValue("SendNotification", e.target.checked ? "tYES" : "tNO", {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  />
                  <label htmlFor="send-notification-checkbox" className="ml-2 text-xs text-slate-600 cursor-pointer select-none">
                    Send E-Mail if PO or GRPO is Added
                  </label>
                </div>
              </div>
              <div className="flex items-center w-full gap-3">
                <AppLabel className="w-28 shrink-0">E-mail Address</AppLabel>
                <Input
                  type="email"
                  {...register("RequesterEmail")}
                  className="h-8 w-48"
                  placeholder=""
                  disabled={isHeaderDisabled || watch("SendNotification") !== "tYES"}
                />
              </div>
            </>
          )}
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

          {needsRequiredDate && (
            <div className="flex justify-end items-center w-full gap-3">
              <AppLabel className="w-28 shrink-0 text-right">Required Date</AppLabel>
              <Input type="date" {...register("RequiredDate")} className="h-8 w-48" disabled={isHeaderDisabled} onChange={(e) => {
                register("RequiredDate").onChange(e);
                setRequiredDate(e.target.value);
              }} />
            </div>
          )}
        </div>
        {!isPurchaseRequest && (
          <BusinessPartnerSelectorDialog
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            onSelect={handleSelectBP}
            cardType="cSupplier"
          />
        )}
        <GenericModal
          title={`Select ${getResourceName(config.type, pathname).replace(/([A-Z])/g, ' $1').trim()}`}
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
