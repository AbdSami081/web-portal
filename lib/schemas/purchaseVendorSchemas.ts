import { z } from "zod";

const today = new Date().toISOString().split("T")[0];

const vendorDocBase = z.object({
  CardCode: z.string().optional(),
  CardName: z.string().optional(),
  ContactPersonCode: z.string().optional(),
  discountPercent: z.coerce.number().optional(),
  NumAtCard: z.string().optional(),
  DocDate: z.string().default(today),
  DocDueDate: z.string().default(today),
  TaxDate: z.string().default(today),
  DocStatus: z.string().default("bost_Open"),
  BPL_IDAssignedToInvoice: z.number().optional(),
  Comments: z.string().optional(),
  DocNum: z.number().optional(),
  DocEntry: z.number().optional(),
});

export const purchaseQuotationSchema = vendorDocBase;
export type PurchaseQuotationFormData = z.infer<typeof purchaseQuotationSchema>;

export const purchaseRequestSchema = vendorDocBase;
export type PurchaseRequestFormData = z.infer<typeof purchaseRequestSchema>;

export const purchaseOrderSchema = vendorDocBase;
export type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

export const goodsReceiptPOSchema = vendorDocBase;
export type GoodsReceiptPOFormData = z.infer<typeof goodsReceiptPOSchema>;

export const apInvoiceSchema = vendorDocBase;
export type APInvoiceFormData = z.infer<typeof apInvoiceSchema>;

export const apCreditMemoSchema = vendorDocBase;
export type APCreditMemoFormData = z.infer<typeof apInvoiceSchema>;

export const GoodsReturnSchema = vendorDocBase;
export type GoodsReturnFormData = z.infer<typeof GoodsReturnSchema>;

export const GoodsReturnRequestSchema = vendorDocBase;
export type GoodsReturnRequestFormData = z.infer<typeof GoodsReturnRequestSchema>;

export const APDownPaymentInvoiceSchema = vendorDocBase;
export type APDownPaymentInoviceFormData = z.infer<typeof APDownPaymentInvoiceSchema>;

export const APDownPaymentRequestSchema = vendorDocBase;
export type APDownPaymentRequestFormData = z.infer<typeof APDownPaymentRequestSchema>;
