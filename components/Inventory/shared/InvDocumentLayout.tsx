"use client"
import React, { createContext, useContext, useEffect } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/inventory/documentConfig";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";

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

  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, watch, formState: { isSubmitting } } = methods;
  const { reset: lineReset } = useInventoryDocument();

  useEffect(() => {
    reset(defaultValues as DefaultValues<T>);
  }, [defaultValues]);

  const ResetForm = () => {
    reset(defaultValues as DefaultValues<T>);
    lineReset();
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) return "Saving...";
    return "Submit";
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
            <Button type="submit" disabled={isSubmitting}>
              {getSubmitButtonText()}
            </Button>
          </div>
        </form>
      
      </FormProvider>
    </InvDocContext.Provider>
  );
}
