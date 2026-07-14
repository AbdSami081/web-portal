"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/sales/documentConfig";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GenericModal } from "@/modals/GenericModal";
import { getQuotationByBP, getSalesOrderByBP, getSalesDeliveryByBP, getQuotationDocument, getSalesOrderDocument, getSalesDeliveryDocument } from "@/api+/sap/sales/salesService";
import { FilePlus2, Loader2, Keyboard } from "lucide-react";
import { HeaderActionPortal } from "@/components/header-portal";
import { HeaderModalAction } from "@/components/header-modal-action";
import { KeyboardShortcutsContent } from "@/components/keyboard-shortcuts-content";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DocumentType } from "@/types/master/DocumentType";
import { useUDFStore } from "@/stores/useUDFStore";
import { DocumentHeader } from "./DocumentHeader";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { SerialNumberSelectionDialog } from "@/modals/SerialNumberSelectionDialog";
import { BatchNumberSelectionDialog } from "@/modals/BatchNumberSelectionDialog";
import HeaderActions from "@/components/Custom/HeaderAction";


const SalesDocContext = createContext<DocumentConfig | null>(null);

export const useSalesDocConfig = () => {
  const context = useContext(SalesDocContext);
  if (!context) throw new Error("useSalesDocConfig must be used within SalesDocumentLayout");
  return context;
};

interface SalesDocumentLayoutProps<T extends FieldValues> {
  schema: z.ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<void>;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  docType: DocumentType;
}

export function SalesDocumentLayout<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  actions,
  docType,
}: SalesDocumentLayoutProps<T>) {

  const config = React.useMemo(() => getDocumentConfig(docType), [docType]);
  const searchParams = useSearchParams();

  const isDraftFromUrl = Boolean(searchParams.get("docEntry")) && searchParams.get("draft") === "1";

  const fetchUdfDefinitions = useUDFStore(state => state.fetchDefinitions);

  React.useEffect(() => {
    fetchUdfDefinitions(docType);
  }, [docType, fetchUdfDefinitions]);

  const methods = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, watch, formState: { isSubmitting, isDirty, errors } } = methods;
  const { reset: lineReset, customer, DocEntry, loadFromDocument, isCopying, setIsCopying, udfs: storeUdfs } = useSalesDocument();

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const errorFields = Object.keys(errors).join(", ");
      toast.error(`Please fix validation errors in: ${errorFields}`);
    }
  }, [errors]);

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
  const [serialModalOpen, setSerialModalOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<T | null>(null);

  const copyFromOptions = (() => {
    if (docType === DocumentType.Order) return [DocumentType.Quotation];
    if (docType === DocumentType.Delivery) return [DocumentType.Order, DocumentType.Quotation];
    if (docType === DocumentType.ARInvoice) return [DocumentType.Delivery, DocumentType.Order, DocumentType.Quotation];
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
      }

      if (doc && copyFromType) {
        loadFromDocument(doc, copyFromType);
        toast.success(`Copied from ${copyFromType === DocumentType.Quotation ? 'Quotation' : copyFromType === DocumentType.Order ? 'Order' : 'Delivery'} #${docNum}`);
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

  const getSubmitButtonText = () => {
    if (isSubmitting) return "Saving...";
    if (isLoadingDocument) return "Loading...";
    
    const normalizedStatus = docStatus?.toString().replace("bost_", "");
    
    if (!isEditMode || docEntry === "0") return "Submit";
    if (normalizedStatus === "Open") return "Update";
    
    return "Submit"; // Fallback
  };

  const copyToOptions = (() => {
    if (docType === DocumentType.Quotation)
      return [DocumentType.Order, DocumentType.Delivery, DocumentType.ARInvoice];

    if (docType === DocumentType.Order)
      return [DocumentType.Delivery, DocumentType.ARInvoice];

    if (docType === DocumentType.Delivery)
      return [DocumentType.ARInvoice];

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

    if (copyType === DocumentType.Order.toString()) {
      setIsCopying(true);
      router.push("/dashboard/sales/order");
    } else if (copyType === DocumentType.Delivery.toString()) {
      setIsCopying(true);
      router.push("/dashboard/sales/delivery");
    } else if (copyType === DocumentType.ARInvoice.toString()) {
      setIsCopying(true);
      router.push("/dashboard/sales/invoice");
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
            const needsSerialManagement = (docType === DocumentType.Delivery || docType === DocumentType.ARInvoice) && 
                                state.lines.some(l => {
                                  const isSerial = l.ManSerNum === 'Y' || l.ManSerNum === 'tYES';
                                  if (isSerial) {
                                    return !l.SerialNumbers || l.SerialNumbers.length < l.Quantity;
                                  }
                                  return false;
                                });

            const needsBatchManagement = (docType === DocumentType.Delivery || docType === DocumentType.ARInvoice) && 
                                state.lines.some(l => {
                                  const isBatch = String(l.ManBtchNum).toLowerCase() === 'y' || String(l.ManBtchNum).toLowerCase() === 'tyes';
                                  if (isBatch) {
                                    const totalBatch = (l.BatchNumbers || []).reduce((sum, b) => sum + b.Quantity, 0);
                                    return totalBatch < l.Quantity;
                                  }
                                  return false;
                                });
            if (needsSerialManagement) {
              setPendingData(data as unknown as T);
              setSerialModalOpen(true);
              return;
            }

            if (needsBatchManagement) {
              setPendingData(data as unknown as T);
              setBatchModalOpen(true);
              return;
            }

            try {
              console.log("Proceeding with onSubmit...");
              await onSubmit(data as unknown as T);
              console.log("onSubmit finished. Resetting form...");
              ResetForm();
            } catch (error) {
              console.error("Submit Error:", error);
              // Error handled in onSubmit
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
              resetStore={ResetForm}
            />
          </HeaderActionPortal>

          <div className="flex justify-between items-center px-6 py-3 border-b bg-muted shrink-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold flex items-center gap-2">
                {config.title}
                {isDraftFromUrl && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5">
                    Draft
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
                              type === DocumentType.Delivery ? "Delivery" : ""}
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
            onClose={() => setSerialModalOpen(false)}
            onConfirm={async (selections) => {
              if (pendingData) {
                const state = useSalesDocument.getState();
                
                if (selections.serials) {
                  Object.entries(selections.serials).forEach(([itemCode, serials]) => {
                    state.setLineSerials(itemCode, serials);
                  });
                }

                const needsBatchManagement = state.lines.some(l => {
                  const isBatch = l.ManBtchNum === 'Y' || l.ManBtchNum === 'tYES';
                  if (isBatch) {
                    const totalBatch = (l.BatchNumbers || []).reduce((sum, b) => sum + b.Quantity, 0);
                    return totalBatch < l.Quantity;
                  }
                  return false;
                });

                if (needsBatchManagement) {
                  setBatchModalOpen(true);
                } else {
                  setPendingData(null);
                }
              }
            }}
            lines={useSalesDocument.getState().lines}
          />

          <BatchNumberSelectionDialog
            open={batchModalOpen}
            onClose={() => setBatchModalOpen(false)}
            onConfirm={async (selections) => {
              if (pendingData) {
                const state = useSalesDocument.getState();
                
                if (selections.batches) {
                  Object.entries(selections.batches).forEach(([itemCode, batches]) => {
                    state.setLineBatches(itemCode, batches);
                  });
                }
                
                setPendingData(null);
              }
            }}
            lines={useSalesDocument.getState().lines}
          />
        </form>
      </FormProvider>
    </SalesDocContext.Provider>
  );
}
