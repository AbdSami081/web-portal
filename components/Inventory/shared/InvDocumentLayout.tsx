"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/inventory/documentConfig";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
}

export function InvDocumentLayout<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  actions,
  docType,
}: InvDocumentLayoutProps<T>) {

  const config = getDocumentConfig(docType);
  const router = useRouter();

  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, watch, formState: { isSubmitting, isDirty } } = methods;
  const { reset: lineReset, DocEntry, isCopying, setIsCopying } = useInventoryDocument();

  const [selectedCopyTo] = useState<string>("");

  useEffect(() => {
    const state = useInventoryDocument.getState();
    if (isCopying) {
      reset({
        ...defaultValues,
        CardCode: state.customer?.CardCode || "",
        CardName: state.customer?.CardName || "",
        TaxDate: new Date().toISOString().split("T")[0],
      } as unknown as DefaultValues<T>);
      setIsCopying(false);
    } else if (!isDirty) {
      if (state.DocEntry === 0) {
        ResetForm();
      }
    }
  }, [defaultValues]);

  const ResetForm = () => {
    reset(defaultValues as DefaultValues<T>);
    lineReset();
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) return "Saving...";
    return "Submit";
  };

  const copyToOptions = (() => {
    if (docType === DocumentType.InvTransferReq)
      return [DocumentType.InvTransfer];
    return [];
  })();

  const handleCopyClick = (selected: string) => {
    if (!DocEntry || DocEntry === 0) {
      toast.error("Please search or select a document first!");
      return;
    }

    if (selected === DocumentType.InvTransfer.toString()) {
      setIsCopying(true);
      router.push("/dashboard/inventory/transfer");
    } else {
      toast.info("Copy to this document type is not implemented yet.");
    }
  };

  return (
    <InvDocContext.Provider value={config}>
      <FormProvider {...methods}>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-screen bg-background">

          <div className="flex justify-between items-center px-6 py-3 border-b bg-muted">
            <h1 className="text-xl font-semibold">{config.title}</h1>

            {actions && <div>{actions}</div>}
          </div>

          <div className="flex-1 flex flex-col gap-4 p-6 overflow-auto w-full">
            {children}
          </div>

          <div className="border-t px-6 py-4 flex justify-end gap-4 bg-white shadow-md">

            {copyToOptions.length > 0 && (
              <Select
                value={selectedCopyTo}
                disabled={!DocEntry || DocEntry === 0}
                onValueChange={(value) => {
                  handleCopyClick(value);
                }}
              >
                <SelectTrigger className="w-[180px] h-9 bg-black text-white hover:bg-zinc-800 focus:ring-0">
                  <SelectValue placeholder="Copy To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {copyToOptions.includes(DocumentType.InvTransfer) && (
                      <SelectItem value={DocumentType.InvTransfer.toString()}>
                        Inventory Transfer
                      </SelectItem>
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            {(!DocEntry || DocEntry === 0) && (
              <Button type="submit" disabled={isSubmitting}>
                {getSubmitButtonText()}
              </Button>
            )}
          </div>
        </form>

      </FormProvider>
    </InvDocContext.Provider>
  );
}
