"use client"
import React, { createContext, useContext, useEffect, useRef } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/production/documentConfig";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { FilePlus2, Keyboard, Loader2 } from "lucide-react";
import { HeaderActionPortal } from "@/components/header-portal";
import { HeaderModalAction } from "@/components/header-modal-action";
import { KeyboardShortcutsContent } from "@/components/keyboard-shortcuts-content";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { DocumentType } from "@/types/master/DocumentType";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";

import { useUDFStore } from "@/stores/useUDFStore";
import { UDFLayout } from "@/components/shared/UDFSheet";
import { getFieldSettings } from "@/lib/config/Client/clientSettings";

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
  const router = useRouter();
  const fetchUdfDefinitions = useUDFStore(state => state.fetchDefinitions);
  const [isCopyingToInventory, setIsCopyingToInventory] = React.useState(false);

  useEffect(() => {
    fetchUdfDefinitions(docType);
  }, [docType, fetchUdfDefinitions]);

  const methods = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { watch, reset, handleSubmit, formState: { isSubmitting, isDirty } } = methods;
  const { lines, attachments, reset: lineReset, initialStatus, udfs, setDocType } = useIFPRDDocument();
  const previousDocType = useRef<DocumentType | null>(null);

  // Reset store and form when docType changes (navigation between pages)
  useEffect(() => {
    const storeDocType =
      useIFPRDDocument.getState().docType;

    const isDocTypeChange =
      storeDocType !== docType ||
      previousDocType.current !== null &&
      previousDocType.current !== docType;

    if (isDocTypeChange) {
      lineReset(docType);
      reset(defaultValues as any);
    } else {
      setDocType(docType);
    }

    previousDocType.current = docType;
  }, [docType, setDocType, lineReset, reset, defaultValues]);

  useEffect(() => {
    const currentValues = methods.getValues();
    const isDocumentLoaded =
      (currentValues as any).AbsoluteEntry > 0 ||
      (currentValues as any).DocEntry > 0;
    const { lines: storeLines, attachments: storeAttachments } = useIFPRDDocument.getState();
    const hasStoreContent = storeLines.length > 0 || storeAttachments.length > 0;

    if (!isDirty && !isDocumentLoaded && !hasStoreContent) {
      ResetForm(); 
    }
  }, [defaultValues, isDirty]);

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

  const handleCopyFrom = (selected: string) => {
    if (selected !== DocumentType.InvTransferReq.toString()) return;

    const currentValues = methods.getValues() as any;
    const state = useIFPRDDocument.getState();

    if (state.lines.length === 0) {
      toast.error("Please add production order lines first.");
      return;
    }

    setIsCopyingToInventory(true);

    const headerWarehouse = currentValues.Warehouse || "";
    const mappedLines = state.lines.map((line: any, index: number) => {
      const sourceWarehouse = line.Warehouse || headerWarehouse || "";

      return {
        ItemCode: line.ItemNo || line.ItemCode || "",
        Dscription: line.ItemName || line.ItemDescription || "",
        FromWhsCode: sourceWarehouse,
        FromBinLoc: "",
        ToBinLoc: "",
        FisrtBin: "",
        WhsCode: headerWarehouse || sourceWarehouse,
        Quantity: Number(line.PlannedQuantity || line.BaseQuantity || 1),
        ItemCost: 0,
        LineTotal: 0,
        UomCode: line.UoMCode || "",
        unitMsr: "",
        PlPaWght: 0,
        U_LastPrice: 0,
        OcrCode2: "",
        OcrCode3: "",
        OcrCode4: "",
        U_OQCR: "",
        U_OQDC: "",
        U_FBRQty: 0,
        U_SaleType: "Retail",
        U_FurtherTax: 0,
        LineNum: index,
      };
    });

    useInventoryDocument.setState({
      lines: mappedLines,
      fromWarehouse: mappedLines[0]?.FromWhsCode || headerWarehouse || "",
      toWarehouse: mappedLines[0]?.WhsCode || headerWarehouse || "",
      comments: `Copied from Production Order ${currentValues.DocNum || currentValues.AbsoluteEntry || currentValues.ItemNo || ""}`.trim(),
      journalMemo: "Inventory Transfer",
      DocEntry: 0,
      DocNum: 0,
      docDate: new Date().toISOString().split("T")[0],
      customer: null,
      attachments: [],
      isCopyingTo: true,
    });

    router.push("/dashboard/inventory/transfer-request");
  };

  const onSubmitError: SubmitErrorHandler<T> = (errors) => {
    const entries = Object.entries(errors);
    if (entries.length > 0) {
      const [fieldName, error] = entries[0];
      const message = (error as any).message || "Please check this field";
      toast.error(`Validation Error on [${fieldName}]: ${message}`);
    }
  };

  return (
    <PRDDocContext.Provider value={config}>
      <FormProvider {...methods}>

        <form onSubmit={handleSubmit((data) => onSubmit(data as any), onSubmitError)} className="flex flex-col min-h-screen bg-background">


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
                      disabled={(!watch("AbsoluteEntry" as any) || watch("AbsoluteEntry" as any) === 0) && (!watch("DocEntry" as any) || watch("DocEntry" as any) === 0) && !watch("ItemNo" as any) && lines.length === 0}
                      className="border-blue-600/50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-8 w-8 disabled:opacity-50 transition-all active:scale-95"
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

          <div className="flex justify-between items-center px-6 py-3 border-b bg-muted">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{config.title}</h1>
            </div>

            {actions && <div>{actions}</div>}
          </div>

          <div className="flex-1 flex flex-col gap-4 p-6 w-full">
            {children}
          </div>
          <div className="border-t px-6 py-4 flex justify-end gap-4 bg-white shadow-md">
            <div className="flex items-center gap-3">
              {getFieldSettings(docType, "headerFieds", "CopyFrom").visible !== false && (
                <Select
                  value=""
                  onValueChange={handleCopyFrom}
                >
                  <SelectTrigger
                    className="w-[180px] h-9 bg-black text-white hover:bg-zinc-800 focus:ring-0"
                    disabled={isCopyingToInventory || !getFieldSettings(docType, "headerFieds", "CopyFrom").enable || docType !== DocumentType.ProductionOrder}
                  >
                    <div className="flex items-center gap-2">
                      {isCopyingToInventory && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                      <SelectValue placeholder="Copy To" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {docType === DocumentType.ProductionOrder && (
                        <SelectItem value={DocumentType.InvTransferReq.toString()}>
                          Inventory Transfer Request
                        </SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}


              {initialStatus !== "boposClosed" && (
                <Button type="submit" disabled={isSubmitting || (docType === DocumentType.IssueForProduction && lines.length === 0)}>
                  {isSubmitting ? "Saving..." : ((watch("AbsoluteEntry" as any) || watch("DocEntry" as any)) ? "Update" : "Submit")}
                </Button>
              )}
            </div>
          </div>
          <UDFLayout docType={docType} values={udfs} />
        </form>

      </FormProvider>
    </PRDDocContext.Provider>
  );
}
