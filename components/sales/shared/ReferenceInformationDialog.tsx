
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
import { getAllDraftDocs, getAllDrafts, getDraftDocument, getDocumentsList } from "@/api+/sap/common/documentService";
import { getFieldSettings } from "@/lib/config/Client/clientSettings";
import { toast } from "sonner";

type DocumentReference = {
  RefDocEntr: number;
  RefDocNum?: number;
  RefObjType: string;
  TransactionType?: string;
  ExtDocNum?: string;
  IssueDate?: string;
  Remark?: string;
};

interface ReferenceInformationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cardCode?: string;
  documentType?: number;
  fieldAccess?: string[];
  documentReferences?: DocumentReference[];
  onReferencesChange?: (references: DocumentReference[]) => void;
}

const EMPTY_DOCUMENT_REFERENCES: NonNullable<ReferenceInformationDialogProps["documentReferences"]> = [];

const referenceColumns = [
  { field: "transaction-type", label: "Transaction Type", setting: "ReferenceTransactionType" },
  { field: "doc-number", label: "Doc. Number", setting: "ReferenceDocNumber" },
  { field: "external-number", label: "Ext. Doc. Number", setting: "ReferenceExternalDocNumber" },
  { field: "date", label: "Date", setting: "ReferenceDate" },
  { field: "remarks", label: "Remarks", setting: "ReferenceRemarks" },
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

const transactionDocObjects: Record<string, string[]> = {
  "sales-quotation": ["oQuotations", "23"],
  "sales-order": ["oOrders", "17"],
  "delivery-notes": ["oDeliveryNotes", "15"],
  "return-request": ["oReturnsRequest", "oReturnRequest", "234000031"],
  return: ["oReturns", "16"],
  "ar-down-payment": ["oDownPayments", "oDownPaymentInvoices", "203", "204"],
  "ar-invoice": ["oInvoices", "13"],
  "ar-credit-memo": ["oCreditNotes", "14"],
  "purchase-request": ["oPurchaseRequests", "1470000113"],
  "purchase-quotation": ["oPurchaseQuotations", "540000006"],
  "purchase-order": ["oPurchaseOrders", "22"],
  "goods-receipt-po": ["oPurchaseDeliveryNotes", "20"],
  "goods-return-request": ["oPurchaseReturnsRequest", "234000032"],
  "goods-return": ["oPurchaseReturns", "21"],
  "ap-down-payment": ["oPurchaseDownPayments", "oPurchaseDownPaymentInvoices", "204", "1470000113"],
  "ap-invoice": ["oPurchaseInvoices", "18"],
  "ap-credit-memo": ["oPurchaseCreditNotes", "19"],
  "landed-costs": ["oLandedCosts", "69"],
  "incoming-payments": ["oIncomingPayments", "24"],
  "outgoing-payments": ["oVendorPayments", "46"],
  "checks-for-payment": ["oChecksforPayment", "57"],
  "internal-reconciliation": ["oInternalReconciliations", "321"],
  "journal-entry": ["oJournalEntries", "30"],
  "goods-receipt": ["oInventoryGenEntry", "59"],
  "goods-issue": ["oInventoryGenExits", "60"],
  "inventory-revaluation": ["oInventoryRevaluation", "162"],
  "inventory-counting": ["oInventoryCountings", "1470000065"],
  "inventory-posting": ["oInventoryPostings", "10000071"],
  "inventory-transfer-request": ["oInventoryTransferRequests", "1250000001"],
  "inventory-transfer": ["oStockTransfers", "67"],
  "production-order": ["oProductionOrders", "202"],
};

const transactionResources: Record<string, string> = {
  "sales-quotation": "Quotations",
  "sales-order": "Orders",
  "delivery-notes": "DeliveryNotes",
  "return-request": "ReturnRequest",
  return: "Returns",
  "ar-down-payment": "DownPayments",
  "ar-invoice": "Invoices",
  "ar-credit-memo": "CreditNotes",
  "purchase-request": "PurchaseRequests",
  "purchase-quotation": "PurchaseQuotations",
  "purchase-order": "PurchaseOrders",
  "goods-receipt-po": "PurchaseDeliveryNotes",
  "goods-return-request": "GoodsReturnRequest",
  "goods-return": "PurchaseReturns",
  "ap-down-payment": "PurchaseDownPayments",
  "ap-invoice": "PurchaseInvoices",
  "ap-credit-memo": "PurchaseCreditNotes",
  "landed-costs": "LandedCosts",
  "incoming-payments": "IncomingPayments",
  "outgoing-payments": "VendorPayments",
  "checks-for-payment": "ChecksforPayment",
  "internal-reconciliation": "InternalReconciliations",
  "journal-entry": "JournalEntries",
  "goods-receipt": "InventoryGenEntries",
  "goods-issue": "InventoryGenExits",
  "inventory-revaluation": "InventoryRevaluations",
  "inventory-counting": "InventoryCountings",
  "inventory-posting": "InventoryPostings",
  "inventory-transfer-request": "InventoryTransferRequests",
  "inventory-transfer": "StockTransfers",
  "production-order": "ProductionOrders",
};

const readDocumentField = (document: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    const matchedKey = Object.keys(document).find(
      (candidate) => candidate.toLowerCase() === key.toLowerCase(),
    );
    const value = document[matchedKey ?? key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }
  return "";
};

const readReferenceField = (reference: DocumentReference, field: string) =>
  Object.entries(reference).find(([key]) => key.toLowerCase() === field.toLowerCase())?.[1];

const readFirstReferenceField = (reference: DocumentReference, fields: string[]) => {
  for (const field of fields) {
    const value = readReferenceField(reference, field);
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
};

const readReferenceDocEntry = (reference: DocumentReference) =>
  readFirstReferenceField(reference, [
    "RefDocEntr", "RefDocEntry", "DocEntry", "Entry", "ReferencedDocEntry", "ReferenceDocEntry",
  ]);

const readReferenceObjectCode = (reference: DocumentReference) =>
  readFirstReferenceField(reference, [
    "RefObjType", "RefObjectType", "ReferencedObjectType", "DocObjectCode",
    "ObjectCode", "ObjectType", "TransactionType", "TransactionTypeName", "DocumentTypeName",
    "ObjectTypeName", "ReferenceType",
  ]);

const readReferenceDocNumber = (reference: DocumentReference) =>
  readFirstReferenceField(reference, [
    "RefDocNum", "RefDocumentNumber", "DocNum", "DocNumber", "DocumentNumber",
  ]);

const getReferenceObjectType = (transactionType: string, rawObjectType: string) => {
  const expectedObjectTypes = transactionDocObjects[transactionType] ?? [];
  const numericObjectType = /^\d+$/.test(rawObjectType) ? rawObjectType : "";
  if (numericObjectType && (!expectedObjectTypes.length || expectedObjectTypes.includes(numericObjectType))) {
    return numericObjectType;
  }
  return expectedObjectTypes.find((objectType) => /^\d+$/.test(objectType)) ?? numericObjectType;
};

const getTransactionTypeFromObjectType = (rawObjectType: string) => {
  const normalizeTypeToken = (value: string) => value
    .trim()
    .toLowerCase()
    .replace(/\.0+$/, "")
    .replace(/[^a-z0-9]/g, "")
    .replace(/^(rot|bost|bo|o)(?=[a-z])/, "")
    .replace(/s$/, "");
  const objectType = normalizeTypeToken(rawObjectType);
  return transactionTypeOptions.find((option) => {
    const aliases = [
      option.value,
      option.label,
      transactionResources[option.value],
      ...(transactionDocObjects[option.value] ?? []),
    ];
    return aliases.some((value) => value && normalizeTypeToken(value) === objectType);
  })?.value ?? "";
};

const toDateInputValue = (value: string) => {
  const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (isoDate) return isoDate;
  const dottedDate = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (dottedDate) return `${dottedDate[3]}-${dottedDate[2]}-${dottedDate[1]}`;
  const slashDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDate) {
    const month = slashDate[1].padStart(2, "0");
    const day = slashDate[2].padStart(2, "0");
    return `${slashDate[3]}-${month}-${day}`;
  }
  const sapDate = value.match(/\/Date\((-?\d+)(?:[+-]\d{4})?\)\//);
  if (sapDate) {
    const date = new Date(Number(sapDate[1]));
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  }
  return "";
};

const toDateDisplayValue = (value: string) => {
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[3]}.${isoDate[2]}.${isoDate[1].slice(-2)}`;
  const fullYearDate = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (fullYearDate) return `${fullYearDate[1]}.${fullYearDate[2]}.${fullYearDate[3].slice(-2)}`;
  return value;
};

const normalizeReferenceDocument = (source: Record<string, any>) => {
  const nestedDocument = source.Document ?? source.document;
  const document = nestedDocument && typeof nestedDocument === "object"
    ? { ...source, ...nestedDocument }
    : source;
  const rawDate = readDocumentField(document, ["IssueDate", "RefDate", "DocDate", "DocumentDate", "PostingDate", "TaxDate", "Date"]);
  const rawObjectCode = readDocumentField(document, [
    "DocObjectCode",
    "DocumentObjectCode",
    "ObjType",
    "ObjectType",
    "ObjectCode",
    "DocType",
    "DocumentType",
  ]);
  const rawTransactionType = readDocumentField(document, [
    "TransactionType",
    "DocumentTypeName",
    "ObjectTypeName",
    "DocTypeName",
    "DocType",
    "DocumentType",
    "ObjectName",
  ]);
  return {
    ...document,
    DocNum: readDocumentField(document, ["DocNum", "DocNumber", "DocumentNumber", "Number", "DocEntry"]),
    RefDate: toDateInputValue(rawDate),
    DisplayDate: toDateDisplayValue(rawDate),
    ExternalNumber: readDocumentField(document, ["ExternalNumber", "ExternalDocNumber", "ExtDocNum", "NumAtCard", "ReferenceNumber"]),
    CardName: readDocumentField(document, ["CardName", "CustomerName", "VendorName", "BPName", "CardCode"]),
    PriceMode: readDocumentField(document, ["PriceMode", "PriceModeName", "PriceListMode"]),
    ObjectCode: rawObjectCode,
    TransactionType: rawTransactionType,
    Comments: readDocumentField(document, ["Comments", "Remarks", "Remark", "JournalMemo", "Comment", "Memo"]),
  };
};


function ReferenceRows({
  open,
  cardCode,
  documentType,
  fieldAccess,
  documentReferences,
  onDataChange,
  onReferencesChange,
}: {
  open: boolean;
  cardCode?: string;
  documentType?: number;
  fieldAccess?: string[];
  documentReferences: NonNullable<ReferenceInformationDialogProps["documentReferences"]>;
  onDataChange: () => void;
  onReferencesChange: ReferenceInformationDialogProps["onReferencesChange"];
}) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [openTransactionTypeRow, setOpenTransactionTypeRow] = useState<number | null>(null);
  const [cellValues, setCellValues] = useState<Record<string, string>>({});
  const [documentPickerOpen, setDocumentPickerOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [activeDocNumberCell, setActiveDocNumberCell] = useState<string | null>(null);
  const [documentPickerTitle, setDocumentPickerTitle] = useState("List of Sales Quotations");
  const rowCount = Math.max(8, documentReferences.length);
  const referenceLookupKey = JSON.stringify(
    documentReferences.slice(0, rowCount).map((reference) => [
      readReferenceDocEntry(reference),
      readReferenceObjectCode(reference),
      readReferenceDocNumber(reference),
      readFirstReferenceField(reference, ["ExtDocNum", "ExternalNumber", "ExternalDocNumber", "NumAtCard"]),
      readFirstReferenceField(reference, ["IssueDate", "RefDate", "DocDate", "Date"]),
      readFirstReferenceField(reference, ["Remark", "Remarks", "Comments", "Memo"]),
      readFirstReferenceField(reference, ["TransactionType", "DocumentType", "DocType"]),
    ]),
  );
  const visibleReferenceColumns = referenceColumns
    .map((column) => ({
      ...column,
      settings: documentType === undefined
        ? { visible: true, enable: true }
        : getFieldSettings(documentType, "headerFieds", column.setting),
    }))
    .filter((column) =>
      column.settings.visible &&
      (fieldAccess === undefined || fieldAccess.includes(column.setting)),
    );

  useEffect(() => {
    if (!open) {
      setCellValues({});
      setEditingRow(null);
      setOpenTransactionTypeRow(null);
      return;
    }

    setCellValues((current) => {
      if (documentReferences.length === 0) return current;

      const loadedValues: Record<string, string> = {};
      const assignedRows = new Set<number>();
      documentReferences.slice(0, rowCount).forEach((reference, referenceIndex) => {
        const docEntry = String(readReferenceDocEntry(reference) ?? "");
        const objectType = String(readReferenceObjectCode(reference) ?? "");
        const savedDocNumber = String(readReferenceDocNumber(reference) ?? "");
        const rowIndices = Array.from({ length: rowCount }, (_, rowIndex) => rowIndex);
        const matchedRowIndex = rowIndices.find(
          (rowIndex) =>
            !assignedRows.has(rowIndex) &&
            current[`${rowIndex}-doc-entry`] === docEntry &&
            current[`${rowIndex}-object-type`] === objectType,
        );
        const index = matchedRowIndex ?? rowIndices.find((rowIndex) => !assignedRows.has(rowIndex)) ?? referenceIndex;
        assignedRows.add(index);
        const transactionType = getTransactionTypeFromObjectType(
          String(readFirstReferenceField(reference, [
            "TransactionType", "TransactionTypeName", "DocumentTypeName", "ObjectTypeName", "DocumentType", "DocType",
          ]) ?? ""),
        ) || getTransactionTypeFromObjectType(objectType);
        const rowKey = `${index}-`;
        const isCurrentReference =
          current[`${rowKey}doc-entry`] === docEntry &&
          current[`${rowKey}object-type`] === objectType;

        loadedValues[`${rowKey}transaction-type`] = isCurrentReference
          ? current[`${rowKey}transaction-type`] || transactionType
          : transactionType;
        loadedValues[`${rowKey}doc-number`] = isCurrentReference
          ? current[`${rowKey}doc-number`] || savedDocNumber || docEntry
          : savedDocNumber || docEntry;
        loadedValues[`${rowKey}external-number`] = isCurrentReference
          ? current[`${rowKey}external-number`] || String(readFirstReferenceField(reference, ["ExtDocNum", "ExternalNumber", "ExternalDocNumber", "NumAtCard"]) ?? "")
          : String(readFirstReferenceField(reference, ["ExtDocNum", "ExternalNumber", "ExternalDocNumber", "NumAtCard"]) ?? "");
        loadedValues[`${rowKey}date`] = isCurrentReference
          ? current[`${rowKey}date`] || toDateInputValue(String(readFirstReferenceField(reference, ["IssueDate", "RefDate", "DocDate", "Date"]) ?? ""))
          : toDateInputValue(String(readFirstReferenceField(reference, ["IssueDate", "RefDate", "DocDate", "Date"]) ?? ""));
        const remark = readFirstReferenceField(reference, [
  "Remark",
  "Remarks",
  "Comments",
  "JournalMemo",
  "Memo",
]);

loadedValues[`${rowKey}remarks`] = String(remark ?? "");
        loadedValues[`${rowKey}doc-entry`] = docEntry;
        loadedValues[`${rowKey}object-type`] = objectType;
      });
      return { ...current, ...loadedValues };
    });
  }, [open, documentReferences, rowCount]);

  
useEffect(() => {
  if (!open) return;

  let cancelled = false;

  const references = (
    JSON.parse(referenceLookupKey) as [
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown,
      unknown
    ][]
  ).map(
    ([
      RefDocEntr,
      RefObjType,
      RefDocNum,
      ExtDocNum,
      IssueDate,
      Remark,
      TransactionType,
    ]) => ({
      RefDocEntr: Number(RefDocEntr),
      RefObjType: String(RefObjType ?? ""),
      RefDocNum: String(RefDocNum ?? ""),
      ExtDocNum: String(ExtDocNum ?? ""),
      IssueDate: String(IssueDate ?? ""),
      Remark: String(Remark ?? ""),
      TransactionType: String(TransactionType ?? ""),
    })
  );

  if (references.length === 0) return;

  
  const hydrateRows = (
    resolvedDocuments: (Record<string, any> | null)[],
    useFallback = false
  ) => {
    if (cancelled) return;

    setCellValues((current) => {
      const hydratedValues = { ...current };
      const assignedRows = new Set<number>();

      references.forEach((reference, referenceIndex) => {
        const index = Array.from({ length: rowCount }, (_, rowIndex) => rowIndex).find(
          (rowIndex) =>
            !assignedRows.has(rowIndex) &&
            hydratedValues[`${rowIndex}-doc-entry`] === String(reference.RefDocEntr) &&
            hydratedValues[`${rowIndex}-object-type`] === String(reference.RefObjType ?? ""),
        );
        if (index === undefined) return;
        assignedRows.add(index);

        const rowKey = `${index}-`;
        const docEntry = String(reference.RefDocEntr);
        const objectType = String(reference.RefObjType ?? "");

        if (
          hydratedValues[`${rowKey}doc-entry`] !== docEntry ||
          hydratedValues[`${rowKey}object-type`] !== objectType
        ) {
          return;
        }

        const document = resolvedDocuments[referenceIndex];

        if (!document) return;

        hydratedValues[`${rowKey}transaction-type`] ||=
          getTransactionTypeFromObjectType(objectType) ||
          getTransactionTypeFromObjectType(document.ObjectCode) ||
          getTransactionTypeFromObjectType(document.TransactionType);

        if (useFallback) {
          hydratedValues[`${rowKey}doc-number`] ||=
            String(document.DocNum ?? docEntry);

          hydratedValues[`${rowKey}external-number`] ||=
            String(document.ExternalNumber ?? "");

          hydratedValues[`${rowKey}date`] ||=
            String(document.RefDate ?? "");

          hydratedValues[`${rowKey}remarks`] ||=
            String(document.Comments ?? "").trim();
        } else {
          hydratedValues[`${rowKey}doc-number`] =
            String(document.DocNum || hydratedValues[`${rowKey}doc-number`] || docEntry);

          hydratedValues[`${rowKey}external-number`] ||=
            String(document.ExternalNumber ?? "");

          hydratedValues[`${rowKey}date`] ||=
            String(document.RefDate ?? "");

          hydratedValues[`${rowKey}remarks`] ||=
            String(document.Comments ?? "").trim();
        }
      });

      return hydratedValues;
    });
  };

  const referencePromise = Promise.allSettled(
    references.map(async (reference) => {
      const transactionType =
        getTransactionTypeFromObjectType(
          String(reference.TransactionType ?? "")
        ) ||
        getTransactionTypeFromObjectType(
          String(reference.RefObjType ?? "")
        );

      const resourceName = transactionResources[transactionType];

      if (resourceName) {
        try {
          const results = await getDocumentsList(
            resourceName,
            0,
            20,
            reference.RefDocNum || String(reference.RefDocEntr)
          );

          const listedDocument = results
            .map(normalizeReferenceDocument)
            .find((document) => {
              const documentEntry = readDocumentField(document, [
                "DocEntry",
                "Entry",
                "DocEntryId",
                "DocumentEntry",
              ]);

              const documentNumber = readDocumentField(document, [
                "DocNum",
                "DocNumber",
                "DocumentNumber",
                "Number",
              ]);

              return (
                documentEntry === String(reference.RefDocEntr) ||
                (!!reference.RefDocNum &&
                  documentNumber === reference.RefDocNum)
              );
            });

          if (listedDocument) return listedDocument;
        } catch (error) {
          console.warn(
            `Could not load referenced ${transactionType} ${reference.RefDocEntr} from the document list.`,
            error
          );
        }
      }

      try {
        const draftData = await getDraftDocument(
          reference.RefDocEntr
        );

        if (!draftData) return null;

        const draftDocument =
          normalizeReferenceDocument(draftData);

        const draftEntry = readDocumentField(draftDocument, [
          "DocEntry",
          "Entry",
          "DocEntryId",
          "DocumentEntry",
        ]);

        if (
          draftEntry &&
          draftEntry !== String(reference.RefDocEntr)
        ) {
          return null;
        }

        const draftTransactionType =
          getTransactionTypeFromObjectType(
            draftDocument.ObjectCode ||
              draftDocument.TransactionType
          );

        if (
          transactionType &&
          draftTransactionType &&
          transactionType !== draftTransactionType
        ) {
          return null;
        }

        return draftDocument;
      } catch (error) {
        console.warn(
          `Could not load draft document ${reference.RefDocEntr}:`,
          error
        );

        return null;
      }
    })
  );

  
  void referencePromise.then((referenceResults) => {
    if (cancelled) return;

    const failedReferenceLookups = referenceResults.flatMap(
      (result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to load saved reference document ${references[index].RefDocEntr}:`,
            result.reason
          );

          return [references[index].RefDocEntr];
        }

        return [];
      }
    );

    const resolvedDocuments = referenceResults.map((result) =>
      result.status === "fulfilled"
        ? result.value
        : null
    );

    hydrateRows(resolvedDocuments);

    if (failedReferenceLookups.length > 0) {
      console.warn(
        "Some reference document lookup attempts failed; draft fallback will be used."
      );
    }
  });
  const draftsPromise = Promise.allSettled([
    getAllDrafts(),
    getAllDraftDocs(),
  ]);

  void draftsPromise.then((draftResults) => {
    if (cancelled) return;

    const draftDocuments = draftResults.flatMap((result) =>
      result.status === "fulfilled"
        ? result.value
        : []
    );

    const failedResources = draftResults.flatMap(
      (result, index) => {
        if (result.status !== "rejected") return [];

        const resource =
          index === 0 ? "drafts" : "draftsdocs";

        console.error(
          `Failed to load saved reference details (${resource}):`,
          result.reason
        );

        return [resource];
      }
    );

    const normalizedDraftDocuments =
      draftDocuments.map(normalizeReferenceDocument);

    const resolvedDraftDocuments = references.map(
      (reference) => {
        const docEntry = String(reference.RefDocEntr);
        const objectType = String(reference.RefObjType ?? "");

        const transactionType =
          getTransactionTypeFromObjectType(objectType);

        return (
          normalizedDraftDocuments.find((candidate) => {
            const candidateEntry = readDocumentField(
              candidate,
              [
                "DocEntry",
                "Entry",
                "DocEntryId",
                "DocumentEntry",
              ]
            );

            const candidateObjectType = String(
              candidate.ObjectCode ?? ""
            );

            return (
              candidateEntry === docEntry &&
              (
                !candidateObjectType ||
                candidateObjectType.toLowerCase() ===
                  objectType.toLowerCase() ||
                getTransactionTypeFromObjectType(
                  candidateObjectType
                ) === transactionType
              )
            );
          }) ?? null
        );
      }
    );

    hydrateRows(resolvedDraftDocuments, true);

    if (failedResources.length > 0) {
      console.warn(
        `Some saved reference detail sources failed: ${failedResources.join(", ")}`
      );
    }
  });

  return () => {
    cancelled = true;
  };
}, [open, referenceLookupKey]);

  const notifyReferencesChange = (values: Record<string, string>) => {
    const references = Array.from({ length: rowCount }, (_, index) => {
      const docEntry = Number(values[`${index}-doc-entry`]);
      const objectType = values[`${index}-object-type`] ?? "";
      if (!Number.isInteger(docEntry) || docEntry <= 0 || !objectType) return null;

      const reference: DocumentReference = {
        RefDocEntr: docEntry,
        RefObjType: objectType,
        ...(values[`${index}-transaction-type`] && {
          TransactionType: values[`${index}-transaction-type`],
        }),
      };
      const docNumber = Number(values[`${index}-doc-number`]);
      if (Number.isInteger(docNumber) && docNumber >= 0) reference.RefDocNum = docNumber;
      const externalNumber = values[`${index}-external-number`]?.trim();
      const issueDate = values[`${index}-date`]?.trim();
      const remark = values[`${index}-remarks`]?.trim();
      if (externalNumber) reference.ExtDocNum = externalNumber;
      if (issueDate) reference.IssueDate = issueDate;
      if (remark) reference.Remark = remark;
      return reference;
    }).filter((reference): reference is DocumentReference => reference !== null);
    onReferencesChange?.(references);
  };

  const setCellValue = (key: string, value: string) => {
    const nextValues = { ...cellValues, [key]: value };
    setCellValues(nextValues);
    notifyReferencesChange(nextValues);
    onDataChange();
  };

  const openDocumentPicker = async (cellKey: string, selectedTransactionType?: string) => {
    const rowIndex = cellKey.split("-")[0];
    const rowTransactionType =
      selectedTransactionType || cellValues[`${rowIndex}-transaction-type`] || "";
    const transactionType = rowTransactionType || (rowIndex === "0" ? "sales-quotation" : "");
    if (!transactionType) {
      toast.error("Select a Transaction Type before choosing a document.");
      return;
    }
    const pickerTitle = documentPickerTitles[transactionType] || "List of Documents";
    setActiveDocNumberCell(cellKey);
    setDocumentPickerTitle(pickerTitle);
    setDocuments([]);
    setDocumentPickerOpen(true);

    setDocumentsLoading(true);

    try {
      const resourceName = transactionResources[transactionType];
      if (!resourceName) {
        setDocuments([]);
        toast.error(`Document listing is not configured for ${pickerTitle}.`);
        return;
      }

      const results = await getDocumentsList(resourceName, 0, 20);
      const normalized = results.map(normalizeReferenceDocument);
      const matchingDocuments = normalized.filter((document) => {
        const rowCardCode = readDocumentField(document, ["CardCode", "BPCode", "BusinessPartnerCode"]);
        return !cardCode || !rowCardCode || rowCardCode === cardCode;
      });
      const uniqueDocuments = Array.from(
        new Map(
          matchingDocuments.map((document, index) => [
            readDocumentField(document, ["DocEntry", "DocNum"]) || `row-${index}`,
            document,
          ]),
        ).values(),
      );
      setDocuments(uniqueDocuments);
      if (uniqueDocuments.length === 0) {
        toast.info(`No documents found for ${pickerTitle}.`);
      }
    } catch (error) {
      console.error(`Failed to load reference documents for ${transactionType}:`, error);
      setDocuments([]);
      toast.error(`Failed to load ${pickerTitle}.`);
    } finally {
      setDocumentsLoading(false);
    }
  };

  return (
    <div className="w-full overflow-x-hidden rounded-md border border-slate-200">
      <table className="w-full table-fixed border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-neutral-900 text-white">
          <tr>
            <th className="w-9 border border-neutral-700 px-1.5 py-2 font-semibold">
              #
            </th>
            {visibleReferenceColumns.map((column, index) => (
              <th
                key={column.field}
                className={`border border-neutral-700 px-1.5 py-2 font-semibold ${
                  index === 0
                    ? "w-[19%]"
                    : index === 1
                      ? "w-[15%]"
                      : index === 2
                        ? "w-[22%]"
                        : index === 3
                          ? "w-[16%]"
                          : ""
                }`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rowCount }, (_, index) => (
            <tr key={index} className="h-9">
              <td className="border border-slate-200 bg-slate-50 px-2 text-slate-500">
                {index + 1}
              </td>

              {visibleReferenceColumns.map(({ field, settings }) => {
                const key = `${index}-${field}`;
                const isEditable = settings.enable && (index === 0 || editingRow === index);
                const value = cellValues[key] ?? "";

                return (
                  <td
                    key={field}
                    className="min-w-0 border border-slate-200 p-0.5"
                    onDoubleClick={() => {
                      if (index > 0) {
                        setEditingRow(index);
                        setOpenTransactionTypeRow(
                          field === "transaction-type" ? index : null,
                        );
                      }
                    }}
                    title={index > 0 && settings.enable ? "Double-click to edit" : undefined}
                  >
                    {field === "transaction-type" ? (
                      isEditable ? (
                        <Select
                          open={index === 0 ? undefined : openTransactionTypeRow === index}
                          onOpenChange={index === 0 ? undefined : (isOpen) => {
                            setOpenTransactionTypeRow(isOpen ? index : null);
                          }}
                          value={value}
                          onValueChange={(nextValue) => {
                            const nextValues = {
                              ...cellValues,
                              [key]: nextValue,
                              [`${index}-doc-number`]: "",
                              [`${index}-external-number`]: "",
                              [`${index}-date`]: "",
                              [`${index}-remarks`]: "",
                              [`${index}-doc-entry`]: "",
                              [`${index}-object-type`]: "",
                            };
                            setCellValues(nextValues);
                            notifyReferencesChange(nextValues);
                            onDataChange();
                            if (index > 0) setOpenTransactionTypeRow(null);
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
                      isEditable ? (
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
                        value={value}
                        onChange={(event) =>
                          setCellValue(key, event.target.value)
                        }
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
        onSelect={(selectedDocument) => {
          if (activeDocNumberCell) {
            const rowIndex = activeDocNumberCell.split("-")[0];
            const selected = normalizeReferenceDocument(selectedDocument);
            const transactionType =
              cellValues[`${rowIndex}-transaction-type`] ||
              (rowIndex === "0" ? "sales-quotation" : "");
            const docEntry = readDocumentField(selected, ["DocEntry", "Entry", "DocEntryId"]);
            const objectType = getReferenceObjectType(transactionType, String(selected.ObjectCode ?? ""));
            const nextValues = {
              ...cellValues,
              [`${rowIndex}-doc-number`]: selected.DocNum,
              [`${rowIndex}-external-number`]: selected.ExternalNumber,
              [`${rowIndex}-date`]: selected.RefDate,
              [`${rowIndex}-remarks`]: selected.Comments,
              [`${rowIndex}-doc-entry`]: docEntry,
              [`${rowIndex}-object-type`]: objectType,
            };
            setCellValues(nextValues);
            notifyReferencesChange(nextValues);
            onDataChange();
          }
          setDocumentPickerOpen(false);
        }}
        data={documents}
        columns={[
          { key: "DocNum", label: "#" },
          { key: "DisplayDate", label: "Date" },
          { key: "CardName", label: "Customer" },
          { key: "PriceMode", label: "Price Mode" },
          { key: "Comments", label: "Remarks" },
        ]} 
        getSelectValue={(document) => document}
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
  documentType,
  fieldAccess,
  documentReferences = EMPTY_DOCUMENT_REFERENCES,
  onReferencesChange,
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
                open={open}
                cardCode={cardCode}
                documentType={documentType}
                fieldAccess={fieldAccess}
                documentReferences={documentReferences}
                onDataChange={() => setHasChanges(true)}
                onReferencesChange={onReferencesChange}
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
