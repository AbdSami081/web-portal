"use client"
import React, { createContext, useContext, useEffect } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/sales/documentConfig";

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

  useEffect(() => {
    ResetForm();
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

  return (
    <SalesDocContext.Provider value={config}>
      <FormProvider {...methods}>
       
        <form  onSubmit={(e) => {
            e.preventDefault(); 
            handleSubmit((data) => onSubmit(data as unknown as T))(); 
          }}    
          className="flex flex-col min-h-screen bg-background">

          <div className="flex justify-between items-center px-6 py-3 border-b bg-muted">
            <h1 className="text-xl font-semibold">{config.title}</h1>
            
            {actions && <div>{actions}</div>}
          </div>

          <div className="flex-1 flex flex-col gap-4 p-6 overflow-auto w-full">
            {children}
          </div>
        {!shouldHideSubmit && (
          <div className="border-t px-6 py-4 flex justify-end gap-4 bg-white shadow-md">
            <Button type="submit" disabled={isSubmitting}>
              {getSubmitButtonText()}
            </Button>
          </div>
        )}
        </form>
      
      </FormProvider>
    </SalesDocContext.Provider>
  );
}
