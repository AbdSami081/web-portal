"use client"
import React, { createContext, useContext, useEffect, useState } from "react";
import { FieldValues, FormProvider, useForm, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { DocumentConfig, getDocumentConfig } from "@/lib/config/inventory/documentConfig";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { GenericModal } from "@/modals/GenericModal";
import { getInventoryTransferRequest, getInventoryTransferRequestList } from "@/api+/sap/inventory/inventoryService";
import { FilePlus2 } from "lucide-react";
import { HeaderActionPortal } from "@/components/header-portal";

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
    resolver: zodResolver(schema as any),
    defaultValues: defaultValues as DefaultValues<T>,
    mode: "onSubmit",
  });

  const { handleSubmit, reset, setValue, formState: { isSubmitting }, watch } = methods;
  const { reset: resetStore, DocEntry, loadFromDocument, setIsCopyingTo } = useInventoryDocument();
  const store = useInventoryDocument();

  const isInitialMount = React.useRef(true);

  // Handle store state on mount:
  // - If we are copying, sync store to form and consume flag.
  // - If normal entry, reset everything.
  useEffect(() => {
    if (!isInitialMount.current) return;
    isInitialMount.current = false;

    const state = useInventoryDocument.getState();

    if (state.isCopyingTo) {
      // Sync store to form
      setValue("CardCode" as any, state.customer?.CardCode as any);
      setValue("CardName" as any, state.customer?.CardName as any);
      setValue("FromWarehouse" as any, state.fromWarehouse as any);
      setValue("ToWarehouse" as any, state.toWarehouse as any);
      setValue("Comments" as any, state.comments as any);
      setValue("JournalMemo" as any, state.journalMemo as any);
      setValue("TaxDate" as any, state.docDate as any);

      // Consume flag manually
      setIsCopyingTo(false);
    } else {
      // Normal entry, reset store (only if not viewing an existing document)
      if (!DocEntry || DocEntry === 0) {
        resetStore();
      }
    }
  }, [resetStore, setIsCopyingTo, setValue, DocEntry]);

  // Sync store to form for header fields (CardCode, Warehouses, etc.) when they change
  useEffect(() => {
    if (store.customer) setValue("CardCode" as any, store.customer.CardCode as any);
    if (store.customer) setValue("CardName" as any, store.customer.CardName as any);
    setValue("FromWarehouse" as any, store.fromWarehouse as any);
    setValue("ToWarehouse" as any, store.toWarehouse as any);
    setValue("Comments" as any, store.comments as any);
    setValue("JournalMemo" as any, store.journalMemo as any);
    setValue("TaxDate" as any, store.docDate as any);
  }, [
    store.customer,
    store.fromWarehouse,
    store.toWarehouse,
    store.comments,
    store.journalMemo,
    store.docDate,
    setValue
  ]);

  const [selectedCopyFrom, setSelectedCopyFrom] = useState<string>("");
  const [selectedCopyTo] = useState<string>("");
  const [copyFromOpen, setCopyFromOpen] = useState(false);
  const [itrData, setItrData] = useState<any[]>([]);
  const [isLoadingCopyFrom, setIsLoadingCopyFrom] = useState(false);



  const handleNewDocument = () => {
    reset({
      ...defaultValues,
      DocNum: 0,
      DocEntry: 0,
    } as any);
    resetStore();
  };

  // Copy To: set store directly then navigate (no localStorage needed)
  const handleCopyTo = (selected: string) => {
    if (!DocEntry || DocEntry === 0) {
      toast.error("Please search or select a document first!");
      return;
    }

    if (selected === DocumentType.InvTransfer.toString()) {
      const state = useInventoryDocument.getState();

      const copiedLines = state.lines.map((line, idx) => ({
        ...line,
        BaseType: docType,
        BaseEntry: DocEntry,
        BaseLine: line.LineNum ?? idx,
      }));

      useInventoryDocument.setState({
        lines: copiedLines,
        fromWarehouse: copiedLines[0]?.FromWhsCode || state.fromWarehouse || "",
        toWarehouse: copiedLines[0]?.WhsCode || state.toWarehouse || "",
        comments: "",
        journalMemo: "",
        DocEntry: 0,
        customer: state.customer,
        isCopyingTo: true,
      });

      router.push("/dashboard/inventory/transfer");
    } else {
      toast.info("Copy to this document type is not implemented yet.");
    }
  };

  // Copy From: fetch ITR list and open modal
  const handleCopyFrom = async (type: string) => {
    if (parseInt(type) !== DocumentType.InvTransferReq) return;
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
  };

  // Copy From: user selected ITR(s) from modal
  const handleSelectITR = async (docNums: any) => {
    const nums = Array.isArray(docNums) ? docNums : [docNums];
    if (nums.length === 0) return;

    setIsLoadingCopyFrom(true);
    try {
      let mergedDoc: any = null;
      let allLines: any[] = [];

      for (const num of nums) {
        const doc = await getInventoryTransferRequest(num);
        if (!doc) continue;
        if (!mergedDoc) mergedDoc = { ...doc };
        const docLines = doc.DocumentLines || doc.StockTransferLines || doc.InventoryTransferLines || [];
        allLines = [...allLines, ...docLines];
      }

      if (mergedDoc) {
        const fromWhs = mergedDoc.FromWarehouse || allLines[0]?.FromWhsCode || allLines[0]?.FromWarehouseCode || "";
        const toWhs = mergedDoc.ToWarehouse || allLines[0]?.WhsCode || allLines[0]?.WarehouseCode || "";

        setValue("DocEntry" as any, 0 as any);
        setValue("DocNum" as any, 0 as any);
        const dateStr = new Date().toISOString().split("T")[0];
        store.setDocDate(dateStr);
        store.setJournalMemo(mergedDoc.JournalMemo || mergedDoc.JrnlMemo || "");
        store.setFromWarehouse(fromWhs);
        store.setToWarehouse(toWhs);

        loadFromDocument({ ...mergedDoc, DocumentLines: allLines, CardCode: "", CardName: "" }, DocumentType.InvTransferReq, true);
        toast.success(`Copied from ${nums.length} ITR(s)`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load ITR details.");
    } finally {
      setIsLoadingCopyFrom(false);
    }
  };

  const canCopyTo = docType === DocumentType.InvTransferReq;
  const canCopyFrom = docType === DocumentType.InvTransfer;

  return (
    <InvDocContext.Provider value={config}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit((data) => onSubmit(data as unknown as T))} className="flex flex-col min-h-screen bg-background">

          <HeaderActionPortal>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleNewDocument}
              title="New Document"
              disabled={!DocEntry || DocEntry === 0}
              className="border-blue-600/50 text-blue-600 hover:bg-blue-50 hover:text-blue-700 h-8 w-8 disabled:opacity-50"
            >
              <FilePlus2 className="w-4 h-4" />
            </Button>
          </HeaderActionPortal>

          <div className="flex justify-between items-center px-6 py-3 border-b bg-muted">
            <h1 className="text-xl font-semibold">{config.title}</h1>
            {actions && <div>{actions}</div>}
          </div>

          <div className="flex-1 flex flex-col gap-4 p-6 overflow-auto w-full">
            {children}
          </div>

          <div className="border-t px-6 py-4 flex justify-end gap-4 bg-white shadow-md">

            {/* Copy From — only on Inventory Transfer, only when no doc is loaded */}
            {canCopyFrom && (!DocEntry || DocEntry === 0) && (
              <Select
                value={selectedCopyFrom}
                onValueChange={(value) => {
                  handleCopyFrom(value);
                  setTimeout(() => setSelectedCopyFrom(""), 0);
                }}
              >
                <SelectTrigger className="w-[180px] h-9 bg-black text-white hover:bg-zinc-800 focus:ring-0">
                  <SelectValue placeholder="Copy From" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={DocumentType.InvTransferReq.toString()}>
                      Inventory Transfer Req
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            {/* Copy To — only on Inventory Transfer Request */}
            {canCopyTo && (
              <Select
                value={selectedCopyTo}
                disabled={!DocEntry || DocEntry === 0}
                onValueChange={handleCopyTo}
              >
                <SelectTrigger className="w-[180px] h-9 bg-black text-white hover:bg-zinc-800 focus:ring-0">
                  <SelectValue placeholder="Copy To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value={DocumentType.InvTransfer.toString()}>
                      Inventory Transfer
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}

            {/* Submit — hidden when viewing an existing document */}
            {(!DocEntry || DocEntry === 0) && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Submit"}
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
