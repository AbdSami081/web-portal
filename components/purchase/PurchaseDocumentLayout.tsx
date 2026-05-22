"use client"
import React, { useEffect } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { PurchaseDocumentType } from "@/types/purchase/purchaseDocuments.type";
import { FilePlus2, Loader2, Keyboard } from "lucide-react";
import { HeaderActionPortal } from "@/components/header-portal";
import { HeaderModalAction } from "@/components/header-modal-action";
import { KeyboardShortcutsContent } from "@/components/keyboard-shortcuts-content";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PurchaseDocumentLayoutProps<T extends FieldValues> {
  schema: z.ZodType<T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<void>;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  docType: PurchaseDocumentType;
}

export function PurchaseDocumentLayout<T extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  children,
  actions,
  docType,
}: PurchaseDocumentLayoutProps<T>) {

  const methods = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, watch, formState: { isSubmitting, isDirty } } = methods;
  const { reset: storeReset } = usePurchaseDocument();

  const docStatus = watch("DocStatus" as any);
  const docEntry = watch("DocEntry" as any);

  const isEditMode = docEntry && Number(docEntry) > 0;
  const shouldHideSubmit = isEditMode && docStatus === "bost_Close";

  useEffect(() => {
    if (!isDirty) {
      ResetForm();
    }
  }, [defaultValues]);

  const ResetForm = () => {
    const today = new Date().toISOString().split("T")[0];
    reset({
      ...defaultValues,
      DocNum: 0,
      DocEntry: 0,
      DocDate: today,
      DocDueDate: today,
      TaxDate: today,
      RequiredDate: today,
    } as any);
    storeReset();
  };

  const getSubmitButtonText = () => {
    if (isSubmitting) return "Saving...";
    if (docEntry === "0" || !isEditMode) return "Submit";
    if (isEditMode && docStatus === "bost_Open") return "Update";
    return "";
  };

  const docTitleMap: Record<number, string> = {
    [PurchaseDocumentType.PurchaseRequest]: "Purchase Request",
    [PurchaseDocumentType.PurchaseQuotation]: "Purchase Quotation",
    [PurchaseDocumentType.PurchaseOrder]: "Purchase Order",
    [PurchaseDocumentType.GoodsReceiptPO]: "Goods Receipt PO",
    [PurchaseDocumentType.APInvoice]: "A/P Invoice",
  };
  const docTitle = docTitleMap[docType] ?? "Purchase Document";


  return (
    <FormProvider {...methods}>
      <form
        onSubmit={handleSubmit(async (data) => {
          try {
            await onSubmit(data as unknown as T);
            ResetForm();
          } catch (error) {
          }
        })}
        className="flex flex-col min-h-screen bg-background"
      >
        <HeaderActionPortal>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-block">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={ResetForm}
                    className="border-blue-600/50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-8 w-8 transition-all active:scale-95"
                  >
                    <FilePlus2 className="w-4 h-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="bg-blue-600 text-white border-blue-500 font-semibold shadow-[0_0_20px_rgba(37,99,235,0.6)] animate-in fade-in-0 zoom-in-95 duration-300"
              >
                New Document
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <HeaderModalAction
            triggerIcon={Keyboard}
            triggerTooltip="Shortcut Keys"
            modalTitle="Keyboard Shortcuts"
            modalDescription="Quick reference for available keyboard shortcuts in the portal."
          >
            <KeyboardShortcutsContent />
          </HeaderModalAction>
        </HeaderActionPortal>

        {/* Title bar — same as Sales */}
        <div className="flex justify-between items-center px-6 py-3 border-b bg-muted">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{docTitle}</h1>
          </div>
          {actions && <div>{actions}</div>}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-4 p-6 overflow-y-auto overflow-x-auto w-full">
          {children}
        </div>

        {/* Bottom Submit — same as Sales */}
        {!shouldHideSubmit && (
          <div className="border-t px-6 py-4 flex justify-end bg-white shadow-md">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {getSubmitButtonText()}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
