"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  FieldValues,
  FormProvider,
  useForm,
  DefaultValues,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FilePlus2, Loader2, Keyboard } from "lucide-react";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { resolveDocNavParams } from "@/lib/docNavParams";
import { patchDraftDocument } from "@/api+/sap/draft/draftService";
import { buildPurchaseDocumentPatchPayload } from "@/lib/sap/helpers/purchasePayloadHelper";
import { hasDraftChanges } from "@/lib/approval/approvalChanges";
import { linesNeedSerialAllocation, linesNeedBatchAllocation } from "@/lib/sap/helpers/serialBatchHelper";
import { linesHaveInvalidPrice } from "@/lib/sap/helpers/priceValidationHelper";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

import { HeaderActionPortal } from "@/components/header-portal";
import { HeaderModalAction } from "@/components/header-modal-action";
import { KeyboardShortcutsContent } from "@/components/keyboard-shortcuts-content";
import HeaderActions from "@/components/Custom/HeaderAction";

import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { useShallow } from "zustand/react/shallow";
import { useUDFStore } from "@/stores/useUDFStore";

import {
  DocumentConfig,
  getDocumentConfig,
} from "@/lib/config/purchase/documentConfig";

import { DocumentType } from "@/types/master/DocumentType";

import {
  getPurchaseDeliveryByBP,
  getPurchaseDeliveryDocument,
  getPurchaseOrderByBP,
  getPurchaseOrderDocument,
  getPurchaseQuotationByBP,
  getPurchaseQuotationDocument,
  getPurchaseRequestsByBP,
} from "@/api+/sap/purchase/purchaseService";

import { UDFLayout } from "../shared/UDFSheet";
import { GenericModal } from "@/modals/GenericModal";
import { SerialNumberSelectionDialog } from "@/modals/SerialNumberSelectionDialog";
import { BatchNumberSelectionDialog } from "@/modals/BatchNumberSelectionDialog";
import { getCurrentUserApprovalTemplates, getApprovalDocumentType, submitApprovalRequest } from "@/api+/sap/Templates/approvalTemplate";
import { ApprovalTemplate } from "@/types/template.type";
import { RequestDocumentGenerationModal } from "@/modals/RequestDocumentGenerationModal";
import { useAuth } from "@/context/authContext";

const PurchaseDocContext = createContext<DocumentConfig | null>(null);

export const usePurchaseDocConfig = () => {
  const context = useContext(PurchaseDocContext);
  if (!context) throw new Error("usePurchaseDocConfig must be used within PurchaseDocumentLayout");
  return context;
};

interface PurchaseDocumentLayoutProps<T extends FieldValues> {
  schema: z.ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<void>;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  docType: DocumentType;
  title?: string;
}

export function PurchaseDocumentLayout<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  actions,
  docType,
  title,
}: PurchaseDocumentLayoutProps<T>) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const docNav = React.useMemo(() => resolveDocNavParams(searchParams, pathname), [searchParams, pathname]);
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

  const [approvalTemplates, setApprovalTemplates] = useState<ApprovalTemplate[]>([]);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingFinalData, setPendingFinalData] = useState<T | null>(null);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
 const [pendingReApproval, setPendingReApproval] = useState<{ draftId: number; docType: string | number } | null>(null);

  const methods = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, watch, formState: { isSubmitting, isDirty, errors } } = methods;
  const { reset: lineReset, lines, requester, DocEntry, loadFromDocument, isCopying, setIsCopying, udfs: storeUdfs } = usePurchaseDocument(
    useShallow(state => ({
      reset: state.reset,
      lines: state.lines,
      requester: state.requester,
      DocEntry: state.DocEntry,
      loadFromDocument: state.loadFromDocument,
      isCopying: state.isCopying,
      setIsCopying: state.setIsCopying,
      udfs: state.udfs,
    }))
  );

  const docStatus = watch("DocStatus" as any);
  const docEntry = watch("DocEntry" as any);

  const isEditMode = docEntry && Number(docEntry) > 0;
  const normalizedStatus = docStatus?.toString().replace("bost_", "");
  const shouldHideSubmit = isEditMode && normalizedStatus === "Close";
  const router = useRouter();
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedCopyTo, setSelectedCopyTo] = useState<string>("");
  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const [copyFromType, setCopyFromType] = useState<DocumentType | null>(null);
  const [copyFromData, setCopyFromData] = useState<any[]>([]);
  const [isLoadingCopyFrom, setIsLoadingCopyFrom] = useState(false);
  const [selectedCopyFrom, setSelectedCopyFrom] = useState<string>("");
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isLoadingCopyTo, setIsLoadingCopyTo] = useState(false);
  const [serialModalOpen, setSerialModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<T | null>(null);
  const lastDefaultValuesRef = React.useRef<string | null>(null);

  const ResetForm = () => {
    const today = new Date().toISOString().split("T")[0];
    reset({
      ...defaultValues,
      CardCode: "",
      CardName: "",
      Comments: "",
      DocNum: 0,
      DocEntry: 0,
      DocDate: today,
      DocDueDate: today,
      TaxDate: today,
    } as any);
    lineReset();
  };

  useEffect(() => {
    const state = usePurchaseDocument.getState();
    const defaultValuesKey = JSON.stringify(defaultValues ?? {});

    if (defaultValuesKey === lastDefaultValuesRef.current) {
      return;
    }

    lastDefaultValuesRef.current = defaultValuesKey;

    if (isCopying) {
      reset({
        ...defaultValues,
        CardCode: state.requester?.CardCode || "",
        CardName: state.requester?.CardName || "",
        DocDate: state.docDate,
        DocDueDate: state.docDueDate,
        TaxDate: state.taxDate,
        Comments: state.comments,
        DiscountPercent: state.discountPercent,
        Freight: state.freight,
        Rounding: state.rounding,
        ...state.udfs,
      } as unknown as DefaultValues<T>);

      setIsCopying(false);
    } else if (!isDirty) {
      ResetForm();
    }
  }, [defaultValues, isCopying, isDirty, lineReset, reset, setIsCopying]);

  const fetchCopyFromData = async (type: DocumentType) => {
    if (!requester?.CardCode) return;
    setIsLoadingCopyFrom(true);
    try {
      let data: any[] | null = [];
      if (type === DocumentType.PurchaseQuotation) {
        data = await getPurchaseQuotationByBP(requester.CardCode);
      } else if (type === DocumentType.PurchaseOrder) {
        data = await getPurchaseOrderByBP(requester.CardCode);
      } 
      else if (type === DocumentType.PurchaseRequests) {
        data = await getPurchaseRequestsByBP(requester.CardCode);
      }
      else if (type === DocumentType.GoodsReceiptPO) {
        data = await getPurchaseDeliveryByBP(requester.CardCode);
      }
      setCopyFromData(data || []);
      setCopyFromOpen(true);
    } catch (err) {
      toast.error("Failed to fetch documents");
    } finally {
      setIsLoadingCopyFrom(false);
    }
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) return "Saving...";
    if (docEntry === "0" || !isEditMode) return "Submit";
    if (isEditMode && docStatus === "bost_Open") return "Update";
    return "";
  };

  const copyToOptions = (() => {
    switch (docType) {
      case DocumentType.PurchaseRequests:
        return [
          DocumentType.PurchaseQuotation,
          DocumentType.PurchaseOrder,
          DocumentType.GoodsReceiptPO,
          DocumentType.APInvoice,
        ];
      case DocumentType.PurchaseQuotation:
        return [
          DocumentType.PurchaseOrder,
          DocumentType.GoodsReceiptPO,
          DocumentType.APInvoice,
        ];

      case DocumentType.PurchaseOrder:
        return [DocumentType.GoodsReceiptPO, DocumentType.APInvoice];

      case DocumentType.GoodsReceiptPO:
        return [DocumentType.APInvoice];

      default:
        return [];
    }
  })();

  const handleCopyClick = (selected?: string) => {
    const copyType = selected || selectedCopyTo;

    if (!DocEntry) {
      setSelectedCopyTo("");
      toast.error("Please save or select a document first!");
      return;
    }
    setIsLoadingCopyTo(true);
    if (copyType === DocumentType.PurchaseRequests.toString()) {
      setIsCopying(true);
      router.push("/dashboard/purchase/request/new");
    } 
    else if (copyType === DocumentType.PurchaseOrder.toString()) {
      setIsCopying(true);
      router.push("/dashboard/purchase/order/new");
    } else if (copyType === DocumentType.GoodsReceiptPO.toString()) {
      setIsCopying(true);
      router.push("/dashboard/purchase/grpo/new");
    } else if (copyType === DocumentType.APInvoice.toString()) {
      setIsCopying(true);
      router.push("/dashboard/purchase/invoice/new");
    } else {
      toast.info("Copy to this document type is not implemented yet.");
    }
  };

  const config = React.useMemo(() => getDocumentConfig(docType), [docType]);
  const fetchUdfDefinitions = useUDFStore(state => state.fetchDefinitions);

  React.useEffect(() => {
    fetchUdfDefinitions(docType);
  }, [docType, fetchUdfDefinitions]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const errorFields = Object.keys(errors).join(", ");
      toast.error(`Please fix validation errors in: ${errorFields}`);
    }
  }, [errors]);

  const handleCopyFromSelect = async (docNum: any) => {
    setIsLoadingDocument(true);
    try {
      let doc: any = null;
      if (copyFromType === DocumentType.PurchaseQuotation) {
        doc = await getPurchaseQuotationDocument(docNum);
      } else if (copyFromType === DocumentType.PurchaseOrder) {
        doc = await getPurchaseOrderDocument(docNum);
      } else if (copyFromType === DocumentType.GoodsReceiptPO) {
        doc = await getPurchaseDeliveryDocument(docNum);
      }

      if (doc && copyFromType) {
        loadFromDocument(doc, copyFromType);
        toast.success(`Copied from ${copyFromType === DocumentType.PurchaseQuotation ? 'Purchase Quotation' : copyFromType === DocumentType.PurchaseOrder ? 'Purchase Order' : 'Goods Receipt'} #${docNum}`);
      }
    } catch (err) {
      toast.error("Failed to load document");
    } finally {
      setIsLoadingDocument(false);
    }
  };

  const copyFromOptions = (() => {
    if (docType === DocumentType.PurchaseOrder) return [DocumentType.PurchaseQuotation];
    if (docType === DocumentType.GoodsReceiptPO) return [DocumentType.PurchaseOrder, DocumentType.PurchaseQuotation];
    if (docType === DocumentType.APInvoice) return [DocumentType.GoodsReceiptPO, DocumentType.PurchaseOrder, DocumentType.PurchaseQuotation];
    return [];
  })();

  return (
    <PurchaseDocContext.Provider value={config}>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(async (data) => {
            const state = usePurchaseDocument.getState();
            const currentUserId = user?.sapUserId;

            if (linesHaveInvalidPrice(state.lines)) {
              toast.error("One or more items have a price of 0 or less. Please set a valid price before submitting.");
              return;
            }

            // Validate serial/batch allocation up front, regardless of which submit path
            // (fresh document, rejected-draft resubmit, approved-draft resubmit) is taken
            // below — otherwise a resubmit branch could skip this and reach SAP with an
            // unallocated line.
            const isSerialBatchPurchaseDoc = [
              DocumentType.GoodsReceiptPO,
              DocumentType.APInvoice,
              DocumentType.APCreditMemo,
            ].includes(docType);

            if (isSerialBatchPurchaseDoc && linesNeedSerialAllocation(state.lines)) {
              setPendingData(data as unknown as T);
              setSerialModalOpen(true);
              return;
            }

            if (isSerialBatchPurchaseDoc && linesNeedBatchAllocation(state.lines)) {
              setPendingData(data as unknown as T);
              setBatchModalOpen(true);
              return;
            }

            if (isRejectedApproval && docNav.draftEntry) {
              try {
                const patchPayload = buildPurchaseDocumentPatchPayload({
                  data: data as any,
                  lines: state.lines,
                  discountPercent: state.discountPercent,
                  freight: state.freight,
                  rounding: state.rounding,
                  additionalExpenses: state.additionalExpenses,
                  includeLines: [
                    DocumentType.PurchaseRequests,
                    DocumentType.PurchaseQuotation,
                    DocumentType.PurchaseOrder,
                  ].includes(docType),
                });
                await patchDraftDocument(Number(docNav.draftEntry), patchPayload);
              } catch (err: any) {
                toast.error(err?.response?.data?.Message || "Failed to update approval draft");
                return;
              }
              if (currentUserId) {
                try {
                  const docTypeStr = getApprovalDocumentType(docType, pathname);
                  const activeTemplates = await getCurrentUserApprovalTemplates(currentUserId, docTypeStr);
                  if (activeTemplates && activeTemplates.length > 0) {
                    setApprovalTemplates(activeTemplates);
                    setPendingReApproval({ draftId: Number(docNav.draftEntry), docType: String(docType) });
                    setApprovalModalOpen(true);
                    return;
                  }
                } catch {
                  /* fall through */
                }
              }
              toast.success("Draft updated. The approval request will be re-submitted.");
              ResetForm();
              return;
            }

           if (isPendingApproval && docNav.draftEntry) {
              toast.info("This document is currently awaiting approval. You cannot modify it until it has been approved or rejected.");
              return;
            }

            if (isApprovedDraft && docNav.draftEntry) {
              const approvedSnapshot = state.loadedDraftData;
              const currentHeader = {
                ...(data as any),
                DiscountPercent: state.discountPercent,
                Freight: state.freight,
                Rounding: state.rounding,
              };
              const approvedChanged = hasDraftChanges(approvedSnapshot, state.lines, currentHeader);
              if (!approvedChanged) {
                try {
                  await onSubmit(data as unknown as T);
                  ResetForm();
                } catch (err: any) {
                  toast.error(err?.response?.data?.Message || "Failed to create the document");
                }
                return;
              }
              try {
                const patchPayload = buildPurchaseDocumentPatchPayload({
                  data: data as any,
                  lines: state.lines,
                  discountPercent: state.discountPercent,
                  freight: state.freight,
                  rounding: state.rounding,
                  additionalExpenses: state.additionalExpenses,
                  includeLines: [
                    DocumentType.PurchaseRequests,
                    DocumentType.PurchaseQuotation,
                    DocumentType.PurchaseOrder,
                  ].includes(docType),
                });
                await patchDraftDocument(Number(docNav.draftEntry), patchPayload);
              } catch (err: any) {
                toast.error(err?.response?.data?.Message || "Failed to update approval draft");
                return;
              }
              let approvedTemplates = approvalTemplates;
              if (currentUserId) {
                try {
                  const docTypeApproved = getApprovalDocumentType(docType, pathname);
                  approvedTemplates = await getCurrentUserApprovalTemplates(currentUserId, docTypeApproved);
                } catch {
                  approvedTemplates = [];
                }
              }
              if (approvedTemplates && approvedTemplates.length > 0) {
                setApprovalTemplates(approvedTemplates);
                setPendingReApproval({ draftId: Number(docNav.draftEntry), docType: String(docType) });
                setApprovalModalOpen(true);
                return;
              }
              toast.success("Approved document updated. A new approval request is required.");
              ResetForm();
              return;
            }

            if (currentUserId) {
              setIsCheckingApproval(true);
              try {
                const docTypeStr = getApprovalDocumentType(docType);
                const activeTemplates = await getCurrentUserApprovalTemplates(currentUserId, docTypeStr);
                if (activeTemplates && activeTemplates.length > 0) {
                  setApprovalTemplates(activeTemplates);
                  setPendingFinalData(data as unknown as T);
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

            try {
              await onSubmit(data as unknown as T);
              ResetForm();
            } catch (error) {
              console.error("Submit Error:", error);
            }
          })}
          className="flex flex-col min-h-screen bg-background"
        >
          <HeaderActionPortal>
            <HeaderActions
              DocEntry={DocEntry || 0}
              objectCode={docType}
              reset={reset}
              defaultValues={defaultValues}
              resetStore={ResetForm}
            />
          </HeaderActionPortal>

          <div className="flex justify-between items-center px-6 py-3 border-b bg-muted shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{title || config.title}</h1>
            </div>

            {actions && <div>{actions}</div>}
          </div>

          <div className="flex flex-col min-h-0 overflow-hidden px-6 py-4 flex-1">
            {children}
          </div>

          {!shouldHideSubmit && (
            <div className="border-t px-6 py-4 flex justify-end bg-white shadow-md gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <Select
                  value={selectedCopyFrom}
                  disabled={!requester?.CardCode || copyFromOptions.length === 0 || isLoadingDocument || isLoadingCopyFrom}
                  onValueChange={(value) => {
                    const type = parseInt(value) as DocumentType;
                    setCopyFromType(type);
                    fetchCopyFromData(type);
                    setTimeout(() => setSelectedCopyFrom(""), 0);
                  }}
                >
                  <SelectTrigger
                    className="w-[180px] h-9 bg-black text-white hover:bg-zinc-800 focus:ring-0"
                    disabled={isLoadingCopyFrom || isLoadingDocument || isLoadingCopyTo}
                  >
                    <div className="flex items-center gap-2">
                      {(isLoadingCopyFrom || isLoadingDocument) && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                      <SelectValue placeholder="Copy From" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {copyFromOptions.map((type) => (
                        <SelectItem key={type} value={type.toString()}>
                          {type === DocumentType.PurchaseQuotation ? "Purchase Quotation" :
                            type === DocumentType.PurchaseOrder ? "Purchase Order" :
                              type === DocumentType.GoodsReceiptPO ? "Goods Receipt" : ""}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedCopyTo}
                  disabled={copyToOptions.length === 0 || isLoadingDocument || isLoadingCopyFrom || isLoadingCopyTo}
                  onValueChange={(value) => {
                    setSelectedCopyTo(value);
                    handleCopyClick(value);
                  }}
                >
                  <SelectTrigger
                    className="w-[180px] h-9 bg-black text-white hover:bg-zinc-800 focus:ring-0"
                    disabled={isLoadingCopyTo}
                  >
                    <div className="flex items-center gap-2">
                      {isLoadingCopyTo && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                      <SelectValue placeholder="Copy To" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {copyToOptions.includes(DocumentType.PurchaseOrder) && (
                        <SelectItem value={DocumentType.PurchaseOrder.toString()}>
                          Purchase Order
                        </SelectItem>
                      )}
                      {copyToOptions.includes(DocumentType.GoodsReceiptPO) && (
                        <SelectItem value={DocumentType.GoodsReceiptPO.toString()}>
                          Goods Receipt
                        </SelectItem>
                      )}
                      {copyToOptions.includes(DocumentType.APInvoice) && (
                        <SelectItem value={DocumentType.APInvoice.toString()}>
                          AP Invoice
                        </SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <Button 
                  type="submit" 
                  disabled={isSubmitting || isLoadingDocument || (isEditMode && normalizedStatus === "Close")}
                  className="min-w-[100px]"
                >
                  {getSubmitButtonText()}
                </Button>
              </div>
            </div>
          )}
          
          <GenericModal
            title={`Select ${copyFromType === DocumentType.PurchaseQuotation ? 'Purchase Quotation' : copyFromType === DocumentType.PurchaseOrder ? 'Purchase Order' : 'Goods Receipt'}`}
            open={copyFromOpen}
            onClose={() => setCopyFromOpen(false)}
            onSelect={handleCopyFromSelect}
            data={copyFromData}
            columns={[
              { key: "DocNum", label: "Doc Num" },
              { key: "CardName", label: "Vendor Name" },
              { key: "RefDate", label: "Date" },
              { key: "DueDate", label: "Due Date" },
            ]}
            getSelectValue={(item) => item.DocNum}
            isLoading={isLoadingCopyFrom}
          />
          <UDFLayout docType={docType} values={storeUdfs} />

          <SerialNumberSelectionDialog
            open={serialModalOpen}
            onClose={() => {
              setSerialModalOpen(false);
              setPendingData(null);
            }}
            onConfirm={async (selections) => {
              const state = usePurchaseDocument.getState();

              if (selections.serials) {
                Object.entries(selections.serials).forEach(([itemCode, serials]) => {
                  state.setLineSerials(itemCode, serials);
                });
              }

              const updatedLines = usePurchaseDocument.getState().lines;
              setSerialModalOpen(false);

              if (linesNeedBatchAllocation(updatedLines)) {
                setBatchModalOpen(true);
                return;
              }

              setPendingData(null);
            }}
            lines={usePurchaseDocument.getState().lines}
          />

          <BatchNumberSelectionDialog
            open={batchModalOpen}
            onClose={() => {
              setBatchModalOpen(false);
              setPendingData(null);
            }}
            onConfirm={async (selections) => {
              const state = usePurchaseDocument.getState();

              if (selections.batches) {
                Object.entries(selections.batches).forEach(([itemCode, batches]) => {
                  state.setLineBatches(itemCode, batches);
                });
              }

              setBatchModalOpen(false);
              setPendingData(null);
            }}
            lines={usePurchaseDocument.getState().lines}
          />

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
                    ObjectType: pendingReApproval.docType,
                    IsDraft: "Y",
                    ApproverUserID: tpl?.ApprovalTemplateUsers?.[0]?.UserID,
                    OriginatorID: user?.sapUserId,
                    Remarks: remarks || "",
                  });
                  toast.success("Draft updated and the approval request was re-submitted.");
                } catch (err: any) {
                  toast.error(err?.response?.data?.Message || "Failed to resubmit the approval request.");
                }
                setPendingReApproval(null);
                setPendingFinalData(null);
                ResetForm();
                return;
              }

              if (!pendingFinalData) return;

              const finalData = {
                ...(pendingFinalData as any),
                // Approval remarks are submitted separately in SAP's approval request,
                // NOT written onto the document's Comments field.
                Comments: (pendingFinalData as any).Comments || "",
              } as T;

              await onSubmit(finalData);
              setPendingFinalData(null);
              ResetForm();
            }}
          />
        </form>
      </FormProvider>
    </PurchaseDocContext.Provider>
  );
}
