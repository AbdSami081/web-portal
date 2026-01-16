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
      Quantity: z.number(),
      Price: z.number(),
      WarehouseCode: z.string().optional(),
      TaxCode: z.string().optional(),
      LineTotal: z.number().optional(),
      BaseType: z.number().optional(),
      BaseEntry: z.number().optional(),
      BaseLine: z.number().optional(),
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
