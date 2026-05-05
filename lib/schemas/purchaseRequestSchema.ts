import { z } from "zod";

export const purchaseRequestSchema = z.object({
  Requester: z.string().min(1, "Requester is required"),
  RequesterName: z.string().optional(),
  Branch: z.string().optional(),
  Department: z.string().optional(),

  DocDate: z.string(),
  DocDueDate: z.string(), // Valid Until
  TaxDate: z.string(), // Document Date
  RequiredDate: z.string().optional(),

  DocumentLines: z.array(
    z.object({
      ItemCode: z.string().optional(),
      LineVendor: z.string().optional(),
      RequiredDate: z.string().optional(),
      Quantity: z.number().min(0.01, "Quantity must be greater than 0"),
      Price: z.number().optional(),
      DiscountPercent: z.number().optional(),
      TaxCode: z.string().optional(),
      LineTotal: z.number().optional(),
      UoMCode: z.string().optional(),
      CountryOrg: z.string().optional(),
    })
  ).optional(),

  Freight: z.number().optional(),
  Rounding: z.number().optional(),
  DiscountPercent: z.number().optional(),
  TaxTotal: z.number().optional(),
  TotalBeforeDiscount: z.number().optional(),
  DocTotal: z.number().optional(),
  Comments: z.string().optional(),
  OwnerCode: z.number().optional(),
  DocStatus: z.string().optional(),
});

export type PurchaseRequestFormData = z.infer<typeof purchaseRequestSchema>;
