import { useState, useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { AppLabel } from "@/components/Custom/AppLabel";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { List } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useDocNavParams } from "@/lib/docNavParams";
import { getDocumentsList } from "@/api+/sap/common/documentService";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { useInvDocConfig } from "./InvDocumentLayout";
import { BusinessPartnerSelectorDialog } from "@/modals/BusinessPartnerSelectorDialog";
import { Warehouse } from "@/types/warehouse/warehouse";
import { useMasterDataStore } from "@/stores/sales/useMasterDataStore";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { getGoodIssue, getGoodIssueList, getInventoryTransfer, getInventoryTransferRequest, closeInventoryTransferRequest } from "@/api+/sap/inventory/inventoryService";
import { getDraftDocument } from "@/api+/sap/draft/draftService";
import { GenericModal } from "@/modals/GenericModal";
import { ConfirmationModal } from "@/modals/ConfirmationModal";
import { DocumentType } from "@/types/master/DocumentType";
import { useUDFStore } from "@/stores/useUDFStore";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { useBranchStore } from "@/stores/useBranchStore";
import { hydrateLineAllocations } from "@/lib/sap/helpers/hydrateLineAllocations";

const statusMap: Record<string, string> = {
  bost_Open: "Open",
  bost_Close: "Closed",
};

export function InvDocumentHeader() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [fromWhsModalOpen, setFromWhsModalOpen] = useState(false);
  const [toWhsModalOpen, setToWhsModalOpen] = useState(false);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const {
    lines,
    customer,
    setCustomer,
    loadFromDocument,
    warehouses: globalWarehouses,
    setWarehouses,
    DocEntry,
    updateAllLinesWarehouse,
    fromWarehouse,
    toWarehouse,
    docDate,
    setFromWarehouse,
    setToWarehouse,
    setDocDate,
    comments,
    setComments,
    journalMemo,
    setJournalMemo,
  } = useInventoryDocument();
  const { loadWarehouses } = useMasterDataStore();
  const [warehouses, setLocalWarehouses] = useState<Warehouse[]>([]);

  const docNum = watch("DocNum");
  const [docNumSearch, setDocNumSearch] = useState("");
  const [docListModalOpen, setDocListModalOpen] = useState(false);
  const [documentsList, setDocumentsList] = useState<any[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listSkip, setListSkip] = useState(0);
  const listSkipRef = useRef(0);
  const [listHasMore, setListHasMore] = useState(true);
  const listHasMoreRef = useRef(true);
  const [listSearch, setListSearch] = useState("");
  const LIST_PAGE_SIZE = 20;
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const watchedStatus = watch("DocStatus") || "bost_Open";
  const config = useInvDocConfig();
  const fetchUdfDefinitions = useUDFStore(state => state.fetchDefinitions);
  const [syncDialog, setSyncDialog] = useState<{
    open: boolean;
    type: "from" | "to" | null;
    value: string;
  }>({ open: false, type: null, value: "" });

  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const isLoadedDocument = !!DocEntry && DocEntry > 0;
  const isHeaderDisabled = isLoadedDocument && watchedStatus === "bost_Close";
  const canChangeStatus = isLoadedDocument && !isClosing && watchedStatus === "bost_Open";

  const { assignedBranches, sessionDefaultBranch } = useBranchStore();
  const watchedBranch = watch("BPL_IDAssignedToInvoice");

  useEffect(() => {
    const branchWhs = toWarehouse || fromWarehouse;
    const derivedBranch = globalWarehouses.find((w: any) => w.WhsCode === branchWhs)?.BPLid;
    if (derivedBranch !== undefined) {
      if (derivedBranch !== watchedBranch) {
        setValue("BPL_IDAssignedToInvoice", derivedBranch);
      }
    } else if (!isLoadedDocument && !watchedBranch && sessionDefaultBranch !== null) {
      setValue("BPL_IDAssignedToInvoice", sessionDefaultBranch);
    }
  }, [toWarehouse, fromWarehouse, globalWarehouses, watchedBranch, isLoadedDocument, sessionDefaultBranch, setValue]);

  const closeDocumentByType = (type: number, entry: number) => {
    switch (type) {
      case DocumentType.InvTransferReq: return closeInventoryTransferRequest(entry);
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
      toast.error(error?.response?.data?.error || "Failed to close document");
    } finally {
      setIsClosing(false);
      setCloseModalOpen(false);
    }
  };

  const searchParams = useSearchParams();
  const docNav = useDocNavParams();
  const autoCreatedRef = useRef(false);
  const initialLoadRef = useRef(false);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await loadWarehouses();
        setLocalWarehouses(res);
        setWarehouses(res);
      } catch (error) {
        console.error("Failed to fetch warehouses", error);
      }
    };
    fetchWarehouses();
  }, [loadWarehouses, setWarehouses]);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    const currentState = useInventoryDocument.getState();
    if (currentState.isCopyingTo) return;

    const isDraft = (docNav.draft ?? searchParams.get("draft")) === "1";
    const draftEntryParam = docNav.draftEntry ?? searchParams.get("draftEntry") ?? "";
    const docEntryParam = docNav.docEntry ?? searchParams.get("docEntry") ?? "";

    if (isDraft && draftEntryParam) {
      const draftId = parseInt(draftEntryParam);
      if (!isNaN(draftId)) {
        loadDraftDoc(draftId);
      }
    } else if (docEntryParam) {
      setDocNumSearch(docEntryParam);
      fetchDocument(docEntryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDraftDoc = async (draftId: number) => {
    setIsLoading(true);
    try {
      const documentData = await getDraftDocument(draftId);
      if (documentData) {
        fetchUdfDefinitions(config.type, true);
        applyDocumentData(documentData, config.type);

        useInventoryDocument.getState().setLoadedDraftData(documentData);
      } else {
        toast.error(`Draft document ${draftId} not found.`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load draft document.");
    } finally {
      setIsLoading(false);
    }
  };

  const fromWhs = watch("FromWarehouse");
  const toWhs = watch("ToWarehouse");

  useEffect(() => {
    if (warehouses.length > 0) {
      if (!fromWarehouse) {
        setFromWarehouse(warehouses[0].WhsCode);
      }
      if (!toWarehouse) {
        setToWarehouse(warehouses[0].WhsCode);
      }
    }
  }, [warehouses, fromWarehouse, toWarehouse, setFromWarehouse, setToWarehouse]);

  useEffect(() => {
    if (docNum) {
      setDocNumSearch(docNum.toString());
    } else {
      // DocNum was reset (new blank document) — clear the search field
      setDocNumSearch("");
    }
  }, [docNum]);

  const getResourceName = (type: number) => {
    switch (type) {
      case DocumentType.InvTransfer: return "StockTransfers";
      case DocumentType.InvTransferReq: return "InventoryTransferRequests";
      case DocumentType.GoodIssue: return "GoodIssues";
      default: return "";
    }
  };

  const searchRequestIdRef = useRef(0);

  const fetchDocumentsList = async (isLoadMore = false, searchText?: string) => {
    const resourceName = getResourceName(config.type);
    if (!resourceName) return;

    setIsLoadingList(true);
    try {
      const currentSkip = isLoadMore ? listSkipRef.current + LIST_PAGE_SIZE : 0;
      let rawList: any[] = [];
      let hasMore = false;

      if (config.type === DocumentType.GoodIssue) {
        const page = await getGoodIssueList(currentSkip, LIST_PAGE_SIZE, searchText);
        rawList = page.value;
        hasMore = page.hasMore;
      } else {
        rawList = await getDocumentsList(resourceName, currentSkip, LIST_PAGE_SIZE, searchText);
        hasMore = rawList.length === LIST_PAGE_SIZE;
      }

      if (isLoadMore) {
        setListSkip(currentSkip);
        listSkipRef.current = currentSkip;
      } else {
        setListSkip(0);
        listSkipRef.current = 0;
      }

      const newDocs = (rawList || []).map((d: any) => ({
        ...d,
        DocumentStatus: d.DocumentStatus?.replace("bost_", "") || d.DocumentStatus,
      }));

      if (isLoadMore) {
        setDocumentsList(prev => [...prev, ...newDocs]);
      } else {
        setDocumentsList(newDocs);
      }

      setListHasMore(hasMore);
      listHasMoreRef.current = hasMore;
    } catch (error: any) {
      const message = getSapErrorMessage(error);
      toast.error(message || "Failed to fetch documents list.");
    } finally {
      setIsLoadingList(false);
    }
  };

  const debouncedFetchDocumentsList = useDebouncedCallback((val: string) => {
    fetchDocumentsList(false, val);
  }, 400);

  useEffect(() => {
    if (!docListModalOpen) {
      setDocumentsList([]);
      setIsLoadingList(false);
      setListSearch("");
    }
  }, [docListModalOpen]);

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
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [config.type]);

  const handleSelectBP = (bp: BusinessPartner) => {
    setCustomer(bp);
    setModalOpen(false);
  };

  const fetchDocument = async (overrideNum?: string) => {
    const rawNum = overrideNum || docNumSearch;
    const docNumInt = parseInt(rawNum);
    if (isNaN(docNumInt) || docNumInt <= 0) {
      toast.error("Please enter a valid document number to load.");
      return;
    }

    setDocNumSearch(docNumInt.toString());
    setIsLoading(true);

    try {
      let documentData;
      if (config.type === DocumentType.InvTransferReq) {
        documentData = await getInventoryTransferRequest(docNumInt);
      } else if (config.type === DocumentType.InvTransfer) {
        documentData = await getInventoryTransfer(docNumInt);
      } else if (config.type === DocumentType.GoodIssue) {
        documentData = await getGoodIssue(docNumInt);
      } 

      if (documentData) {
        fetchUdfDefinitions(config.type, true);
        applyDocumentData(documentData, config.type);
      } else {
        toast.error("Document not found.");
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.info("Document not found.");
      } else {
        const message = getSapErrorMessage(error);
        toast.error(message || "An error occurred while fetching the document.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const applyDocumentData = (documentData: any, type: number) => {
    setValue("DocEntry", documentData.DocEntry || 0);
    setValue("DocNum", documentData.DocNum || 0);
    const dateStr = documentData.TaxDate ? documentData.TaxDate.split("T")[0] : "";
    setDocDate(dateStr);
    setCustomer(documentData.CardCode ? { CardCode: documentData.CardCode, CardName: documentData.CardName || "" } : null);
    setComments(documentData.Comments || "");
    setFromWarehouse(documentData.FromWarehouse || "");
    setToWarehouse(documentData.ToWarehouse || "");
    setJournalMemo(documentData.JournalMemo || "");
    setValue("DocStatus", documentData.DocumentStatus);
    setValue("BPL_IDAssignedToInvoice", documentData.BPL_IDAssignedToInvoice ?? documentData.BPLId);

    const isCopy = type !== config.type;
    loadFromDocument(documentData, type, isCopy);
    if (isCopy) {
      setValue("DocEntry", 0);
      setValue("DocNum", 0);
    } else if (Number(documentData.DocEntry) > 0) {
      // SL GET omits line SerialNumbers/BatchNumbers — pull allocations from SAP.
      void hydrateLineAllocations(
        config.type,
        Number(documentData.DocEntry),
        useInventoryDocument.getState().lines,
        (patch) => {
          useInventoryDocument.setState((s) => ({
            lines: s.lines.map((line, idx) => {
              const key = (line as any).LineNum ?? idx;
              return patch.has(key) ? { ...line, ...patch.get(key) } : line;
            }),
          }));
        }
      );
    }
    toast.success(`Document loaded successfully.`);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex flex-col gap-2 w-full lg:w-1/2">
        {config.type !== DocumentType.GoodIssue && (
          <div className="flex items-center gap-3">
            <AppLabel className="w-28 shrink-0">Customer</AppLabel>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={customer?.CardCode || ""}
                className="h-8 w-56 pr-10"
                placeholder="Card Code"
                readOnly
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                disabled={DocEntry > 0}
                onClick={() => {
                  setModalOpen(true);
                }}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {config.type !== DocumentType.GoodIssue && (
          <div className="flex items-center gap-3 w-full">
            <AppLabel className="w-28 shrink-0">Name</AppLabel>
            <Input
              type="text"
              value={customer?.CardName || ""}
              className="h-8 w-56"
              placeholder="Card Name"
              readOnly
            />
          </div>
        )}

        <div className="flex items-center gap-3 w-full">
          <AppLabel className="w-28 shrink-0">Branch</AppLabel>
          <Select
            value={watchedBranch ? String(watchedBranch) : ""}
            onValueChange={(val) => setValue("BPL_IDAssignedToInvoice", Number(val))}
            disabled={isHeaderDisabled}
          >
            <SelectTrigger className="w-56">
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

        {config.type !== DocumentType.GoodIssue && (
          <div className="flex items-center gap-3 w-full">
            <AppLabel className="w-28 shrink-0">From Warehouse</AppLabel>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={fromWarehouse}
                className="h-8 w-56 bg-gray-100 text-gray-500 cursor-not-allowed"
                readOnly
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                disabled={DocEntry > 0}
                onClick={() => setFromWhsModalOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {config.type !== DocumentType.GoodIssue && (
          <div className="flex items-center gap-3 w-full">
            <AppLabel className="w-28 shrink-0">To Warehouse</AppLabel>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={toWarehouse}
                className="h-8 w-56 bg-gray-100 text-gray-500 cursor-not-allowed"
                readOnly
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                disabled={DocEntry > 0}
                onClick={() => setToWhsModalOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

      </div>

      <div className="flex flex-col gap-2 w-full lg:w-1/2">
        <div className="flex flex-col gap-2 items-end">
          <div className="flex items-center gap-1">
            <Input
              type="text"
              placeholder="Search document..."
              className="h-8 w-47"
              value={docNumSearch}
              onChange={(e) => setDocNumSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  fetchDocument(docNumSearch);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => fetchDocument(docNumSearch)}
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

        {config.type === DocumentType.InvTransferReq && (
          <div className="flex justify-end items-center gap-3 w-full">
            <AppLabel className="w-28 shrink-0 text-right">Status</AppLabel>
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
              <SelectTrigger className="h-8 w-56">
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

        <div className="flex justify-end items-center gap-3 w-full">
          <AppLabel className="w-28 shrink-0 text-right">Document Date</AppLabel>
          <Input
            type="date"
            value={docDate}
            onChange={(e) => setDocDate(e.target.value)}
            className="h-8 w-56"
            disabled={DocEntry > 0}
          />
        </div>
      </div>

      <BusinessPartnerSelectorDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(bp) => {
          handleSelectBP(bp);
          setModalOpen(false);
        }}
      />

      <GenericModal
        title={`Select ${getResourceName(config.type).replace(/([A-Z])/g, ' $1').trim()}`}
        open={docListModalOpen}
        onClose={() => {
          setDocListModalOpen(false);
          setIsLoadingList(false);
        }}
        onSelect={(val) => {
          setDocListModalOpen(false);
          setIsLoadingList(false);
          fetchDocument(val.toString());
        }}
        data={documentsList}
        getSelectValue={(item) => item.DocNum || item.DocumentNumber}
        columns={[
          { key: "DocNum", label: "Doc Num" },
          { key: "CardCode", label: customer?.CardCode ? "Customer Code" : "BP Code" },
          { key: "CardName", label: customer?.CardName ? "Customer Name" : "BP Name" },
          { key: "DocDate", label: "Date" },
          { key: "DocumentStatus", label: "Status" },
        ]}
        isLoading={isLoadingList}
        onLoadMore={() => fetchDocumentsList(true, listSearch)}
        hasMore={listHasMore}
        onSearch={(value) => {
          setListSearch(value);
          debouncedFetchDocumentsList(value);
        }}
        searchValue={listSearch}
      />

      <GenericModal
        title="Select From Warehouse"
        open={fromWhsModalOpen}
        onClose={() => setFromWhsModalOpen(false)}
        onSelect={(wh: Warehouse) => {
          setFromWarehouse(wh.WhsCode);
          if (lines.length > 0) {
            setSyncDialog({ open: true, type: "from", value: wh.WhsCode });
          }
          setFromWhsModalOpen(false);
        }}
        data={warehouses}
        columns={[
          { key: "WhsCode", label: "Warehouse Code" },
          { key: "WhsName", label: "Warehouse Name" },
        ]}
        getSelectValue={(item) => item}
      />

      <GenericModal
        title="Select To Warehouse"
        open={toWhsModalOpen}
        onClose={() => setToWhsModalOpen(false)}
        onSelect={(wh: Warehouse) => {
          setToWarehouse(wh.WhsCode);
          if (lines.length > 0) {
            setSyncDialog({ open: true, type: "to", value: wh.WhsCode });
          }
          setToWhsModalOpen(false);
        }}
        data={warehouses}
        columns={[
          { key: "WhsCode", label: "Warehouse Code" },
          { key: "WhsName", label: "Warehouse Name" },
        ]}
        getSelectValue={(item) => item}
      />

      <ConfirmationModal
        open={syncDialog.open}
        onOpenChange={(open) => !open && setSyncDialog((s) => ({ ...s, open: false }))}
        title="Update Line Warehouses?"
        description={
          <>
            Do you want to update the <strong>{syncDialog.type === "from" ? "From Warehouse" : "To Warehouse"}</strong> for all existing lines to <strong>{syncDialog.value}</strong>?
          </>
        }
        cancelText="No, keep lines"
        confirmText="Yes, update all"
        onConfirm={() => {
          if (syncDialog.type) {
            updateAllLinesWarehouse(syncDialog.value, syncDialog.type === "from");
          }
          setSyncDialog({ open: false, type: null, value: "" });
        }}
      />

      <ConfirmationModal
        open={closeModalOpen}
        onOpenChange={setCloseModalOpen}
        title="Close Document"
        description="Are you sure you want to close this document? Once closed, it cannot be edited."
        cancelText="No"
        confirmText="Yes"
        onConfirm={() => {
          if (DocEntry) {
            handleCloseDocument(DocEntry);
          }
        }}
        onCancel={() => setCloseModalOpen(false)}
      />
    </div >
  );
}
