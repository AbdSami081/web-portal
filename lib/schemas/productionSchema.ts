import { z } from "zod";

export const productionLineSchema = z.object({
    ItemNo: z.string().min(1, "Item No is required"),
    ItemName: z.string().optional(),
    PlannedQuantity: z.number().min(0, "Quantity must be at least 0"),
    Warehouse: z.string().optional(),
    ItemType: z.string().optional(),
    BaseQuantity: z.number().optional(),
    BaseRatio: z.number().optional(),
    IssuedQuantity: z.number().optional(),
    AvailableQuantity: z.number().optional(),
    UoMCode: z.string().optional(),
    ProductionOrderIssueType: z.enum(["im_Manual", "im_Backflush"]).optional(),
    OrderNumber: z.number().optional(),
    LineNumber: z.number().optional(),
    BaseType: z.number().optional(),
    BaseEntry: z.number().optional(),
    BaseLine: z.number().optional(),
});

export const productionSchema = z.object({
    DocNum: z.number().optional(),
    DocEntry: z.number().optional(),
    AbsoluteEntry: z.number().optional(),
    CardCode: z.string().optional(),
    CardName: z.string().optional(),
    DocDate: z.string(),
    DocDueDate: z.string(),
    TaxDate: z.string().optional(),
    Status: z.string().optional(),
    ProductionOrderType: z.string().optional(),
    ProductionOrderStatus: z.string().optional(),
    Comments: z.string().optional(),
    JournalMemo: z.string().optional(),
    PickRmrk: z.string().optional(),
    Warehouse: z.string().optional(),
    ItemNo: z.string().optional(),
    ProductDescription: z.string().optional(),
    PlannedQuantity: z.number().optional(),
    Priority: z.number().optional(),
    StartDate: z.string().optional(),
    DocumentLines: z.array(productionLineSchema).min(1, "At least one line is required"),
});

export type ProductionFormData = z.infer<typeof productionSchema>;
