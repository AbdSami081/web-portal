"use client"
import React, { createContext, useContext, useEffect } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/production/documentConfig";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";

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
}

export function PRDDocumentLayout<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  actions,
  docType,
}: PRDDocumentLayoutProps<T>) {

  const config = getDocumentConfig(docType);

  const methods = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, watch, formState: { isSubmitting } } = methods;
  const { reset: lineReset } = useIFPRDDocument();

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
    <PRDDocContext.Provider value={config}>
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
    </PRDDocContext.Provider>
  );
}
