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

// GoodsReturn and GoodsReceiptPO are included here even though they aren't AR/AP-invoice
// types: SAP rejects line changes on an already-added Purchase Return / GRPO, so
// buildPurchaseDocumentPatchPayload is called with includeLines:false for both (see
// goodsreturn/page.tsx and grpo/new/page.tsx) — the add-item button must stay hidden in
// edit mode to match, otherwise it implies an action that silently gets dropped on save.
const POSTED_PURCHASE_DOC_TYPES = [
  DocumentType.APInvoice,
  DocumentType.APCreditMemo,
  DocumentType.APDownPaymentInvoice,
  DocumentType.GoodsReturn,
  DocumentType.GoodsReceiptPO,
];

export const isPostedSalesDocType = (docType: DocumentType): boolean =>
  POSTED_SALES_DOC_TYPES.includes(docType);

export const isPostedPurchaseDocType = (docType: DocumentType): boolean =>
  POSTED_PURCHASE_DOC_TYPES.includes(docType);
