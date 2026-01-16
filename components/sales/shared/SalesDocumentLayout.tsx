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
    resolver: zodResolver(schema),
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

  useEffect(() => {
    if (isCopying) {
      const state = useSalesDocument.getState();
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
      setIsCopying(false);
    } else {
      ResetForm();
    }
  }, [defaultValues]);

  const ResetForm = () => {
    reset(defaultValues as DefaultValues<T>);
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
      toast.error("Please select a quotation first!");
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
          <div className="flex justify-between items-center px-6 py-3 border-b bg-muted">
            <h1 className="text-xl font-semibold">{config.title}</h1>
            {actions && <div>{actions}</div>}
          </div>

          <div className="flex-1 flex flex-col gap-4 p-6 overflow-auto w-full">
            {children}
          </div>

          {!shouldHideSubmit && (
            <div className="border-t px-6 py-4 flex justify-end bg-white shadow-md">

              <div className="flex items-center gap-3 mt-6">
                <Label className="text-sm">Copy To :</Label>

                <Select
                  value={selectedCopyTo}
                  onValueChange={(value) => {
                    setSelectedCopyTo(value);
                    handleCopyClick(value);
                  }}
                  className="w-[180px] h-9 border border-black focus:ring-0"
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select" />
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
                <Button type="submit" disabled={isSubmitting}>
                  {getSubmitButtonText()}
                </Button>
              </div>

            </div>
          )}
        </form>
      </FormProvider>
    </SalesDocContext.Provider>
  );

}
