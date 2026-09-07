"use client"
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/inventory/documentConfig";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { useShallow } from "zustand/react/shallow";
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
import { DocumentType, DRAFT_OBJECT_TYPES } from "@/types/master/DocumentType";
import { useUDFStore } from "@/stores/useUDFStore";
import { UDFLayout } from "@/components/shared/UDFSheet";
import HeaderActions from "@/components/Custom/HeaderAction";
import { useAuth } from "@/context/authContext";
import { getCurrentUserApprovalTemplates, getApprovalDocumentType, submitApprovalRequest, validateDraftChanged, interpretReApprovalResponse } from "@/api+/sap/Templates/approvalTemplate";
import { useApprovalSettings } from "@/hooks/useApprovalSettings";
import { APPROVED_DOC_EDIT_BLOCKED_MSG } from "@/lib/approval/approvalCondition";
import { runReopenApproval } from "@/lib/approval/reopenApproval";
import { resolveApprovalHeaderBadges, mapAuthorizationStatus, isAuthorizationWithout } from "@/lib/approval/approvalHeaderBadge";
import { useUserHasApprovalTemplate } from "@/hooks/useApprovalDocuments";
import { RequestDocumentGenerationModal } from "@/modals/RequestDocumentGenerationModal";
import { ApprovalTemplate } from "@/types/template.type";
import { getSapErrorMessage } from "@/lib/errorHelper";
import { patchDraftDocument } from "@/api+/sap/draft/draftService";
import {
  buildInventoryTransferRequestPatchPayload,
  buildInventoryTransferPatchPayload,
  buildGoodIssuePatchPayload,
} from "@/lib/sap/helpers/inventoryPayloadHelper";
import { hasDraftChanges } from "@/lib/approval/approvalChanges";
import { linesNeedSerialAllocation, linesNeedBatchAllocation } from "@/lib/sap/helpers/serialBatchHelper";
import { isBranchMissing, isBranchInactive } from "@/lib/sap/helpers/branchValidationHelper";
import { openLinesForCopyFrom } from "@/lib/sap/helpers/copyFromQuantity";
import { RelationshipMapView } from "@/components/shared/RelationshipMapView";
import { useRelationshipMapStore } from "@/stores/useRelationshipMapStore";
import { useFMS, FmsProvider } from "@/hooks/useFMS";
import { FmsKeyboardBridge } from "@/components/Custom/FmsKeyboardBridge";
import { FieldNameInspector } from "@/components/Custom/FieldNameInspector";
import FMSSelectionModal from "@/modals/FMSSelectionModal";

const InvDocContext = createContext<DocumentConfig | null>(null);

function buildInvDraftPayload(
  docType: DocumentType,
  data: any,
  state: { lines: any[]; fromWarehouse?: string; toWarehouse?: string }
): Record<string, any> {
  switch (docType) {
    case DocumentType.InvTransferReq:
      return buildInventoryTransferRequestPatchPayload({
        data,
        lines: state.lines,
        fromWarehouse: state.fromWarehouse,
        toWarehouse: state.toWarehouse,
      });
    case DocumentType.InvTransfer:
      return buildInventoryTransferPatchPayload({
        data,
        lines: state.lines,
        fromWarehouse: state.fromWarehouse,
        toWarehouse: state.toWarehouse,
      });
    case DocumentType.GoodIssue:
      return buildGoodIssuePatchPayload({ data, lines: state.lines });
    default:
      return {
        Comments: data?.Comments || "",
        JournalMemo: data?.JournalMemo || "",
        DocumentLines: state.lines.map((line: any) => ({
          ItemCode: line.ItemCode,
          Quantity: Number(line.Quantity) || 0,
          WarehouseCode: line.WhsCode || "",
        })),
      };
  }
}

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

  const config = useMemo(() => getDocumentConfig(docType), [docType]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const docNav = useMemo(() => resolveDocNavParams(searchParams, pathname), [searchParams, pathname]);
  const headerBadges = useMemo(() => resolveApprovalHeaderBadges(docNav), [docNav]);

  const statusStr = (docNav.approvalStatus || "").trim().toLowerCase();
  const isApprovedDraft = statusStr === "arsapproved" || statusStr === "ardapproved" || statusStr === "approved";
  const isRejectedApproval =
    statusStr === "arsrejected" ||
    statusStr === "ardrejected" ||
    statusStr === "arsnotapproved" ||
    statusStr === "ardnotapproved" ||
    statusStr === "rejected" ||
    statusStr === "notapproved" ||
    statusStr === "arscancelled" ||
    statusStr === "arscanceled" ||
    statusStr === "ardcancelled" ||
    statusStr === "ardcanceled" ||
    statusStr === "arscomplete";
  const isPendingApproval =
    (statusStr === "arspending" ||
      statusStr === "ardpending" ||
      statusStr === "pending" ||
      (!statusStr && !!docNav.approvalRequestCode && !!docNav.draftEntry)) &&
    !!docNav.draftEntry;


  const [badgeState, setBadgeState] = useState<"draft" | "approved" | null>(() => {
    const draftEntryParam = docNav.draftEntry;
    const docEntryParam = docNav.docEntry;
    const isDraft = Boolean(draftEntryParam) && (docNav.draft ?? searchParams.get("draft")) === "1";

    if (isDraft) return "draft";
    if (docEntryParam) return "approved";
    return null;
  });
  const relMapStore = useRelationshipMapStore();
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
  const { reset: resetStore, DocEntry, loadFromDocument, setIsCopyingTo } = useInventoryDocument(
    useShallow(state => ({
      reset: state.reset,
      DocEntry: state.DocEntry,
      loadFromDocument: state.loadFromDocument,
      setIsCopyingTo: state.setIsCopyingTo,
    }))
  );

  const resetFormAndNav = () => {
    reset(defaultValues as any);
    resetStore();
    clearDocNavParams(router, pathname);
  };
  const store = useInventoryDocument(
    useShallow(state => ({
      customer: state.customer,
      fromWarehouse: state.fromWarehouse,
      toWarehouse: state.toWarehouse,
      comments: state.comments,
      journalMemo: state.journalMemo,
      docDate: state.docDate,
      lines: state.lines,
      DocEntry: state.DocEntry,
      DocNum: state.DocNum,
      docStatus: state.docStatus,
      udfs: state.udfs,
      loadedDraftData: state.loadedDraftData,
    }))
  );

  const authStatus = methods.watch("AuthorizationStatus" as any);
  const authWithout = isAuthorizationWithout(authStatus);
  const authBadge = mapAuthorizationStatus(authStatus);
  const hasNavApproval = !!docNav.approvalStatus || !!docNav.approvalRequestCode;
  const approvalApplies = useUserHasApprovalTemplate(docType);
  const isPostedLoaded = Number(store.DocEntry) > 0 && !store.loadedDraftData && !docNav.draftEntry;
  const draftBadgeVisible =
    !authWithout && !isPostedLoaded &&
    (approvalApplies || hasNavApproval || !!store.loadedDraftData || badgeState === "draft" || headerBadges.showDraft);
  const statusBadge = authWithout
    ? null
    : (authBadge ?? headerBadges.status ?? (badgeState === "approved" && !draftBadgeVisible ? "approved" : null));

  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { canUpdateApprovedDocument, canOriginatorUpdateDraft, canAuthorizerUpdateDraft } = useApprovalSettings();
  const [approvalTemplates, setApprovalTemplates] = useState<ApprovalTemplate[]>([]);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingFinalData, setPendingFinalData] = useState<T | null>(null);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [pendingReApproval, setPendingReApproval] = useState<{ draftId: number; docType: string | number } | null>(null);

  const [fmsSelectionOpen, setFmsSelectionOpen] = useState(false);
  const [fmsSelectionData, setFmsSelectionData] = useState<{
    rows: Record<string, unknown>[];
    columns: string[];
    targetField: string;
    onSelect: (val: string) => void;
  }>({ rows: [], columns: [], targetField: "", onSelect: () => {} });

  const fms = useFMS({
    docType,
    control: methods.control,
    setValue: methods.setValue,
    getValues: methods.getValues,
    getLines: () => useInventoryDocument.getState().lines as any,
    onMultipleResults: (rows, columns, targetField, onSelect) => {
      setFmsSelectionData({ rows, columns, targetField, onSelect });
      setFmsSelectionOpen(true);
    },
  });

  const previousDocTypeRef = React.useRef<DocumentType | null>(null);
  const lastDefaultValuesKeyRef = React.useRef<string | null>(null);

  useEffect(() => {
    const state = useInventoryDocument.getState();
    const didDocTypeChange = previousDocTypeRef.current !== null && previousDocTypeRef.current !== docType;
    const defaultValuesKey = JSON.stringify(defaultValues ?? {});
    const shouldResetForNewDefaults = defaultValuesKey !== lastDefaultValuesKeyRef.current;

    if (!state.isCopyingTo && didDocTypeChange && !skipAutoReset && shouldResetForNewDefaults) {
      resetStore();
      reset(defaultValues as any);
      lastDefaultValuesKeyRef.current = defaultValuesKey;
    }

    previousDocTypeRef.current = docType;
  }, [docType, resetStore, reset, defaultValues, skipAutoReset]); 

  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    const state = useInventoryDocument.getState();
    const defaultValuesKey = JSON.stringify(defaultValues ?? {});

    if (defaultValuesKey === lastDefaultValuesKeyRef.current) {
      return;
    }
    lastDefaultValuesKeyRef.current = defaultValuesKey;

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
    const current = methods.getValues() as Record<string, any>;
    const sync = (name: string, val: any) => {
      if (current[name] !== val) setValue(name as any, val as any);
    };
    sync("CardCode", store.customer?.CardCode || "");
    sync("CardName", store.customer?.CardName || "");
    sync("FromWarehouse", store.fromWarehouse || "");
    sync("ToWarehouse", store.toWarehouse || "");
    sync("Comments", store.comments || "");
    sync("JournalMemo", store.journalMemo || "");
    sync("TaxDate", store.docDate || "");
    sync("DocEntry", store.DocEntry || 0);
    sync("DocNum", store.DocNum || 0);
    sync("DocStatus", store.docStatus || "");
    if (current.DocumentLines !== store.lines) {
      setValue("DocumentLines" as any, (store.lines || []) as any);
    }
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
    setValue,
    methods,
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

      const openLines = openLinesForCopyFrom(state.lines as any[]);
      if (state.lines.length > 0 && openLines.length === 0) {
        setIsLoadingCopyTo(false);
        toast.warning("This document has no remaining open quantity to copy.");
        return;
      }

      const copiedLines = openLines.map((line: any, idx: number) => ({
        ...line,
        BaseType: docType,
        BaseEntry: DocEntry,
        BaseLine: line.LineNum ?? idx,
      }));

      const existingComments = (state.comments || "").trim();
      const copyToText = `Copy To Based on Inventory Transfer Request ${state.DocNum}`;
      const updatedComments = existingComments ? `${existingComments}\n${copyToText}` : copyToText;

      useInventoryDocument.setState({
        lines: copiedLines,
        fromWarehouse: copiedLines[0]?.FromWhsCode || state.fromWarehouse || "",
        toWarehouse: copiedLines[0]?.WhsCode || state.toWarehouse || "",
        comments: updatedComments,
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

        const validLines = openLinesForCopyFrom(doc.DocumentLines || doc.StockTransferLines || doc.InventoryTransferLines || [])
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
        const existingComments = ((mergedDoc?.Comments !== undefined && mergedDoc?.Comments !== null) ? mergedDoc.Comments : (mergedDoc?.comments || "")).trim();
        const copyFromText = `Copy From Based on Inventory Transfer Request ${nums.join(", ")}`;
        const updatedComments = existingComments ? `${existingComments}\n${copyFromText}` : copyFromText;
        useInventoryDocument.setState({ comments: updatedComments });
        setValue("Comments" as any, updatedComments as any, { shouldDirty: true });
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
  const isApprovalDraftContext =
    isApprovedDraft || isRejectedApproval || isPendingApproval || !!docNav.draftEntry;

  const getSubmitButtonText = () => {
    if (isSaving) {
      if (isApprovalDraftContext) return "Creating...";
      if (isEditMode) return "Updating...";
      return "Submitting...";
    }
    if (isApprovalDraftContext) return "Create";
    if (isEditMode) return "Update";
    return "Submit";
  };

  const onSubmitValid = async (data: T) => {
    const state = useInventoryDocument.getState();
    const currentUserId = user?.sapUserId;
    const finalData = { ...data, DocumentLines: state.lines } as unknown as T;

    if (config.showGLAccount && state.lines.some((l) => !String(l.AccountCode || "").trim())) {
      toast.info("G/L account missing. Please set a G/L account on every line before saving.");
      return;
    }

    if (isBranchMissing((finalData as any).BPL_IDAssignedToInvoice)) {
      toast.error("Please select a branch before submitting.");
      return;
    }

    if (isBranchInactive((finalData as any).BPL_IDAssignedToInvoice)) {
      toast.error("The selected branch is inactive. Please choose an active branch before submitting.");
      return;
    }

    const buildDraftPatchPayload = () => buildInvDraftPayload(docType, finalData, state);

    // Validate serial/batch allocation up front, regardless of which submit path
    // (fresh document, rejected-draft resubmit, approved-draft resubmit) is taken below —
    // otherwise a resubmit branch could skip this and reach SAP with an unallocated line.
    if (docType === DocumentType.GoodIssue) {
      if (linesNeedSerialAllocation(state.lines)) {
        useInventoryDocument.getState().setSelectedLineForModal(null);
        useInventoryDocument.getState().setSerialModalOpen(true);
        return;
      }
      if (linesNeedBatchAllocation(state.lines)) {
        useInventoryDocument.getState().setSelectedLineForModal(null);
        useInventoryDocument.getState().setBatchModalOpen(true);
        return;
      }
    }

    if (isRejectedApproval && docNav.draftEntry) {
      setIsSaving(true);
      try {
        await patchDraftDocument(Number(docNav.draftEntry), buildDraftPatchPayload());
      } catch (err) {
        toast.error(getSapErrorMessage(err) || "Failed to update approval draft");
        setIsSaving(false);
        return;
      }

      let templates = approvalTemplates;
      if (currentUserId) {
        try {
          const docTypeStr = getApprovalDocumentType(docType);
          templates = await getCurrentUserApprovalTemplates(currentUserId, docTypeStr);
        } catch {
          templates = [];
        }
      }
      if (templates && templates.length > 0) {
        setApprovalTemplates(templates);
        setPendingReApproval({ draftId: Number(docNav.draftEntry), docType: String(docType) });
        setIsSaving(false);
        setApprovalModalOpen(true);
        return;
      }
      toast.success("Draft updated. The approval request will be re-submitted.");
      resetFormAndNav();
      setIsSaving(false);
      return;
    }

    if (isPendingApproval && docNav.draftEntry) {
      const pendingRole = docNav.approvalRole === "approver" ? "approver" : "originator";
      const canEditPending = pendingRole === "approver" ? canAuthorizerUpdateDraft : canOriginatorUpdateDraft;
      if (!canEditPending) {
        toast.info("This document is currently awaiting approval. You cannot modify it until it has been approved or rejected.");
        return;
      }
      setIsSaving(true);
      try {
        await patchDraftDocument(Number(docNav.draftEntry), buildDraftPatchPayload());
        toast.success("Draft updated. It remains pending approval.");
        resetFormAndNav();
      } catch (err: any) {
        toast.error(getSapErrorMessage(err) || "Failed to update the pending draft");
      }
      setIsSaving(false);
      return;
    }

    if (isApprovedDraft && docNav.draftEntry) {
      const approvedChanged = hasDraftChanges(state.loadedDraftData, state.lines, finalData);
      const confirmedUnchanged = approvedChanged
        ? false
        : !(await validateDraftChanged(Number(docNav.draftEntry), state.lines, finalData));
      if (confirmedUnchanged) {
        setIsSaving(true);
        try {
          await onSubmit(finalData);
          resetFormAndNav();
        } catch (err: any) {
          toast.error(getSapErrorMessage(err) || "Failed to create document from draft");
        }
        setIsSaving(false);
        return;
      }

      if (!canUpdateApprovedDocument || !canOriginatorUpdateDraft) {
        toast.info(APPROVED_DOC_EDIT_BLOCKED_MSG);
        return;
      }

      setIsSaving(true);
      try {
        await patchDraftDocument(Number(docNav.draftEntry), buildDraftPatchPayload());
      } catch (patchErr) {
        toast.error(getSapErrorMessage(patchErr) || "Failed to save changes to the approval draft");
        setIsSaving(false);
        return;
      }


      setIsSaving(false);

      try {
        const reTemplates = await getCurrentUserApprovalTemplates(
          currentUserId || 0,
          getApprovalDocumentType(docType)
        );
        if (reTemplates && reTemplates.length > 0) setApprovalTemplates(reTemplates);
      } catch {}

      setPendingReApproval({ draftId: Number(docNav.draftEntry), docType: String(docType) });
      setPendingFinalData(null);
      setApprovalModalOpen(true);
      return;
    }

    if (currentUserId) {
      setIsCheckingApproval(true);
      try {
        const docTypeStr = getApprovalDocumentType(docType);
        const activeTemplates = await getCurrentUserApprovalTemplates(currentUserId, docTypeStr);
        if (activeTemplates && activeTemplates.length > 0) {
          setApprovalTemplates(activeTemplates);
          setPendingReApproval(null);
          setPendingFinalData(finalData);
          setApprovalModalOpen(true);
          setIsCheckingApproval(false);
          return;
        }
      } catch (err) {
        console.error("Failed to check approval templates:", err);
      } finally {
        setIsCheckingApproval(false);
      }
    }

    setIsSaving(true);
    try {
      await onSubmit(data);
      resetFormAndNav();
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
     <FmsProvider value={fms}>
      <FormProvider {...methods}>
        <FmsKeyboardBridge />
        <FieldNameInspector />
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
                {draftBadgeVisible && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5">
                    Draft
                  </span>
                )}
                {statusBadge === "pending" && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-sky-600 bg-sky-50 border border-sky-200/60 rounded px-1.5 py-0.5">
                    Pending
                  </span>
                )}
                {statusBadge === "approved" && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-200/60 rounded px-1.5 py-0.5">
                    Approved
                  </span>
                )}
                {statusBadge === "rejected" && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50 border border-rose-200/60 rounded px-1.5 py-0.5">
                    Rejected
                  </span>
                )}
              </h1>
            </div>
            {actions && <div>{actions}</div>}
          </div>

          <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto overflow-x-hidden w-full min-w-0">
            {relMapStore.isOpen ? (
              <RelationshipMapView
                docType={relMapStore.docType || (config.type as number)}
                docEntry={relMapStore.docEntry || Number(DocEntry)}
                docNum={relMapStore.docNum || (methods.watch as any)("DocNum")}
                onClose={relMapStore.closeMap}
              />
            ) : (
              children
            )}
          </div>

          {!relMapStore.isOpen && (
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
          )}

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
              if (pendingReApproval) {
                await runReopenApproval(Number(docNav.approvalRequestCode) || 0);
                setPendingReApproval(null);
                setPendingFinalData(null);
                setApprovalModalOpen(false);
                resetFormAndNav();
                return;
              }

              if (!pendingFinalData) return;
              const finalData = {
                ...(pendingFinalData as any),
                Comments: (pendingFinalData as any).Comments || "",
              } as T;

              await onSubmit(finalData);
              setPendingFinalData(null);
              resetFormAndNav();
            }}
          />

          <FMSSelectionModal
            open={fmsSelectionOpen}
            onClose={() => setFmsSelectionOpen(false)}
            rows={fmsSelectionData.rows}
            columns={fmsSelectionData.columns}
            targetField={fmsSelectionData.targetField}
            onSelect={fmsSelectionData.onSelect}
          />
        </form>
      </FormProvider>
     </FmsProvider>
    </InvDocContext.Provider>
  );
}
