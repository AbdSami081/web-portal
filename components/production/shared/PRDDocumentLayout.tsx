"use client"
import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/production/documentConfig";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { FilePlus2, Keyboard, Loader2 } from "lucide-react";
import { HeaderActionPortal } from "@/components/header-portal";
import { HeaderModalAction } from "@/components/header-modal-action";
import { KeyboardShortcutsContent } from "@/components/keyboard-shortcuts-content";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { DocumentType, DRAFT_OBJECT_TYPES } from "@/types/master/DocumentType";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { resolveDocNavParams, clearDocNavParams } from "@/lib/docNavParams";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";


import { useUDFStore } from "@/stores/useUDFStore";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { getFieldSettings } from "@/lib/config/Client/clientSettings";
import HeaderActions from "@/components/Custom/HeaderAction";
import { getCurrentUserApprovalTemplates, getApprovalDocumentType, submitApprovalRequest, validateDraftChanged } from "@/api+/sap/Templates/approvalTemplate";
import { hasDraftChanges } from "@/lib/approval/approvalChanges";
import { ApprovalTemplate } from "@/types/template.type";
import { RequestDocumentGenerationModal } from "@/modals/RequestDocumentGenerationModal";
import { useAuth } from "@/context/authContext";
import { patchDraftDocument } from "@/api+/sap/draft/draftService";

const PRDDocContext = createContext<DocumentConfig | null>(null);

export const usePRDDocConfig = () => {
  const context = useContext(PRDDocContext);
  if (!context) throw new Error("usePRDDocConfig must be used within PRDDocumentLayout");
  return context;
};

interface PRDDocumentLayoutProps<T extends FieldValues> {
  schema: z.ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<void>;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  docType: DocumentType;
  skipAutoReset?: boolean;
}

export function PRDDocumentLayout<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  actions,
  docType,
  skipAutoReset = false,
}: PRDDocumentLayoutProps<T>) {

  const config = React.useMemo(() => getDocumentConfig(docType), [docType]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const docNav = useMemo(() => resolveDocNavParams(searchParams, pathname), [searchParams, pathname]);
  const isApprovedDraft = docNav.approvalStatus === "arsApproved";
  const isRejectedApproval =
    docNav.approvalStatus === "arsRejected" ||
    docNav.approvalStatus === "arsCancelled" ||
    docNav.approvalStatus === "arsComplete";
  const isPendingApproval =
    (docNav.approvalStatus === "arsPending" ||
      (!docNav.approvalStatus && !!docNav.approvalRequestCode && !!docNav.draftEntry)) &&
    !!docNav.draftEntry;


  const { user } = useAuth();
  const [approvalTemplates, setApprovalTemplates] = React.useState<ApprovalTemplate[]>([]);
  const [approvalModalOpen, setApprovalModalOpen] = React.useState(false);
  const [pendingFinalData, setPendingFinalData] = React.useState<T | null>(null);
  const [isCheckingApproval, setIsCheckingApproval] = React.useState(false);
  const [pendingReApproval, setPendingReApproval] = React.useState<{ draftId: number; docType: string | number } | null>(null);

  const [badgeState, setBadgeState] = React.useState<"draft" | "approved" | null>(() => {
    const draftEntryParam = docNav.draftEntry;
    const docEntryParam = docNav.docEntry;
    const isDraft = Boolean(draftEntryParam) && (docNav.draft ?? searchParams.get("draft")) === "1";

    if (isDraft) return "draft";
    if (docEntryParam) return "approved";
    return null;
  });
  const fetchUdfDefinitions = useUDFStore(state => state.fetchDefinitions);
  const [isCopyingToInventory, setIsCopyingToInventory] = React.useState(false);

  useEffect(() => {
    fetchUdfDefinitions(docType);
  }, [docType, fetchUdfDefinitions]);

  const methods = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { watch, reset, handleSubmit, formState: { isSubmitting, isDirty } } = methods;
  const { lines, attachments, reset: lineReset, initialStatus, udfs, setDocType } = useIFPRDDocument();
  const previousDocType = useRef<DocumentType | null>(null);

  useEffect(() => {
    const storeDocType =
      useIFPRDDocument.getState().docType;

    const isDocTypeChange =
      storeDocType !== docType ||
      previousDocType.current !== null &&
      previousDocType.current !== docType;

    if (isDocTypeChange && !skipAutoReset) {
      lineReset(docType);
      reset(defaultValues as any);
    } else {
      setDocType(docType);
    }

    previousDocType.current = docType;
  }, [docType, setDocType, lineReset, reset, defaultValues, skipAutoReset]);

  useEffect(() => {
    const currentValues = methods.getValues();
    const isDocumentLoaded =
      (currentValues as any).AbsoluteEntry > 0 ||
      (currentValues as any).DocEntry > 0;
    const { lines: storeLines, attachments: storeAttachments } = useIFPRDDocument.getState();
    const hasStoreContent = storeLines.length > 0 || storeAttachments.length > 0;

    if (!isDirty && !isDocumentLoaded && !hasStoreContent && !skipAutoReset) {
      ResetForm(); 
    }
  }, [defaultValues, isDirty, skipAutoReset]);

  const ResetForm = () => {
    const today = new Date().toISOString().split("T")[0];
    reset({
      ...defaultValues,
      CardCode: "",
      CardName: "",
      Comments: "",
      DocNum: 0,
      DocEntry: 0,
      ItemNo: "",
      ProductDescription: "",
      AbsoluteEntry: 0,
      TaxDate: today,
      CreationDate: today,
      StartDate: today,
      DueDate: today,
    } as any);
    lineReset();
  };

  const finishAndReset = () => {
    ResetForm();
    clearDocNavParams(router, pathname);
  };

  const handleCopyFrom = (selected: string) => {
    if (selected !== DocumentType.InvTransferReq.toString()) return;

    const currentValues = methods.getValues() as any;
    const state = useIFPRDDocument.getState();

    if (state.lines.length === 0) {
      toast.error("Please add production order lines first.");
      return;
    }

    setIsCopyingToInventory(true);

    const headerWarehouse = currentValues.Warehouse || "";
    const mappedLines = state.lines.map((line: any, index: number) => {
      const sourceWarehouse = line.Warehouse || headerWarehouse || "";

      return {
        ItemCode: line.ItemNo || line.ItemCode || "",
        Dscription: line.ItemName || line.ItemDescription || "",
        FromWhsCode: headerWarehouse || sourceWarehouse,
        FromBinLoc: "",
        ToBinLoc: "",
        FisrtBin: "",
        WhsCode: sourceWarehouse,
        Quantity: Number(line.PlannedQuantity ?? line.BaseQuantity ?? 0),
        ItemCost: 0,
        LineTotal: 0,
        UoMCode: line.UoMCode || "",
        unitMsr: "",
        PlPaWght: 0,
        U_LastPrice: 0,
        OcrCode2: "",
        OcrCode3: "",
        OcrCode4: "",
        U_OQCR: "",
        U_OQDC: "",
        U_FBRQty: 0,
        U_SaleType: "Retail",
        U_FurtherTax: 0,
        LineNum: index,
        ItemType: line.ItemType || "",
      };
    });

    useInventoryDocument.setState({
      lines: mappedLines.filter((line: any) => line.ItemType != 'pit_Resource'),
      fromWarehouse: mappedLines[0]?.FromWhsCode || headerWarehouse || "",
      toWarehouse: mappedLines[0]?.WhsCode || "",
      comments: `Copied from Production Order ${currentValues.DocNum || currentValues.AbsoluteEntry || currentValues.ItemNo || ""}`.trim(),
      journalMemo: "Inventory Transfer",
      DocEntry: 0,
      DocNum: 0,
      docDate: new Date().toISOString().split("T")[0],
      customer: null,
      attachments: [],
      isCopyingTo: true,
    });

    router.push("/dashboard/inventory/transfer-request");
  };

  const onSubmitError: SubmitErrorHandler<T> = (errors) => {
    const entries = Object.entries(errors);
    if (entries.length > 0) {
      const [fieldName, error] = entries[0];
      const message = (error as any).message || "Please check this field";
      toast.error(`Validation Error on [${fieldName}]: ${message}`);
    }
  };

  return (
    <PRDDocContext.Provider value={config}>
      <FormProvider {...methods}>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            handleSubmit(async (data) => {
              if (isPendingApproval && docNav.draftEntry) {
                try {
                  await patchDraftDocument(Number(docNav.draftEntry), data);
                  toast.success("Approval request modified successfully.");
                  finishAndReset();
                  setBadgeState(null);
                  return;
                } catch (err: any) {
                  toast.error(err?.response?.data?.Message || "Failed to update approval draft");
                  return;
                }
              }

              if (isApprovedDraft && docNav.draftEntry) {
                const prdState = useIFPRDDocument.getState();
                const approvedChanged = hasDraftChanges(prdState.loadedDraftData, prdState.lines, data);
                const confirmedUnchanged = approvedChanged
                  ? false
                  : !(await validateDraftChanged(Number(docNav.draftEntry), prdState.lines, data as any));

                if (confirmedUnchanged) {
                  try {
                    await onSubmit(data as any);
                    finishAndReset();
                    setBadgeState(null);
                  } catch (err: any) {
                    toast.error(err?.response?.data?.Message || "Failed to create the document");
                  }
                  return;
                }

                const currentUserIdApproved = user?.sapUserId;
                if (currentUserIdApproved) {
                  try {
                    const docTypeApproved = getApprovalDocumentType(docType);
                    const activeTemplatesApproved = await getCurrentUserApprovalTemplates(currentUserIdApproved, docTypeApproved);
                    if (activeTemplatesApproved && activeTemplatesApproved.length > 0) {
                      setApprovalTemplates(activeTemplatesApproved);
                      setPendingReApproval({ draftId: Number(docNav.draftEntry), docType: String(docType) });
                      setPendingFinalData(data as any);
                      setApprovalModalOpen(true);
                      return;
                    }
                  } catch {
                    /* no approval template */
                  }
                }

                try {
                  await onSubmit(data as any);
                  finishAndReset();
                  setBadgeState(null);
                } catch (err: any) {
                  toast.error(err?.response?.data?.Message || "Failed to create the document");
                }
                return;
              }

              const currentUserId = user?.sapUserId;
              const isEditMode = Boolean(watch("AbsoluteEntry" as any) || watch("DocEntry" as any));

              if (currentUserId && !isEditMode && badgeState !== "approved") {
                setIsCheckingApproval(true);
                try {
                  const docTypeStr = getApprovalDocumentType(docType);
                  const activeTemplates = await getCurrentUserApprovalTemplates(currentUserId, docTypeStr);
                  if (activeTemplates && activeTemplates.length > 0) {
                    setApprovalTemplates(activeTemplates);
                    setPendingFinalData(data as any);
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

              await onSubmit(data as any);
              finishAndReset();
              setBadgeState(null);
            }, onSubmitError)(e);
          }}
          className="flex flex-col min-h-screen bg-background"
        >


          <HeaderActionPortal>
            <HeaderActions
              DocEntry={watch("DocEntry" as any) || 0}
              objectCode={docType}
              reset={reset}
              defaultValues={defaultValues}
              resetStore={ResetForm}
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

          <div className="flex-1 flex flex-col gap-4 p-6 w-full">
            {children}
          </div>
          <div className="border-t px-6 py-4 flex justify-end gap-4 bg-white shadow-md">
            <div className="flex items-center gap-3">
              {getFieldSettings(docType, "headerFieds", "CopyFrom").visible !== false && (
                <Select
                  value=""
                  onValueChange={handleCopyFrom}
                >
                  <SelectTrigger
                    className="w-[180px] h-9 bg-black text-white hover:bg-zinc-800 focus:ring-0"
                    disabled={isCopyingToInventory || !getFieldSettings(docType, "headerFieds", "CopyFrom").enable || docType !== DocumentType.ProductionOrder}
                  >
                    <div className="flex items-center gap-2">
                      {isCopyingToInventory && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                      <SelectValue placeholder="Copy To" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {docType === DocumentType.ProductionOrder && (
                        <SelectItem value={DocumentType.InvTransferReq.toString()}>
                          Inventory Transfer Request
                        </SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}


              {initialStatus !== "boposClosed" && (
                <Button type="submit" disabled={isSubmitting || (docType === DocumentType.IssueForProduction && lines.length === 0)}>
                  {isSubmitting ? "Saving..." : ((watch("AbsoluteEntry" as any) || watch("DocEntry" as any)) ? "Update" : "Submit")}
                </Button>
              )}
            </div>
          </div>
          <UDFLayout docType={docType} values={udfs} />

          <RequestDocumentGenerationModal
            open={approvalModalOpen}
            onClose={() => setApprovalModalOpen(false)}
            templates={approvalTemplates}
            onConfirm={async (remarksMap) => {
              if (pendingReApproval) {
                const tpl = approvalTemplates[0];
                const remarks = tpl ? (remarksMap[tpl.Code] ?? "").trim() : "";
                const approvalRequestId = Number(docNav.approvalRequestCode) || 0;
                try {
                  await submitApprovalRequest(approvalRequestId, {
                    TemplateCode: tpl?.Code,
                    ObjectEntry: pendingReApproval.draftId,
                    ObjectType: DRAFT_OBJECT_TYPES[0],
                    IsDraft: "Y",
                    ApproverUserID: tpl?.ApprovalTemplateUsers?.[0]?.UserID,
                    OriginatorID: user?.sapUserId,
                    Remarks: remarks || "",
                  });
                  toast.success("Draft updated and the approval request was re-submitted.");
                } catch (err: any) {
                  toast.warning(err?.response?.data?.Message || "Approval re-submitted. Remarks could not be attached.");
                }
                setPendingReApproval(null);
                setPendingFinalData(null);
                finishAndReset();
                setBadgeState(null);
                return;
              }

              if (!pendingFinalData) return;

              const firstRemarks = approvalTemplates[0]
                ? (remarksMap[approvalTemplates[0].Code] ?? "").trim()
                : "";
              const finalData = {
                ...(pendingFinalData as any),
                Comments: firstRemarks || (pendingFinalData as any).Comments || (pendingFinalData as any).Remarks || "",
                Remarks: firstRemarks || (pendingFinalData as any).Remarks || "",
              } as T;

              await onSubmit(finalData);
              setPendingFinalData(null);
              finishAndReset();
              setBadgeState(null);
            }}
          />
        </form>

      </FormProvider>
    </PRDDocContext.Provider>
  );
}
