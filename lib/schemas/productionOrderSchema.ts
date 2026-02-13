import { z } from "zod";

export const productionOrderSchema = z.object({
    ItemNo: z.string().optional(),
    ProductDescription: z.string().optional(),
    PlannedQuantity: z.number().optional(),
    Warehouse: z.string().optional(),
    Priority: z.number().optional(),
    StartDate: z.string().optional(),
    CreationDate: z.string().optional(),
    DueDate: z.string().optional(),
    Comments: z.string().optional(),
    AbsoluteEntry: z.number().optional(),
});

export type ProductionOrderFormData = z.infer<typeof productionOrderSchema>;
