
"use client";

import { useEffect, useState } from "react";
import { Search, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericModal } from "@/modals/GenericModal";
import { getQuotationByBP } from "@/api+/sap/sales/salesService";

interface ReferenceInformationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardCode?: string;
}

const tableColumns = [
  "#",
  "Transaction Type",
  "Doc. Number",
  "Ext. Doc. Number",
  "Date",
  "Remarks",
];

const transactionTypeOptions = [
  { value: "sales-quotation", label: "Sales Quotation" },
  { value: "sales-order", label: "Sales Order" },
  { value: "delivery-notes", label: "Delivery Notes" },
  { value: "return-request", label: "Return Request" },
  { value: "return", label: "Return" },
  { value: "ar-down-payment", label: "A/R Down Payment" },
  { value: "ar-invoice", label: "A/R Invoice" },
  { value: "ar-credit-memo", label: "A/R Credit Memo" },
  { value: "purchase-request", label: "Purchase Request" },
  { value: "purchase-quotation", label: "Purchase Quotation" },
  { value: "purchase-order", label: "Purchase Order" },
  { value: "goods-receipt-po", label: "Goods Receipt PO" },
  { value: "goods-return-request", label: "Goods Return Request" },
  { value: "goods-return", label: "Goods Return" },
  { value: "ap-down-payment", label: "A/P Down Payment" },
  { value: "ap-invoice", label: "A/P Invoice" },
  { value: "ap-credit-memo", label: "A/P Credit Memo" },
  { value: "landed-costs", label: "Landed Costs" },
  { value: "incoming-payments", label: "Incoming Payments" },
  { value: "outgoing-payments", label: "Outgoing Payments" },
  { value: "checks-for-payment", label: "Checks for Payment" },
  { value: "internal-reconciliation", label: "Internal Reconciliation" },
  { value: "journal-entry", label: "Journal Entry" },
  { value: "goods-receipt", label: "Goods Receipt" },
  { value: "goods-issue", label: "Goods Issue" },
  { value: "inventory-revaluation", label: "Inventory Revaluation"},
  { value: "inventory-counting", label: "Inventory Counting"},
  { value: "inventory-posting", label: "Inventory Posting"},
  { value: "inventory-transfer-request", label: "Inventory Transfer Request"},
  { value: "inventory-transfer", label: "Inventory Transfer"},
  { value: "production-order", label: "Production Order"},
];

const sampleQuotations = [
  { DocNum: 13, RefDate: "10.03.15", CardName: "SG Electronics", PriceMode: "", Comments: "", DueDate: "09.04.15" },
  { DocNum: 14, RefDate: "15.03.15", CardName: "Aquent Systems", PriceMode: "", Comments: "", DueDate: "14.04.15" },
  { DocNum: 15, RefDate: "20.03.15", CardName: "Aquent Systems", PriceMode: "", Comments: "", DueDate: "19.04.15" },
  { DocNum: 16, RefDate: "25.03.15", CardName: "SG Electronics", PriceMode: "", Comments: "", DueDate: "24.04.15" },
  { DocNum: 20, RefDate: "25.04.15", CardName: "Aquent Systems", PriceMode: "", Comments: "", DueDate: "25.05.15" },
  { DocNum: 27, RefDate: "20.06.15", CardName: "Aquent Systems", PriceMode: "", Comments: "", DueDate: "20.07.15" },
  { DocNum: 28, RefDate: "25.06.15", CardName: "SG Electronics", PriceMode: "", Comments: "", DueDate: "25.07.15" },
  { DocNum: 32, RefDate: "18.07.15", CardName: "Aquent Systems", PriceMode: "", Comments: "", DueDate: "17.08.15" },
  { DocNum: 36, RefDate: "14.08.15", CardName: "Aquent Systems", PriceMode: "", Comments: "", DueDate: "13.09.15" },
  { DocNum: 38, RefDate: "23.08.15", CardName: "Aquent Systems", PriceMode: "", Comments: "", DueDate: "22.09.15" },
];

const documentPickerTitles: Record<string, string> = {
  "sales-quotation": "List of Sales Quotations",
  "sales-order": "List of Sales Orders",
  "delivery-notes": "List of Delivery Notes",
  "return-request": "List of Return Requests",
  return: "List of Returns",
  "ar-down-payment": "List of A/R Down Payments",
  "ar-invoice": "List of A/R Invoices",
  "ar-credit-memo": "List of A/R Credit Memos",
  "purchase-request": "List of Purchase Requests",
  "purchase-quotation": "List of Purchase Quotations",
  "purchase-order": "List of Purchase Orders",
  "goods-receipt-po": "List of Goods Receipt POs",
  "goods-return-request": "List of Goods Return Requests",
  "goods-return": "List of Goods Returns",
  "ap-down-payment": "List of A/P Down Payments",
  "ap-invoice": "List of A/P Invoices",
  "ap-credit-memo": "List of A/P Credit Memos",
  "landed-costs": "List of Landed Costs",
  "incoming-payments": "List of Incoming Payments",
  "outgoing-payments": "List of Outgoing Payments",
  "checks-for-payment": "List of Checks for Payment",
  "internal-reconciliation": "List of Internal Reconciliations",
  "journal-entry": "List of Journal Entries",
  "goods-receipt": "List of Goods Receipts",
  "goods-issue": "List of Goods Issues",
  "inventory-revaluation": "List of Inventory Revaluations",
  "inventory-counting": "List of Inventory Countings",
  "inventory-posting": "List of Inventory Postings",
  "inventory-transfer-request": "List of Inventory Transfer Requests",
  "inventory-transfer": "List of Inventory Transfers",
  "production-order": "List of Production Orders",
};

const getSampleDocuments = (transactionType: string) => {
  const typeIndex = transactionTypeOptions.findIndex(
    (option) => option.value === transactionType
  );

  return sampleQuotations.map((document, index) => ({
    ...document,
    DocNum: document.DocNum + Math.max(typeIndex, 0) * 100,
    CardName: index % 2 === 0 ? "SG Electronics" : "Aquent Systems",
  }));
};


function ReferenceRows({
  cardCode,
  onDataChange,
}: {
  cardCode?: string;
  onDataChange: () => void;
}) {
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const [documentPickerOpen, setDocumentPickerOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [activeDocNumberCell, setActiveDocNumberCell] = useState<string | null>(null);
  const [documentPickerTitle, setDocumentPickerTitle] = useState("List of Sales Quotations");

  const setCellValue = (key: string, value: string) => {
    setCellValues((current) => ({
      ...current,
      [key]: value,
    }));

    onDataChange();
  };

  const openDocumentPicker = async (cellKey: string) => {
    setActiveDocNumberCell(cellKey);
    setDocumentPickerOpen(true);

    const rowIndex = cellKey.split("-")[0];
    const transactionType = cellValues[`${rowIndex}-transaction-type`] || "sales-quotation";
    setDocumentPickerTitle(documentPickerTitles[transactionType] || "List of Documents");

    if (transactionType !== "sales-quotation" || !cardCode) {
      setDocuments(getSampleDocuments(transactionType));
      return;
    }

    setDocumentsLoading(true);

    try {
      const result = await getQuotationByBP(cardCode);
      setDocuments(result?.length ? result : getSampleDocuments(transactionType));
    } catch {
      setDocuments(getSampleDocuments(transactionType));
    } finally {
      setDocumentsLoading(false);
    }
  };

  return (
    <div className="w-full overflow-x-hidden rounded-md border border-slate-200">
      <table className="w-full table-fixed border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-neutral-900 text-white">
          <tr>
            {tableColumns.map((column, index) => (
              <th
                key={column}
                className={`border border-neutral-700 px-1.5 py-2 font-semibold ${
                  index === 0
                    ? "w-9"
                    : index === 1
                      ? "w-[19%]"
                      : index === 2
                        ? "w-[15%]"
                        : index === 3
                          ? "w-[22%]"
                          : index === 4
                            ? "w-[16%]"
                            : ""
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: 8 }, (_, index) => (
            <tr key={index} className="h-9">
              <td className="border border-slate-200 bg-slate-50 px-2 text-slate-500">
                {index + 1}
              </td>

              {[
                "transaction-type",
                "doc-number",
                "external-number",
                "date",
                "remarks",
              ].map((field) => {
                const key = `${index}-${field}`;
                const isEditable = index === 0 || editingCell === key;
                const value = cellValues[key] ?? "";

                return (
                  <td
                    key={field}
                    className="min-w-0 border border-slate-200 p-0.5"
                    onDoubleClick={() => setEditingCell(key)}
                    title={index > 0 ? "Double-click to edit" : undefined}
                  >
                    {field === "transaction-type" ? (
                      isEditable ? (
                        <Select
                          value={value}
                          onValueChange={(nextValue) => {
                            setCellValues((current) => ({
                              ...current,
                              [key]: nextValue,
                              [`${index}-doc-number`]: "",
                            }));
                            onDataChange();

                            if (index > 0) {
                              setEditingCell(null);
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 w-full min-w-0 border-0 bg-transparent px-1 text-xs shadow-none">
                            <SelectValue placeholder="" />
                          </SelectTrigger>

                          <SelectContent className="z-[130] max-h-80">
                            {transactionTypeOptions.map(
                              (option, optionIndex) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                  className={
                                    [8, 18, 23].includes(optionIndex)
                                      ? "border-t border-neutral-300"
                                      : undefined
                                  }
                                >
                                  {option.label}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="block min-h-7 truncate px-1 py-1.5">
                          {transactionTypeOptions.find(
                            (option) => option.value === value
                          )?.label ?? value}
                        </span>
                      )
                    ) : field === "doc-number" ? (
                      index === 0 || isEditable ? (
                        <button
                          type="button"
                          className="flex min-h-7 w-full min-w-0 items-center gap-1 px-1 text-left"
                          onClick={() => void openDocumentPicker(key)}
                          aria-label={`Choose document number for row ${index + 1}`}
                        >
                          <span className="min-w-0 flex-1 truncate">
                            {value}
                          </span>

                          <Search className="size-3.5 shrink-0 text-slate-500" />
                        </button>
                      ) : (
                        <span className="block min-h-7 truncate px-1 py-1.5">
                          {value}
                        </span>
                      )
                    ) : isEditable ? (
                      <Input
                        aria-label={`${field} row ${index + 1}`}
                        type={field === "date" ? "date" : "text"}
                        autoFocus={index > 0}
                        value={value}
                        onChange={(event) =>
                          setCellValue(key, event.target.value)
                        }
                        onBlur={() => {
                          if (index > 0) {
                            setEditingCell(null);
                          }
                        }}
                        className="h-7 w-full min-w-0 rounded-none border-none bg-transparent px-1 text-xs shadow-none outline-none ring-0 focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    ) : (
                      <span className="block min-h-7 truncate px-1 py-1.5">
                        {value}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <GenericModal
        title={documentPickerTitle}
        open={documentPickerOpen}
        onClose={() => setDocumentPickerOpen(false)}
        onSelect={(docNum) => {
          if (activeDocNumberCell) {
            setCellValue(activeDocNumberCell, String(docNum));
          }
          setDocumentPickerOpen(false);
        }}
        data={documents}
        columns={[
          { key: "DocNum", label: "#" },
          { key: "RefDate", label: "Date" },
          { key: "CardName", label: "Customer" },
          { key: "PriceMode", label: "Price Mode" },
          { key: "Comments", label: "Remarks" },
          { key: "DueDate", label: "Due Date" },
        ]} 
        getSelectValue={(document) => document.DocNum}
        isLoading={documentsLoading}
        contentClassName="z-[130]"
      />
    </div>
  );
}

function ReferenceByRows() {
  const columns = [
    "#",
    "Transaction Type",
    "Ref. Document",
    "Reference Type",
    "Date",
    "Ref. Amount",
    "Remarks",
  ];

  return (
    <div className="relative h-full w-full overflow-auto rounded-md border border-slate-200 bg-white">
      <button
        type="button"
        className="absolute right-1 top-1 z-10 text-slate-400 hover:text-slate-700"
        title="Expand"
      >
        <ArrowUpRight className="size-4" />
      </button>

      <table className="w-full min-w-[750px] table-fixed border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-neutral-900 text-white">
          <tr className="h-8">
            {columns.map((column, index) => (
              <th
                key={column}
                className={`border border-neutral-700 px-1.5 py-2 font-semibold ${
                  index === 0
                    ? "w-9"
                    : index === 1
                      ? "w-[11%]"
                      : index === 2
                        ? "w-[14%]"
                        : index === 3
                          ? "w-[21%]"
                          : index === 4
                            ? "w-[14%]"
                            : index === 5
                              ? "w-[14%]"
                              : "w-[23%]"
                }`}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: 8 }, (_, index) => (
            <tr key={index} className="h-[33px]">
              <td className="border border-slate-200 bg-slate-50 px-2 text-blue-500">
                {index + 1}
              </td>

              {Array.from({ length: 6 }, (_, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border border-slate-200 bg-white px-1"
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ReferenceInformationDialog({
  open,
  onOpenChange,
  cardCode,
}: ReferenceInformationDialogProps) {
  const [activeTab, setActiveTab] = useState("referenced-to");
  const [hasChanges, setHasChanges] = useState(false);


  useEffect(() => {
    if (open) {
      setHasChanges(false);
      setActiveTab("referenced-to");
    }
  }, [open]);

  const close = () => onOpenChange(false);

  const handleUpdate = () => {
    if (hasChanges) {

      setHasChanges(false);
    } else {
      close();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[120] flex max-h-[85vh] w-[98vw] max-w-[1200px] flex-col gap-0 overflow-hidden rounded-xl border-slate-200 bg-white p-0 shadow-2xl sm:max-w-[1200px]">

        <DialogHeader className="shrink-0 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <DialogTitle className="pr-8 text-left text-base font-semibold text-slate-900">
            Reference Information
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col p-4"
        >
         <TabsList className="flex h-9 w-full justify-start gap-0 rounded-none border-b border-slate-300 bg-transparent p-0">

  <TabsTrigger
    value="referenced-to"
    className="h-9 w-[300px] rounded-t-md rounded-b-none border border-slate-300 bg-white text-xs text-black
    data-[state=active]:bg-neutral-900
    data-[state=active]:text-white
    data-[state=active]:border-neutral-700"
  >
    Document Referenced To
  </TabsTrigger>

  <TabsTrigger
    value="referenced-by"
    className="h-9 w-[300px] rounded-t-md rounded-b-none border border-slate-300 bg-white text-xs text-black
    data-[state=active]:bg-neutral-900
    data-[state=active]:text-white
    data-[state=active]:border-neutral-700"
  >
    Document Referenced By
  </TabsTrigger>

</TabsList>


          <div className="relative mt-3 min-h-0 flex-1 rounded-md border border-slate-200 p-3">

            <TabsContent
              value="referenced-to"
              className="mt-0 h-full"
            >
              <ReferenceRows
                cardCode={cardCode}
                onDataChange={() => setHasChanges(true)}
              />
            </TabsContent>

            <TabsContent
              value="referenced-by"
              className="mt-0 h-full"
            >
              <ReferenceByRows />
            </TabsContent>

          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">

          <Button
            type="button"
            onClick={handleUpdate}
            className="bg-neutral-900 text-white hover:bg-neutral-800"
          >
            {hasChanges ? "Update" : "OK"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={close}
          >
            Cancel
          </Button>

        </div>

      </DialogContent>
    </Dialog>
  );
}
