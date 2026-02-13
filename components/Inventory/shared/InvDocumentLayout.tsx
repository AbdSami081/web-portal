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
import { GenericModal } from "@/modals/GenericModal";
import { getInventoryTransferRequest, getInventoryTransferRequestList } from "@/api+/sap/inventory/inventoryService";
import { FilePlus2, Search } from "lucide-react";

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
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, watch, setValue, formState: { isSubmitting, isDirty } } = methods;
  const { reset: lineReset, DocEntry, isCopying, setIsCopying, loadFromDocument } = useInventoryDocument();

  const [selectedCopyTo] = useState<string>("");
  const [selectedCopyFrom, setSelectedCopyFrom] = useState<string>("");
  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const [itrData, setItrData] = useState<any[]>([]);
  const [isLoadingCopyFrom, setIsLoadingCopyFrom] = useState(false);

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
    reset({
      ...defaultValues,
      CardCode: "",
      CardName: "",
      Comments: "",
      JournalMemo: "",
      DocNum: 0,
      DocEntry: 0,
      TaxDate: new Date().toISOString().split("T")[0],
    } as any);
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

  const copyFromOptions = (() => {
    if (docType === DocumentType.InvTransfer)
      return [DocumentType.InvTransferReq];
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

  const handleCopyFromClick = async (type: string) => {
    if (parseInt(type) === DocumentType.InvTransferReq) {
      setIsLoadingCopyFrom(true);
      try {
        const data = await getInventoryTransferRequestList();
        setItrData(data);
        setCopyFromOpen(true);
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch ITR list.");
      } finally {
        setIsLoadingCopyFrom(false);
      }
    }
  };

  const handleSelectITR = async (docNums: any) => {
    const nums = Array.isArray(docNums) ? docNums : [docNums];
    if (nums.length > 0) {
      setIsLoadingCopyFrom(true);
      try {
        let mergedData: any = null;
        let allLines: any[] = [];

        for (const num of nums) {
          const fullData = await getInventoryTransferRequest(num);
          if (fullData) {
            if (!mergedData) {
              mergedData = { ...fullData };
            }
            const lines = fullData.DocumentLines || fullData.StockTransferLines || fullData.InventoryTransferLines || [];
            allLines = [...allLines, ...lines];
          }
        }

        if (mergedData) {
          setValue("DocEntry" as any, 0 as any);
          setValue("DocNum" as any, 0 as any);
          setValue("TaxDate" as any, new Date().toISOString().split("T")[0] as any);
          setValue("Comments" as any, mergedData.Comments as any);
          setValue("FromWarehouse" as any, mergedData.FromWarehouse as any);
          setValue("ToWarehouse" as any, mergedData.ToWarehouse as any);
          setValue("JournalMemo" as any, mergedData.JournalMemo as any);
          setValue("DocStatus" as any, "bost_Open" as any);

          const finalDoc = { ...mergedData, DocumentLines: allLines, CardCode: "", CardName: "" };
          loadFromDocument(finalDoc, DocumentType.InvTransferReq, true);
          toast.success(`Copied from ${nums.length} ITR(s)`);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load ITR details.");
      } finally {
        setIsLoadingCopyFrom(false);
      }
    }
  };

  return (
    <InvDocContext.Provider value={config}>
      <FormProvider {...methods}>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col min-h-screen bg-background">

          <div className="flex px-6 py-2 border-b bg-white">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={ResetForm}
              title="New Document"
              disabled={!DocEntry || DocEntry === 0}
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

          <div className="border-t px-6 py-4 flex justify-end gap-4 bg-white shadow-md">

            {copyFromOptions.length > 0 && (!DocEntry || DocEntry === 0) && (
              <Select
                value={selectedCopyFrom}
                onValueChange={(value) => {
                  handleCopyFromClick(value);
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
                        {type === DocumentType.InvTransferReq ? "Inventory Transfer Req" : ""}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

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
          <GenericModal
            title="Select Inventory Transfer Request"
            open={copyFromOpen}
            multiple={true}
            onClose={() => setCopyFromOpen(false)}
            onSelect={handleSelectITR}
            data={itrData}
            columns={[
              { key: "index", label: "#" },
              { key: "DocDate", label: "Doc Date" },
              { key: "FromWarehouse", label: "From Whse" },
              { key: "ToWarehouse", label: "To Whse" },
              { key: "Comments", label: "Comments" },
            ]}
            getSelectValue={(item: any) => item.DocNum}
            isLoading={isLoadingCopyFrom}
          />
        </form>

      </FormProvider>
    </InvDocContext.Provider>
  );
}
