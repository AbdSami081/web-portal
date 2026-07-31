// File: lib/schemas/quotationSchema.ts
import { z } from "zod";

export const quotationSchema = z.object({
  CardCode: z.string().min(1, "Customer is required"),
  CardName: z.string().optional(),
  DocDate: z.string(),
  DocDueDate: z.string(),
  TaxDate: z.string(),
  DocumentLines: z.array(
    z.object({
      ItemCode: z.string(),
      Quantity: z.coerce.number(),   
      Price: z.coerce.number(), 
      WarehouseCode: z.string().optional(),
      TaxCode: z.string().optional(),
      LineTotal: z.coerce.number().optional(),
      BaseType: z.coerce.number().nullable().optional(),
      BaseEntry: z.coerce.number().nullable().optional(),
      BaseLine: z.coerce.number().nullable().optional(),
    })
  ),
  Freight: z.number().optional(),
  Rounding: z.number().optional(),
  DiscountPercent: z.number().optional(),
  TaxTotal: z.number().optional(),
  TotalBeforeDiscount: z.number().optional(),
  DocTotal: z.number().optional(),
  Comments: z.string().optional(),
  DocStatus: z.string().optional(),
});

export type QuotationFormData = z.infer<typeof quotationSchema>;
