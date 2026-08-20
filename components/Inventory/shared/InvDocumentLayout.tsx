"use client"
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/inventory/documentConfig";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { resolveDocNavParams, clearDocNavParams } from "@/lib/docNavParams";
import { toast } from "sonner";
import { GenericModal } from "@/modals/GenericModal";
import { getInventoryTransferRequest, getInventoryTransferRequestList } from "@/api+/sap/inventory/inventoryService";
import { FilePlus2, Loader2, Keyboard } from "lucide-react";
import { HeaderActionPortal } from "@/components/header-portal";
import { HeaderModalAction } from "@/components/header-modal-action";
import { KeyboardShortcutsContent } from "@/components/keyboard-shortcuts-content";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DocumentType } from "@/types/master/DocumentType";
import { useUDFStore } from "@/stores/useUDFStore";
import { UDFLayout } from "@/components/shared/UDFSheet";
import HeaderActions from "@/components/Custom/HeaderAction";
import { useAuth } from "@/context/authContext";
import { getCurrentUserApprovalTemplates, getApprovalDocumentType } from "@/api+/sap/Templates/approvalTemplate";
import { RequestDocumentGenerationModal } from "@/modals/RequestDocumentGenerationModal";
import { ApprovalTemplate } from "@/types/template.type";
import { getSapErrorMessage } from "@/lib/errorHelper";

const InvDocContext = createContext<DocumentConfig | null>(null);

export const useInvDocConfig = () => {
  const context = useContext(InvDocContext);
  if (!context) throw new Error("useInvDocConfig must be used within InvDocumentLayout");
  return context;
};

interface InvDocumentLayoutProps<T extends FieldValues> {
  schema: z.ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<void>;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  docType: DocumentType;
  skipAutoReset?: boolean; 
}

export function InvDocumentLayout<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  actions,
  docType,
  skipAutoReset = false,
}: InvDocumentLayoutProps<T>) {

  const config = getDocumentConfig(docType);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const docNav = useMemo(() => resolveDocNavParams(searchParams, pathname), [searchParams, pathname]);


  const [badgeState, setBadgeState] = useState<"draft" | "approved" | null>(() => {
    const draftEntryParam = docNav.draftEntry;
    const docEntryParam = docNav.docEntry;
    const isDraft = Boolean(draftEntryParam) && (docNav.draft ?? searchParams.get("draft")) === "1";

    if (isDraft) return "draft";
    if (docEntryParam) return "approved";
    return null;
  });
  const fetchUdfDefinitions = useUDFStore(state => state.fetchDefinitions);

  useEffect(() => {
    fetchUdfDefinitions(docType);
  }, [docType, fetchUdfDefinitions]);

  const methods = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, setValue } = methods;
  const { reset: resetStore, DocEntry, loadFromDocument, setIsCopyingTo } = useInventoryDocument();
  const store = useInventoryDocument();
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const [approvalTemplates, setApprovalTemplates] = useState<ApprovalTemplate[]>([]);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingFinalData, setPendingFinalData] = useState<T | null>(null);

  const previousDocTypeRef = React.useRef<DocumentType | null>(null);

  useEffect(() => {
    const state = useInventoryDocument.getState();
    const didDocTypeChange = previousDocTypeRef.current !== null && previousDocTypeRef.current !== docType;

    if (!state.isCopyingTo && didDocTypeChange && !skipAutoReset) {
      resetStore();
      reset(defaultValues as any);
    }

    previousDocTypeRef.current = docType;
  }, [docType, resetStore, reset, defaultValues]); 

  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    const state = useInventoryDocument.getState();

    if (state.isCopyingTo) {
      // Coming from a Copy To — clear stale sessionStorage so the header doesn't
      // accidentally re-fetch the source document (e.g. docEntry=44).
      clearDocNavParams();

      // Sync copied data into the form
      setValue("CardCode" as any, state.customer?.CardCode as any);
      setValue("CardName" as any, state.customer?.CardName as any);
      setValue("FromWarehouse" as any, state.fromWarehouse as any);
      setValue("ToWarehouse" as any, state.toWarehouse as any);
      setValue("Comments" as any, state.comments as any);
      setValue("JournalMemo" as any, state.journalMemo as any);
      setValue("TaxDate" as any, state.docDate as any);
      setValue("DocumentLines" as any, state.lines as any);

      setIsCopyingTo(false);
    } else if (!skipAutoReset) {
      // Fresh / new document — wipe stale sessionStorage so the header
      // does not auto-search the last opened doc (e.g. docEntry=44).
      const hasUrlParams =
        searchParams.get("docEntry") ||
        searchParams.get("draftEntry") ||
        searchParams.get("draft");
      if (!hasUrlParams) {
        clearDocNavParams();
      }
      resetStore();
      reset(defaultValues as any);
    }
  }, [resetStore, setIsCopyingTo, setValue, reset, defaultValues, skipAutoReset, searchParams]);


  useEffect(() => {
   setValue("CardCode" as any, (store.customer?.CardCode || "") as any);
    setValue("CardName" as any, (store.customer?.CardName || "") as any);
    setValue("FromWarehouse" as any, (store.fromWarehouse || "") as any);
    setValue("ToWarehouse" as any, (store.toWarehouse || "") as any);
    setValue("Comments" as any, (store.comments || "") as any);
    setValue("JournalMemo" as any, (store.journalMemo || "") as any);
    setValue("TaxDate" as any, (store.docDate || "") as any);
    setValue("DocumentLines" as any, (store.lines || []) as any);
    setValue("DocEntry" as any, (store.DocEntry || 0) as any);
    setValue("DocNum" as any, (store.DocNum || 0) as any);
    setValue("DocStatus" as any, (store.docStatus || "") as any);
  }, [
    store.customer,
    store.fromWarehouse,
    store.toWarehouse,
    store.comments,
    store.journalMemo,
    store.docDate,
    store.lines,
    store.DocEntry,
    store.DocNum,
    store.docStatus,
    setValue
  ]);

  const [selectedCopyFrom, setSelectedCopyFrom] = useState<string>("");
  const [selectedCopyTo] = useState<string>("");
  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const [itrData, setItrData] = useState<any[]>([]);
  const [isLoadingCopyFrom, setIsLoadingCopyFrom] = useState(false);
  const [isLoadingCopyTo, setIsLoadingCopyTo] = useState(false);
  const PAGE_SIZE = 20;
  const [itrSkip, setItrSkip] = useState(0);
  const itrSkipRef = React.useRef(0);  // ref to avoid stale closure in handleLoadMoreITR
  const [itrHasMore, setItrHasMore] = useState(false);
  const [itrSearch, setItrSearch] = useState("");
  const itrSearchRef = React.useRef("");

  const handleCopyTo = (selected: string) => {
    if (!DocEntry || DocEntry === 0) {
      toast.error("Please search or select a document first!");
      return;
    }
    setIsLoadingCopyTo(true);

    if (selected === DocumentType.InvTransfer.toString()) {
      const state = useInventoryDocument.getState();

      const copiedLines = state.lines.map((line, idx) => ({
        ...line,
        BaseType: docType,
        BaseEntry: DocEntry,
        BaseLine: line.LineNum ?? idx,
      }));

      useInventoryDocument.setState({
        lines: copiedLines,
        fromWarehouse: copiedLines[0]?.FromWhsCode || state.fromWarehouse || "",
        toWarehouse: copiedLines[0]?.WhsCode || state.toWarehouse || "",
        comments: "",
        journalMemo: "",
        DocEntry: 0,
        docDate: new Date().toISOString().split("T")[0],
        customer: state.customer,
        isCopyingTo: true,
      });

      router.push("/dashboard/inventory/transfer");
    } else {
      toast.info("Copy to this document type is not implemented yet.");
    }
  };

  const handleCopyFrom = async (type: string) => {
    if (parseInt(type) !== DocumentType.InvTransferReq) return;
    setIsLoadingCopyFrom(true);
    setItrSkip(0);
    itrSkipRef.current = 0;
    itrSearchRef.current = "";
    setItrSearch("");
    try {
      const result = await getInventoryTransferRequestList(0, PAGE_SIZE, "");
      const filterdData = result.value.filter((d: any) => d.FromWarehouse == store.fromWarehouse);
      setItrData(filterdData);
      setItrHasMore(result.hasMore);
      setCopyFromOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch ITR list.");
    } finally {
      setIsLoadingCopyFrom(false);
    }
  };

  const handleLoadMoreITR = async () => {
    if (isLoadingCopyFrom) return;
    const nextSkip = itrSkipRef.current + PAGE_SIZE;
    setIsLoadingCopyFrom(true);
    try {
      const result = await getInventoryTransferRequestList(nextSkip, PAGE_SIZE, itrSearchRef.current);
      setItrData(prev => {
        const existingDocNums = new Set(prev.map((d: any) => d.DocNum));
        const unique = result.value.filter((d: any) => !existingDocNums.has(d.DocNum));
        return [...prev, ...unique];
      });
      itrSkipRef.current = nextSkip;
      setItrSkip(nextSkip);
      setItrHasMore(result.hasMore);
    } catch (err: any) {
      toast.error(err.message || "Failed to load more.");
    } finally {
      setIsLoadingCopyFrom(false);
    }
  };

  const handleItrSearch = async (value: string) => {
    itrSearchRef.current = value;
    setItrSearch(value);
    itrSkipRef.current = 0;
    setItrSkip(0);
    setIsLoadingCopyFrom(true);
    try {
      const result = await getInventoryTransferRequestList(0, PAGE_SIZE, value);
      setItrData(result.value);
      setItrHasMore(result.hasMore);
    } catch (err: any) {
      toast.error(err.message || "Failed to search.");
    } finally {
      setIsLoadingCopyFrom(false);
    }
  };

    const handleSelectITR = async (docNums: any) => {
    const nums = Array.isArray(docNums) ? docNums : [docNums];
    if (nums.length === 0) return;

    setIsLoadingCopyFrom(true);
    try {
      let mergedDoc: any = null;
      let allLines: any[] = [];

      for (const num of nums) {
        const doc = await getInventoryTransferRequest(num);
        if (!doc) continue;
        if (!mergedDoc) mergedDoc = { ...doc };

        const validLines = (doc.DocumentLines || doc.StockTransferLines || doc.InventoryTransferLines || [])
          .filter((line: any) => line.LineStatus !== 'bost_Close') 
          .map((line: any) => ({
            ...line,
            _parentDocEntry: doc.DocEntry
          }));

        allLines = [...allLines, ...validLines];
      }

      if (allLines.length === 0) {
        toast.warning("Selected document(s) have no open lines to copy.");
        return;
      }

      if (mergedDoc) {
              const fromWhs = mergedDoc.FromWarehouse || allLines[0]?.FromWhsCode || "";
        const toWhs = mergedDoc.ToWarehouse || allLines[0]?.WhsCode || "";

        setValue("DocEntry" as any, 0 as any);
        setValue("DocNum" as any, 0 as any);
        
        loadFromDocument({ ...mergedDoc, DocumentLines: allLines }, DocumentType.InvTransferReq, true);
        toast.success(`Copied from ${nums.length} ITR(s)`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load ITR details.");
    } finally {
      setIsLoadingCopyFrom(false);
    }
  };

  const canCopyTo = docType === DocumentType.InvTransferReq;
  const canCopyFrom = docType === DocumentType.InvTransfer;
  const isEditMode = Boolean(DocEntry && DocEntry > 0);
  const isClosed = (store.docStatus || "").toLowerCase() === "bost_close" || (store.docStatus || "").toLowerCase() === "close";

  const getSubmitButtonText = () => {
    if (isSaving) {
      if (isEditMode) return "Updating...";
      return "Submitting...";
    }
    if (isEditMode) return "Update";
    return "Submit";
  };

  const onSubmitValid = async (data: T) => {
    if (!docNav.draftEntry && !isEditMode) {
      const state = useInventoryDocument.getState();
      const finalData = { ...data, DocumentLines: state.lines } as unknown as T;

      const currentUserId = user?.sapUserId;
      if (currentUserId) {
        try {
          const docTypeStr = getApprovalDocumentType(docType);
          const activeTemplates = await getCurrentUserApprovalTemplates(currentUserId, docTypeStr);
          if (activeTemplates && activeTemplates.length > 0) {
            setApprovalTemplates(activeTemplates);
            setPendingFinalData(finalData);
            setApprovalModalOpen(true);
            return;
          }
        } catch (err) {
          console.error("Failed to check approval templates:", err);
        }
      }
    }

    setIsSaving(true);
    try {
      await onSubmit(data);
      reset(defaultValues as any);
      resetStore();
    } catch (err: any) {
      const message = getSapErrorMessage(err);
      toast.error(message || "Error submitting document");
    } finally {
      setIsSaving(false);
    }
  };

  const onSubmitInvalid: SubmitErrorHandler<T> = (errors) => {
    setIsSaving(false);
    console.error("Validation Errors:", errors);
    const getFirstErrorMessage = (errs: any): string | null => {
      if (!errs || typeof errs !== "object") return null;
      if (typeof errs.message === "string" && errs.message) return errs.message;
      for (const key in errs) {
        const err = errs[key];
        if (!err) continue;
        if (typeof err.message === "string" && err.message) {
          return `${key}: ${err.message}`;
        }
        const nestedMsg = getFirstErrorMessage(err);
        if (nestedMsg) return nestedMsg;
      }
      return null;
    };
    const message = getFirstErrorMessage(errors) || "Please check the document fields.";
    toast.error(message);
  };

  return (
    <InvDocContext.Provider value={config}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmitValid, onSubmitInvalid)} className="flex flex-col min-h-screen bg-background overflow-x-hidden">

          <HeaderActionPortal>
            <HeaderActions
              DocEntry={DocEntry}
              objectCode={docType}
              reset={reset}
              defaultValues={defaultValues}
              resetStore={resetStore}
            />
          </HeaderActionPortal>

          <div className="flex justify-between items-center px-6 py-3 border-b bg-muted">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold flex items-center gap-2">
                {config.title}
                {badgeState === "draft" && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5">
                    Draft
                  </span>
                )}
                {badgeState === "approved" && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5">
                    Approved
                  </span>
                )}
              </h1>
            </div>
            {actions && <div>{actions}</div>}
          </div>

          <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto overflow-x-hidden w-full min-w-0">
            {children}
          </div>

          <div className="border-t px-6 py-4 flex justify-end gap-4 bg-white shadow-md">

            {canCopyFrom && (!DocEntry || DocEntry === 0) && (
              <Select
                value={selectedCopyFrom}
                onValueChange={(value) => {
                  handleCopyFrom(value);
                  setTimeout(() => setSelectedCopyFrom(""), 0);
                }}
              >
                <SelectTrigger
                  className="w-[180px] h-9 bg-black text-white hover:bg-zinc-800 focus:ring-0"
                  disabled={isLoadingCopyFrom || isLoadingCopyTo}
                >
                  <div className="flex items-center gap-2">
                    {isLoadingCopyFrom && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                    <SelectValue placeholder="Copy From" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={DocumentType.InvTransferReq.toString()}>
                      Inventory Transfer Req
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            {/* Copy To — only on Inventory Transfer Request */}
            {canCopyTo && (
              <Select
                value={selectedCopyTo}
                disabled={!DocEntry || DocEntry === 0 || isLoadingCopyFrom}
                onValueChange={handleCopyTo}
              >
                <SelectTrigger className="w-[180px] h-9 bg-black text-white hover:bg-zinc-800 focus:ring-0">
                  <div className="flex items-center gap-2">
                    {isLoadingCopyTo && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                    <SelectValue placeholder="Copy To" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={DocumentType.InvTransfer.toString()}>
                      Inventory Transfer
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            <Button
              type="submit"
              disabled={isSaving || (isEditMode && isClosed)}
              className="min-w-[100px]"
            >
              {getSubmitButtonText()}
            </Button>
          </div>

          <GenericModal
            title="Select Inventory Transfer Request"
            open={copyFromOpen}
            multiple={true}
            onClose={() => setCopyFromOpen(false)}
            onSelect={handleSelectITR}
            data={itrData}
            columns={[
              { key: "index", label: "#" },
              { key: "DocNum", label: "Doc Num" },
              { key: "DocDate", label: "Doc Date" },
              { key: "FromWarehouse", label: "From Whse" },
              { key: "ToWarehouse", label: "To Whse" },
              { key: "Comments", label: "Comments" },
            ]}
            getSelectValue={(item: any) => item.DocNum}
            isLoading={isLoadingCopyFrom}
            hasMore={itrHasMore}
            onLoadMore={handleLoadMoreITR}
            onSearch={handleItrSearch}
            searchValue={itrSearch}
          />
          <UDFLayout docType={docType} values={store.udfs} />

          <RequestDocumentGenerationModal
            open={approvalModalOpen}
            onClose={() => setApprovalModalOpen(false)}
            templates={approvalTemplates}
            onConfirm={async (remarksMap) => {
              if (!pendingFinalData) return;
              const firstRemarks = approvalTemplates[0]
                ? (remarksMap[approvalTemplates[0].Code] ?? "").trim()
                : "";
              const finalData = {
                ...(pendingFinalData as any),
                Comments: firstRemarks || (pendingFinalData as any).Comments || "",
              } as T;

              // The document is posted here - when an approval process applies, SAP
              // creates a draft + approval request natively (ODBC -2028 handled backend-side).
              await onSubmit(finalData);
              setPendingFinalData(null);
              reset(defaultValues as any);
              resetStore();
            }}
          />
        </form>
      </FormProvider>
    </InvDocContext.Provider>
  );
}
