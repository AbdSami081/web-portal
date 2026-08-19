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

import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

  const methods = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, watch, formState: { isSubmitting, isDirty, errors } } = methods;
  const { reset: lineReset, lines, requester, DocEntry, loadFromDocument, isCopying, setIsCopying, udfs: storeUdfs } = usePurchaseDocument();

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

  useEffect(() => {
    const state = usePurchaseDocument.getState();

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
            console.log("Submit Clicked. Data:", data);
            const state = usePurchaseDocument.getState();
            const needsStockManagement = (docType === DocumentType.GoodsReceiptPO || docType === DocumentType.APInvoice) && 
              state.lines.some(l => {
                const isSerial = l.ManSerNum === 'Y' || l.ManSerNum === 'tYES';
                const isBatch = l.ManBtchNum === 'Y' || l.ManBtchNum === 'tYES';
                
                if (isSerial) {
                  return !l.SerialNumbers || l.SerialNumbers.length < l.Quantity;
                }
                if (isBatch) {
                  const totalBatch = (l.BatchNumbers || []).reduce((sum, b) => sum + b.Quantity, 0);
                  return totalBatch < l.Quantity;
                }
                return false;
              });

            if (needsStockManagement) {
              setPendingData(data as unknown as T);
              setSerialModalOpen(true);
              return;
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
            onClose={() => setSerialModalOpen(false)}
            onConfirm={async (selections) => {
              if (pendingData) {
                const state = usePurchaseDocument.getState();
                
                if (selections.serials) {
                  Object.entries(selections.serials).forEach(([itemCode, serials]) => {
                    state.setLineSerials(itemCode, serials);
                  });
                }
                setPendingData(null);
              }
            }}
            lines={usePurchaseDocument.getState().lines}
          />

          <BatchNumberSelectionDialog
            open={batchModalOpen}
            onClose={() => setBatchModalOpen(false)}
            onConfirm={async (selections) => {
              if (pendingData) {
                const state = usePurchaseDocument.getState();
                
                if (selections.batches) {
                  Object.entries(selections.batches).forEach(([itemCode, batches]) => {
                    state.setLineBatches(itemCode, batches);
                  });
                }
                
                setPendingData(null);
              }
            }}
            lines={usePurchaseDocument.getState().lines}
          />
        </form>
      </FormProvider>
    </PurchaseDocContext.Provider>
  );
}
