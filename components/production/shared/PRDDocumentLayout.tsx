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
import { FilePlus2 } from "lucide-react";
import { HeaderActionPortal } from "@/components/header-portal";

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
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, watch, formState: { isSubmitting } } = methods;
  const { reset: lineReset } = useIFPRDDocument();

  useEffect(() => {
    reset(defaultValues as DefaultValues<T>);
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
      ItemNo: "",
      ProductDescription: "",
      AbsoluteEntry: 0,
      TaxDate: today,
      CreationDate: today,
      StartDate: today,
      DueDate: today,
    } as any);
    lineReset();
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) return "Saving...";
    return "Submit";
  };

  return (
    <PRDDocContext.Provider value={config}>
      <FormProvider {...methods}>

        <form onSubmit={handleSubmit((data) => onSubmit(data as any))} className="flex flex-col min-h-screen bg-background">


          <HeaderActionPortal>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={ResetForm}
              disabled={(!watch("AbsoluteEntry" as any) || watch("AbsoluteEntry" as any) === 0) && (!watch("DocEntry" as any) || watch("DocEntry" as any) === 0)}
              title="New Document"
              className="border-blue-600/50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-8 w-8 disabled:opacity-50"
            >
              <FilePlus2 className="w-4 h-4" />
            </Button>
          </HeaderActionPortal>

          <div className="flex justify-between items-center px-6 py-3 border-b bg-muted">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{config.title}</h1>
            </div>

            {actions && <div>{actions}</div>}
          </div>

          <div className="flex-1 flex flex-col gap-4 p-6 overflow-auto w-full">
            {children}
          </div>

          <div className="border-t px-6 py-4 flex justify-end gap-4 bg-white shadow-md">
            {(!watch("AbsoluteEntry" as any) || watch("AbsoluteEntry" as any) === 0) && (
              <Button type="submit" disabled={isSubmitting}>
                {getSubmitButtonText()}
              </Button>
            )}
          </div>
        </form>

      </FormProvider>
    </PRDDocContext.Provider>
  );
}
