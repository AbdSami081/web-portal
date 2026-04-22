import { z } from "zod";

export const productionOrderSchema = z.object({
    ItemNo: z.string().nullable().optional(),
    ProductDescription: z.string().nullable().optional(),
    PlannedQuantity: z.number().nullable().optional(),
    Warehouse: z.string().nullable().optional(),
    Priority: z.number().nullable().optional(),
    StartDate: z.string().nullable().optional(),
    CreationDate: z.string().nullable().optional(),
    DueDate: z.string().nullable().optional(),
    Comments: z.string().nullable().optional(),
    Remarks: z.string().nullable().optional(),
    PickRmrk: z.string().nullable().optional(),
    AbsoluteEntry: z.number().nullable().optional(),
    PostingDate: z.string().nullable().optional(),
    ProductionOrderType: z.string().nullable().optional(),
    ProductionOrderStatus: z.string().nullable().optional(),
});

export type ProductionOrderFormData = z.infer<typeof productionOrderSchema>;
