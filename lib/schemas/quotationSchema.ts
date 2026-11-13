
import { z } from "zod";

export const quotationSchema = z.object({
  CardCode: z.string().min(1, "Customer is required"),
  CardName: z.string().nullish(),

  DocDate: z.string(),
  DocDueDate: z.string(),
  TaxDate: z.string(),
  BranchRegNo: z.string().nullish(),

  // Logistics
  ShipToCode: z.string().nullish(),
  PayToCode: z.string().nullish(),
  ShipToAddress: z.string().nullish(),
  BillToAddress: z.string().nullish(),
  AddressExtension: z.any().optional(),

  TransportationCode: z.union([z.coerce.number(), z.string()]).nullish(),
  LanguageCode: z.union([z.coerce.number(), z.string()]).nullish(),

  ProcureNonDropShip: z.boolean().optional(),
  ProcureDropShip: z.boolean().optional(),
  Confirmed: z.boolean().optional(),

  BPChannelCode: z.string().nullish(),
  BPChannelContact: z.union([z.coerce.number(), z.string()]).nullish(),

  // Accounting
  JournalMemo: z.string().nullish(),
  PaymentGroupCode: z.coerce.number().nullish(),
  PaymentMethod: z.string().nullish(),

  ManualDueDate: z.string().nullish(),
  ExtraMonth: z.coerce.number().optional(),
  ExtraDays: z.coerce.number().optional(),

  CashDiscountDateOffset: z.coerce.number().nullish(),
  UseShpdGoodsAct: z.boolean().optional(),

  Project: z.string().nullish(),
  QRCodeFrom: z.string().nullish(),
  Indicator: z.string().nullish(),
  FederalTaxID: z.string().nullish(),
  NumAtCard: z.string().nullish(),

  // Referenced document selection
  ReferencedDocument: z.any().optional(),

  DocumentLines: z.array(
    z.object({
      ItemCode: z.string().nullish(),
      Quantity: z.coerce.number().optional(),
      Price: z.coerce.number().optional(),
      WarehouseCode: z.string().nullish(),
      TaxCode: z.string().nullish(),
      LineTotal: z.coerce.number().optional(),
      BaseType: z.coerce.number().nullable().optional(),
      BaseEntry: z.coerce.number().nullable().optional(),
      BaseLine: z.coerce.number().nullable().optional(),
      AccountCode: z.string().nullish(),
      AccountName: z.string().nullish(),
      Description: z.string().nullish(),
    })
  ),

  Freight: z.number().optional(),
  Rounding: z.number().optional(),
  DiscountPercent: z.number().optional(),
  TaxTotal: z.number().optional(),
  TotalBeforeDiscount: z.number().optional(),
  DocTotal: z.number().optional(),
  Comments: z.string().nullish(),
  DocStatus: z.string().nullish(),

  BPL_IDAssignedToInvoice: z.coerce.number().nullish(),
  FatherType: z.string().nullish(),
  FatherCard: z.string().nullish(),
}).loose();

export type QuotationFormData = z.infer<typeof quotationSchema>;
