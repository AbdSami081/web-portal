"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/sales/documentConfig";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GenericModal } from "@/modals/GenericModal";
import { getQuotationByBP, getSalesOrderByBP, getSalesDeliveryByBP, getQuotationDocument, getSalesOrderDocument, getSalesDeliveryDocument } from "@/api+/sap/quotation/salesService";
import { FilePlus2 } from "lucide-react";


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

  const config = getDocumentConfig(docType);

  const methods = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, watch, formState: { isSubmitting } } = methods;
  const { reset: lineReset, customer } = useSalesDocument();

  const docStatus = watch("DocStatus" as any);
  const docEntry = watch("DocEntry" as any);

  const isEditMode = docEntry && Number(docEntry) > 0;
  const shouldHideSubmit = isEditMode && docStatus === "bost_Close";
  const router = useRouter();
  const { DocEntry, loadFromDocument } = useSalesDocument();
  const [selectedCopyTo, setSelectedCopyTo] = useState<string>("");

  const { isCopying, setIsCopying } = useSalesDocument();

  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const [copyFromType, setCopyFromType] = useState<DocumentType | null>(null);
  const [copyFromData, setCopyFromData] = useState<any[]>([]);
  const [isLoadingCopyFrom, setIsLoadingCopyFrom] = useState(false);
  const [selectedCopyFrom, setSelectedCopyFrom] = useState<string>("");
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

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
    // Only run this logic on initial mount or when defaultValues changes meaningfully
    const state = useSalesDocument.getState();

    // If we are currently copying (redirected from another page)
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
      } as unknown as DefaultValues<T>);

      // We set isCopying to false, but we DON'T reset the store
      setIsCopying(false);
    } else {
      // If we are NOT copying and NOT in Edit mode (DocEntry is 0/empty), then we reset
      // This allows manual entry to start fresh but preserves "Copy" workflow data
      const currentDocEntry = watch("DocEntry" as any);
      if (!currentDocEntry || currentDocEntry === "0") {
        // If the store ALREADY has lines/DocEntry but we aren't "copying", 
        // we only reset if it's a fresh manual visit.
        // This is a bit tricky, but basically we want to avoid ResetForm() 
        // if we just loaded copy data.
        if (state.DocEntry === 0) {
          ResetForm();
        }
      }
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
    if (docEntry === "0" || !isEditMode) return "Submit";
    if (isEditMode && docStatus === "bost_Open") return "Update";
    return "";
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
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit((data) => onSubmit(data as unknown as T))();
          }}
          className="flex flex-col min-h-screen bg-background"
        >
          <div className="flex px-6 py-2 border-b bg-white">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={ResetForm}
              disabled={!DocEntry || DocEntry === 0}
              title="New Document"
              className="border-blue-600/50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-8 w-8 disabled:opacity-50"
            >
              <FilePlus2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex justify-between items-center px-6 py-3 border-b bg-muted">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{config.title}</h1>
            </div>
            {actions && <div>{actions}</div>}
          </div>

          <div className="flex-1 flex flex-col gap-4 p-6 overflow-auto w-full">
            {children}
          </div>

          {!shouldHideSubmit && (
            <div className="border-t px-6 py-4 flex justify-end bg-white shadow-md">

              <div className="flex items-center gap-3">
                <Select
                  value={selectedCopyFrom}
                  disabled={!customer?.CardCode || copyFromOptions.length === 0 || isLoadingDocument}
                  onValueChange={(value) => {
                    const type = parseInt(value) as DocumentType;
                    setCopyFromType(type);
                    fetchCopyFromData(type);
                    setTimeout(() => setSelectedCopyFrom(""), 0);
                  }}
                >
                  <SelectTrigger className="w-[180px] h-9 bg-black text-white hover:bg-zinc-800 focus:ring-0">
                    <SelectValue placeholder="Copy From" />
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
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={selectedCopyTo}
                  disabled={copyToOptions.length === 0 || isLoadingDocument}
                  onValueChange={(value) => {
                    setSelectedCopyTo(value);
                    handleCopyClick(value);
                  }}
                >
                  <SelectTrigger className="w-[180px] h-9 bg-black text-white hover:bg-zinc-800 focus:ring-0">
                    <SelectValue placeholder="Copy To" />
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
                <Button type="submit" disabled={isSubmitting || isLoadingDocument}>
                  {isLoadingDocument ? "Loading..." : getSubmitButtonText()}
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
              { key: "RefDate", label: "Date" },
              { key: "DueDate", label: "Due Date" },
              { key: "CardName", label: "Customer Name" },
            ]}
            getSelectValue={(item) => item.DocNum}
            isLoading={isLoadingCopyFrom}
          />
        </form>
      </FormProvider>
    </SalesDocContext.Provider>
  );

}
