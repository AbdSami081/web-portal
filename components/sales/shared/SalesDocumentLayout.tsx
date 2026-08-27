"use client"
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/sales/documentConfig";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { resolveDocNavParams, clearDocNavParams } from "@/lib/docNavParams";
import { toast } from "sonner";
import { GenericModal } from "@/modals/GenericModal";
import { getQuotationByBP, getSalesOrderByBP, getSalesDeliveryByBP, getQuotationDocument, getSalesOrderDocument, getSalesDeliveryDocument, getARInvoiceByBP, getSalesReturnRequestByBP, getARInvoiceDocument, getSalesReturnRequestDocument } from "@/api+/sap/sales/salesService";
import { FilePlus2, Loader2, Keyboard, Circle } from "lucide-react";
import { HeaderActionPortal } from "@/components/header-portal";
import { HeaderModalAction } from "@/components/header-modal-action";
import { KeyboardShortcutsContent } from "@/components/keyboard-shortcuts-content";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DocumentType, DRAFT_OBJECT_TYPES } from "@/types/master/DocumentType";
import { useUDFStore } from "@/stores/useUDFStore";
import { DocumentHeader } from "./DocumentHeader";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { SerialNumberSelectionDialog } from "@/modals/SerialNumberSelectionDialog";
import { BatchNumberSelectionDialog } from "@/modals/BatchNumberSelectionDialog";
import HeaderActions from "@/components/Custom/HeaderAction";
import { useAuth } from "@/context/authContext";
import { getCurrentUserApprovalTemplates, getApprovalDocumentType, submitApprovalRequest, validateDraftChanged } from "@/api+/sap/Templates/approvalTemplate";
import { RequestDocumentGenerationModal } from "@/modals/RequestDocumentGenerationModal";
import { ApprovalTemplate } from "@/types/template.type";
import { patchDraftDocument } from "@/api+/sap/draft/draftService";
import { buildSalesDocumentPatchPayload } from "@/lib/sap/helpers/salesPayloadHelper";
import { hasDraftChanges } from "@/lib/approval/approvalChanges";
import { linesNeedSerialAllocation, linesNeedBatchAllocation } from "@/lib/sap/helpers/serialBatchHelper";
import { linesHaveInvalidPrice } from "@/lib/sap/helpers/priceValidationHelper";
import { isBranchMissing, isBranchInactive } from "@/lib/sap/helpers/branchValidationHelper";
import { openLinesForCopyFrom } from "@/lib/sap/helpers/copyFromQuantity";


const SalesDocContext = createContext<DocumentConfig | null>(null);

export const useSalesDocConfig = () => {
  const context = useContext(SalesDocContext);
  if (!context) throw new Error("useSalesDocConfig must be used within SalesDocumentLayout");
  return context;
};

interface SalesDocumentLayoutProps<T extends FieldValues> {
  schema: z.ZodType<T>;
  defaultValues: T;
  // Return value is optional and only used for one thing: when a fresh submission gets
  // auto-drafted by SAP for approval, the page's onSubmit should resolve with the SAP
  // response ({ DocEntry, IsDraft, ... }) so the approval-request Remarks the user just
  // typed in the modal can be patched onto the request SAP just auto-created (SAP creates
  // it natively - POST isn't supported - so it always starts with blank Remarks otherwise).
  onSubmit: (data: T) => Promise<void | { DocEntry?: number; IsDraft?: boolean | string; [key: string]: any }>;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  docType: DocumentType;
  skipAutoReset?: boolean; 
}

export function SalesDocumentLayout<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  actions,
  docType,
  skipAutoReset = false,
}: SalesDocumentLayoutProps<T>) {

  const config = React.useMemo(() => getDocumentConfig(docType), [docType]);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const docNav = useMemo(() => resolveDocNavParams(searchParams, pathname), [searchParams, pathname]);
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

    if (draftEntryParam) return "draft";       
    if (docEntryParam) return "approved";
    return null;
  });

  const fetchUdfDefinitions = useUDFStore(state => state.fetchDefinitions);

  React.useEffect(() => {
    fetchUdfDefinitions(docType);
  }, [docType, fetchUdfDefinitions]);

  const methods = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, watch, setValue, formState: { isSubmitting, isDirty, errors } } = methods;
  const { reset: lineReset, customer, DocEntry, loadFromDocument, isCopying, setIsCopying, udfs: storeUdfs, lines } = useSalesDocument();

  
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const errorFields = Object.keys(errors).join(", ");
      toast.error(`Please fix validation errors in: ${errorFields}`);
    }
  }, [errors]);

  useEffect(() => {
    setValue("DocumentLines" as any, (lines || []) as any, {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [lines, setValue]);

  const docStatus = watch("DocStatus" as any);
  const docEntry = watch("DocEntry" as any);

  const isEditMode = docEntry && Number(docEntry) > 0;
  const normalizedStatus = docStatus?.toString().replace("bost_", "");
  const shouldHideSubmit = isEditMode && normalizedStatus === "Close";
  const router = useRouter();
  
  const [selectedCopyTo, setSelectedCopyTo] = useState<string>("");
  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const [copyFromType, setCopyFromType] = useState<DocumentType | null>(null);
  const [copyFromData, setCopyFromData] = useState<any[]>([]);
  const [isLoadingCopyFrom, setIsLoadingCopyFrom] = useState(false);
  const [selectedCopyFrom, setSelectedCopyFrom] = useState<string>("");
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isLoadingCopyTo, setIsLoadingCopyTo] = useState(false);
  const { user } = useAuth();
  const [serialModalOpen, setSerialModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<T | null>(null);
  const [pendingFinalData, setPendingFinalData] = useState<T | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [approvalTemplates, setApprovalTemplates] = useState<ApprovalTemplate[]>([]);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  const [pendingReApproval, setPendingReApproval] = useState<{ draftId: number; docType: string | number } | null>(null);

  const copyFromOptions = (() => {
    if (docType === DocumentType.Order) return [DocumentType.Quotation];
    if (docType === DocumentType.Delivery) return [DocumentType.Order, DocumentType.Quotation];
    if (docType === DocumentType.ARInvoice) return [DocumentType.Delivery, DocumentType.Order, DocumentType.Quotation];
    if (docType === DocumentType.DownPaymentRequest || docType === DocumentType.DownPaymentInvoice) {
      return [DocumentType.Order, DocumentType.Quotation];
    }
    if (docType === DocumentType.CreditMemo) return [DocumentType.ARInvoice, DocumentType.Delivery];
    if (docType === DocumentType.SalesReturn) return [DocumentType.ReturnRequest, DocumentType.Delivery];
    return [];
  })();

  const fetchCopyFromData = async (type: DocumentType) => {
    if (!customer?.CardCode) return;
    setIsLoadingCopyFrom(true);
    try {
      let data: any[] | null = [];
      if (type === DocumentType.Quotation) {
        data = await getQuotationByBP(customer.CardCode);
      } else if (type === DocumentType.Order) {
        data = await getSalesOrderByBP(customer.CardCode);
      } else if (type === DocumentType.Delivery) {
        data = await getSalesDeliveryByBP(customer.CardCode);
      } else if (type === DocumentType.ARInvoice) {
        data = await getARInvoiceByBP(customer.CardCode);
      } else if (type === DocumentType.ReturnRequest) {
        data = await getSalesReturnRequestByBP(customer.CardCode);
      }
      setCopyFromData(data || []);
      setCopyFromOpen(true);
    } catch (err) {
      toast.error("Failed to fetch documents");
    } finally {
      setIsLoadingCopyFrom(false);
    }
  };

  const handleCopyFromSelect = async (docNum: any) => {
    setIsLoadingDocument(true);
    try {
      let doc: any = null;
      if (copyFromType === DocumentType.Quotation) {
        doc = await getQuotationDocument(docNum);
      } else if (copyFromType === DocumentType.Order) {
        doc = await getSalesOrderDocument(docNum);
      } else if (copyFromType === DocumentType.Delivery) {
        doc = await getSalesDeliveryDocument(docNum);
      } else if (copyFromType === DocumentType.ARInvoice) {
        doc = await getARInvoiceDocument(docNum);
      } else if (copyFromType === DocumentType.ReturnRequest) {
        doc = await getSalesReturnRequestDocument(docNum);
      }

      if (doc && copyFromType) {
        const openLines = openLinesForCopyFrom(doc.DocumentLines);
        if ((doc.DocumentLines || []).length > 0 && openLines.length === 0) {
          toast.warning("This document has no remaining open quantity to copy.");
          return;
        }
        const sourceLabel =
          copyFromType === DocumentType.Quotation ? 'Sales Quotation' :
          copyFromType === DocumentType.Order ? 'Sales Order' :
          copyFromType === DocumentType.Delivery ? 'Delivery' :
          copyFromType === DocumentType.ARInvoice ? 'A/R Invoice' :
          copyFromType === DocumentType.ReturnRequest ? 'Sales Return Request' : 'Document';
        loadFromDocument({ ...doc, DocumentLines: openLines }, copyFromType);
        const existingComments = ((doc.Comments !== undefined && doc.Comments !== null) ? doc.Comments : (doc.comments || "")).trim();
        const copyFromText = `Copy From Based on ${sourceLabel} ${docNum}`;
        const updatedComments = existingComments ? `${existingComments}\n${copyFromText}` : copyFromText;
        useSalesDocument.getState().setComments(updatedComments);
        setValue("Comments" as any, updatedComments as any, { shouldDirty: true });
        toast.success(`Copied from ${sourceLabel} #${docNum}`);
      }
    } catch (err) {
      toast.error("Failed to load document");
    } finally {
      setIsLoadingDocument(false);
    }
  };

  useEffect(() => {
    const state = useSalesDocument.getState();

    if (isCopying) {
      reset({
        ...defaultValues,
        CardCode: state.customer?.CardCode || "",
        CardName: state.customer?.CardName || "",
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
    } else if (!isDirty && !skipAutoReset) {
      ResetForm();
    }
  }, [defaultValues]);

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

  const finishAndReset = () => {
    ResetForm();
    clearDocNavParams(router, pathname);
  };

  const handleNewDocumentClick = () => {
    ResetForm();
    setBadgeState(null);
  };

  const getSubmitButtonText = () => {
    if (isCheckingApproval) return <Circle />;
    if (isSubmitting) return "Saving...";
    if (isLoadingDocument) return "Loading...";
    
    const normalizedStatus = docStatus?.toString().replace("bost_", "");
    
    if (isEditMode && normalizedStatus === "Open") return "Update";
    if (isEditMode) return "Update";
    
    return "Submit";
  };

  const copyToOptions = (() => {
    if (docType === DocumentType.Quotation)
      return [DocumentType.Order, DocumentType.Delivery, DocumentType.ARInvoice, DocumentType.DownPaymentRequest, DocumentType.DownPaymentInvoice];

    if (docType === DocumentType.Order)
      return [DocumentType.Delivery, DocumentType.ARInvoice, DocumentType.DownPaymentRequest, DocumentType.DownPaymentInvoice];

    if (docType === DocumentType.Delivery)
      return [DocumentType.ARInvoice, DocumentType.SalesReturn];

    if (docType === DocumentType.ARInvoice)
      return [DocumentType.CreditMemo];

    if (docType === DocumentType.DownPaymentRequest)
      return [DocumentType.DownPaymentInvoice];

    if (docType === DocumentType.DownPaymentInvoice)
      return [DocumentType.ARInvoice];

    if (docType === DocumentType.ReturnRequest)
      return [DocumentType.SalesReturn];

    // A returned item can be re-delivered to the customer (exchange) or credited back
    // to their account - both are valid next steps off a Sales Return.
    if (docType === DocumentType.SalesReturn)
      return [DocumentType.Delivery, DocumentType.CreditMemo];

    return [];
  })();

  const handleCopyClick = (selected?: string) => {
    const copyType = selected || selectedCopyTo;

    if (!DocEntry) {
      setSelectedCopyTo("");
      toast.error("Please save or select a document first!");
      return;
    }
    
    setIsLoadingCopyTo(true);

    const state = useSalesDocument.getState();
    const sourceDocNum = state.DocNum;
    const existingComments = (state.comments || "").trim();
    const copyToText = `Copy To Based on ${config.title} ${sourceDocNum}`;
    const updatedComments = existingComments ? `${existingComments}\n${copyToText}` : copyToText;

    const openLines = openLinesForCopyFrom(state.lines as any[]);
    if (state.lines.length > 0 && openLines.length === 0) {
      setIsLoadingCopyTo(false);
      toast.warning("This document has no remaining open quantity to copy.");
      return;
    }

    useSalesDocument.setState({ comments: updatedComments, lines: openLines as any });

    if (copyType === DocumentType.Order.toString()) {
      setIsCopying(true);
      router.push("/dashboard/sales/order");
    } else if (copyType === DocumentType.Delivery.toString()) {
      setIsCopying(true);
      router.push("/dashboard/sales/delivery");
    } else if (copyType === DocumentType.ARInvoice.toString()) {
      setIsCopying(true);
      router.push("/dashboard/sales/invoice");
    } else if (copyType === DocumentType.DownPaymentRequest.toString()) {
      setIsCopying(true);
      router.push("/dashboard/sales/dp_request");
    } else if (copyType === DocumentType.DownPaymentInvoice.toString()) {
      setIsCopying(true);
      router.push("/dashboard/sales/dp_invoice");
    } else if (copyType === DocumentType.CreditMemo.toString()) {
      setIsCopying(true);
      router.push("/dashboard/sales/ar_creditmemo");
    } else if (copyType === DocumentType.SalesReturn.toString()) {
      setIsCopying(true);
      router.push("/dashboard/sales/return");
    } else {
      toast.info("Copy to this document type is not implemented yet.");
    }
  };

  return (
    <SalesDocContext.Provider value={config}>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(async (data) => {

          const state = useSalesDocument.getState();
          const finalData = { ...data, DocumentLines: state.lines } as unknown as T;

          if (linesHaveInvalidPrice(state.lines)) {
            toast.error("One or more items have a price of 0 or less. Please set a valid price before submitting.");
            return;
          }

          if (isBranchMissing((data as any).BPL_IDAssignedToInvoice)) {
            toast.error("Please select a branch before submitting.");
            return;
          }

          if (isBranchInactive((data as any).BPL_IDAssignedToInvoice)) {
            toast.error("The selected branch is inactive. Please choose an active branch before submitting.");
            return;
          }

          const isSerialBatchDocument = [
            DocumentType.Delivery,
            DocumentType.ARInvoice,
            DocumentType.SalesReturn,
            DocumentType.Return,
            DocumentType.CreditMemo,
            DocumentType.ARCreditMemo,
          ].includes(docType);

          if (isSerialBatchDocument && linesNeedSerialAllocation(state.lines)) {
            setPendingData(finalData);
            setSerialModalOpen(true);
            return;
          }

          if (isSerialBatchDocument && linesNeedBatchAllocation(state.lines)) {
            setPendingData(finalData);
            setBatchModalOpen(true);
            return;
          }

          if (isRejectedApproval && docNav.draftEntry) {
            try {
              const patchPayload = buildSalesDocumentPatchPayload({
                data: finalData as any,
                lines: state.lines,
                discountPercent: state.discountPercent,
                freight: state.freight,
                additionalExpenses: state.additionalExpenses,
              });
              await patchDraftDocument(Number(docNav.draftEntry), patchPayload);
            } catch (err: any) {
              toast.error(err?.response?.data?.Message || "Failed to update approval draft");
              return;
            }

            const currentUserIdRe = user?.sapUserId;
            if (currentUserIdRe) {
              try {
                const docTypeStr = getApprovalDocumentType(docType);
                const activeTemplates = await getCurrentUserApprovalTemplates(currentUserIdRe, docTypeStr);
                if (activeTemplates && activeTemplates.length > 0) {
                  setApprovalTemplates(activeTemplates);
                  setPendingReApproval({ draftId: Number(docNav.draftEntry), docType: String(docType) });
                  setApprovalModalOpen(true);
                  return;
                }
              } catch {
                /* fall through to normal submit */
              }
            }
            toast.success("Draft updated. The approval request will be re-submitted.");
            finishAndReset();
            setBadgeState(null);
            return;
          }

          if (isPendingApproval && docNav.draftEntry) {
            toast.info("This document is currently awaiting approval. You cannot modify it until it has been approved or rejected.");
            return;
          }

          if (isApprovedDraft && docNav.draftEntry) {
            const approvedChanged = hasDraftChanges(state.loadedDraftData, state.lines, finalData);
            const confirmedUnchanged = approvedChanged
              ? false
              : !(await validateDraftChanged(Number(docNav.draftEntry), state.lines, finalData));
            if (confirmedUnchanged) {
              try {
                await onSubmit(finalData);
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
                  setPendingFinalData(finalData);
                  setApprovalModalOpen(true);
                  return;
                }
              } catch {
                /* no approval template */
              }
            }

            try {
              await onSubmit(finalData);
              finishAndReset();
              setBadgeState(null);
            } catch (err: any) {
              toast.error(err?.response?.data?.Message || "Failed to create the document");
            }
            return;
          }

          const currentUserId = user?.sapUserId;
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

          try {
            await onSubmit(finalData);
            finishAndReset();
          } catch (error) {
            console.error("Submit Error:", error);
          }
        })}
          className="flex flex-col min-h-screen bg-background"
        >

          <HeaderActionPortal>
            <HeaderActions
              DocEntry={DocEntry}
              objectCode={docType}
              reset={reset}
              defaultValues={defaultValues}
              resetStore={handleNewDocumentClick}
            />
          </HeaderActionPortal>

          <div className="flex justify-between items-center px-6 py-3 border-b bg-muted shrink-0">
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

          <div className="flex flex-col min-h-0 overflow-hidden px-6 py-4 flex-1">
             {children}
          </div>

          {!shouldHideSubmit && (
            <div className="border-t px-6 py-4 flex justify-end bg-white shadow-md gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <Select
                  value={selectedCopyFrom}
                  disabled={!customer?.CardCode || copyFromOptions.length === 0 || isLoadingDocument || isLoadingCopyFrom}
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
                          {type === DocumentType.Quotation ? "Sales Quotation" :
                            type === DocumentType.Order ? "Sales Order" :
                              type === DocumentType.Delivery ? "Delivery" :
                                type === DocumentType.ARInvoice ? "A/R Invoice" :
                                  type === DocumentType.ReturnRequest ? "Sales Return Request" : ""}
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
                      {copyToOptions.includes(DocumentType.Order) && (
                        <SelectItem value={DocumentType.Order.toString()}>
                          Sales Order
                        </SelectItem>
                      )}
                      {copyToOptions.includes(DocumentType.Delivery) && (
                        <SelectItem value={DocumentType.Delivery.toString()}>
                          Delivery
                        </SelectItem>
                      )}
                      {copyToOptions.includes(DocumentType.ARInvoice) && (
                        <SelectItem value={DocumentType.ARInvoice.toString()}>
                          AR Invoice
                        </SelectItem>
                      )}
                      {copyToOptions.includes(DocumentType.DownPaymentRequest) && (
                        <SelectItem value={DocumentType.DownPaymentRequest.toString()}>
                          A/R Down Payment Request
                        </SelectItem>
                      )}
                      {copyToOptions.includes(DocumentType.DownPaymentInvoice) && (
                        <SelectItem value={DocumentType.DownPaymentInvoice.toString()}>
                          A/R Down Payment Invoice
                        </SelectItem>
                      )}
                      {copyToOptions.includes(DocumentType.CreditMemo) && (
                        <SelectItem value={DocumentType.CreditMemo.toString()}>
                          A/R Credit Memo
                        </SelectItem>
                      )}
                      {copyToOptions.includes(DocumentType.SalesReturn) && (
                        <SelectItem value={DocumentType.SalesReturn.toString()}>
                          Sales Return
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
            title={`Select ${copyFromType === DocumentType.Quotation ? 'Quotation' : copyFromType === DocumentType.Order ? 'Order' : 'Delivery'}`}
            open={copyFromOpen}
            onClose={() => setCopyFromOpen(false)}
            onSelect={handleCopyFromSelect}
            data={copyFromData}
            columns={[
              { key: "DocNum", label: "Doc Num" },
              { key: "CardName", label: "Customer Name" },
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
              const state = useSalesDocument.getState();

              if (selections.serials) {
                Object.entries(selections.serials).forEach(([itemCode, serials]) => {
                  state.setLineSerials(itemCode, serials);
                });
              }

              const updatedLines = useSalesDocument.getState().lines;
              setSerialModalOpen(false);

              if (linesNeedBatchAllocation(updatedLines)) {
                setBatchModalOpen(true);
                return;
              }

              setPendingData(null);
            }}
            lines={useSalesDocument.getState().lines}
          />

          <BatchNumberSelectionDialog
            open={batchModalOpen}
            onClose={() => {
              setBatchModalOpen(false);
              setPendingData(null);
            }}
            onConfirm={async (selections) => {
              const state = useSalesDocument.getState();

              if (selections.batches) {
                Object.entries(selections.batches).forEach(([itemCode, batches]) => {
                  state.setLineBatches(itemCode, batches);
                });
              }

              setBatchModalOpen(false);
              setPendingData(null);
            }}
            lines={useSalesDocument.getState().lines}
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

              const finalData = {
                ...(pendingFinalData as any),
                Comments: (pendingFinalData as any).Comments || "",
              } as T;

              const result = await onSubmit(finalData);
              setPendingFinalData(null);

              if (result && (result as any).IsDraft && (result as any).DocEntry) {
                const tpl = approvalTemplates[0];
                const remarks = tpl ? (remarksMap[tpl.Code] ?? "").trim() : "";
                if (remarks) {
                  try {
                    await submitApprovalRequest(0, {
                      TemplateCode: tpl?.Code,
                      ObjectEntry: Number((result as any).DocEntry),
                      // Same as pendingReApproval above: ObjectEntry is the DRAFT's own
                      // entry, so ObjectType must be "112" ("Documents - Drafts"), not
                      // the document's specific type.
                      ObjectType: DRAFT_OBJECT_TYPES[0],
                      IsDraft: "Y",
                      OriginatorID: user?.sapUserId,
                      Remarks: remarks,
                    });
                  } catch (err: any) {
                    toast.warning(
                      err?.response?.data?.Message ||
                        "Document was created, but the approval remarks could not be attached."
                    );
                  }
                }
              }

              finishAndReset();
              setBadgeState(null);
            }}
          />
        </form>
      </FormProvider>
    </SalesDocContext.Provider>
  );
}
