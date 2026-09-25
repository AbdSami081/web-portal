import { z } from "zod";

export const quotationSchema = z.object({
  CardCode: z.string().min(1, "Customer is required"),
  CardName: z.string().nullish(),
  DocDate: z.string(),
  DocDueDate: z.string(),
  TaxDate: z.string(),
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
});

export type QuotationFormData = z.infer<typeof quotationSchema>;
