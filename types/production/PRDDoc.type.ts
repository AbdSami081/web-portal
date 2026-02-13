export interface BaseProductionDocument {
    Series: number;
    AbsoluteEntry?: number;
    DocumentNumber?: number;
    ItemNo?: string;
    ProductionOrderStatus?: string;
    ProductionOrderType?: string;
    PlannedQuantity?: number;
    CompletedQuantity?: number;
    RejectedQuantity?: number;
    PostingDate?: string;
    DueDate?: string;
    Remarks?: string | null;
    Warehouse?: string;
    StartDate?: string;
    ProductDescription?: string;
    Priority?: number;
    CreationDate?: string;
    ProductionOrderLines?: PRDDocumentLine[];
}

export interface PRDDocumentLine {
    ItemNo: string;
    ItemName?: string;
    PlannedQuantity: number;
    Warehouse?: string;
    ItemType?: string;
    BaseQuantity?: number;
    BaseRatio?: number;
    IssuedQuantity?: number;
    AvailableQuantity?: number;
    UoMCode?: string;
    ProductionOrderIssueType?: "im_Manual" | "im_Backflush";
}
