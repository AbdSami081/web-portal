import { DocumentType } from "@/types/master/DocumentType";

// Posted, GL-affecting document types are locked to remarks/attachments-only once
// created, matching SAP's real behavior. Pre-posting documents (Quotations, Orders,
// Deliveries, Goods Receipt/Issue, Returns Requests) stay fully editable.
const POSTED_SALES_DOC_TYPES = [
  DocumentType.ARInvoice,
  DocumentType.CreditMemo,
  DocumentType.ARCreditMemo,
  DocumentType.DownPaymentInvoice,
  DocumentType.ARDownPaymentInvoice,
];

const POSTED_PURCHASE_DOC_TYPES = [
  DocumentType.APInvoice,
  DocumentType.APCreditMemo,
  DocumentType.APDownPaymentInvoice,
];

export const isPostedSalesDocType = (docType: DocumentType): boolean =>
  POSTED_SALES_DOC_TYPES.includes(docType);

export const isPostedPurchaseDocType = (docType: DocumentType): boolean =>
  POSTED_PURCHASE_DOC_TYPES.includes(docType);
