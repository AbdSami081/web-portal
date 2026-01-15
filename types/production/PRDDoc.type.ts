// export interface BaseProductionDocument {
//     AbsoluteEntry?: number;
//     DocumentNumber?: number;
//     Series?: number;
//     ItemNo?: string;
//     ProductionOrderStatus?: string;
//     ProductionOrderType?: string;
//     PlannedQuantity?: number;
//     CompletedQuantity?: number;
//     RejectedQuantity?: number;
//     PostingDate?: string;
//     DueDate?: string;
//     ProductionOrderOriginEntry?: number | null;
//     ProductionOrderOriginNumber?: number | null;
//     ProductionOrderOrigin?: string;
//     UserSignature?: number;
//     Remarks?: string | null;
//     ClosingDate?: string | null;
//     ReleaseDate?: string | null;
//     CustomerCode?: string | null;
//     Warehouse?: string;
//     InventoryUOM?: string | null;
//     JournalRemarks?: string;
//     TransactionNumber?: number | null;
//     CreationDate?: string;
//     Printed?: string;
//     DistributionRule?: string;
//     Project?: string;
//     DistributionRule2?: string;
//     DistributionRule3?: string;
//     DistributionRule4?: string;
//     DistributionRule5?: string;
//     UoMEntry?: number;
//     StartDate?: string;
//     ProductDescription?: string;
//     Priority?: number;
//     RoutingDateCalculation?: string;
//     UpdateAllocation?: string;
//     SAPPassport?: string | null;
//     AttachmentEntry?: number | null;
//     PickRemarks?: string | null;

//     // Arrays
//     ProductionOrderLines?: PRDDocumentLine[];
//     ProductionOrdersSalesOrderLines?: any[];
//     ProductionOrdersStages?: any[];
//     ProductionOrdersDocumentReferences?: any[];
// }

// export interface PRDDocumentLine {
//     DocumentAbsoluteEntry?: number;
//     LineNumber?: number;
//     ItemNo: string;
//     BaseQuantity?: number;
//     PlannedQuantity: number;
//     IssuedQuantity?: number;
//     ProductionOrderIssueType?: string;
//     Warehouse?: string;
//     VisualOrder?: number;

//     DistributionRule?: string | null;
//     LocationCode?: string | null;
//     Project?: string | null;
//     DistributionRule2?: string | null;
//     DistributionRule3?: string | null;
//     DistributionRule4?: string | null;
//     DistributionRule5?: string | null;

//     UoMEntry?: number;
//     UoMCode?: number;
//     WipAccount?: string | null;
//     ItemType?: string;
//     LineText?: string | null;
//     AdditionalQuantity?: number;
//     ResourceAllocation?: any;
//     StartDate?: string;
//     EndDate?: string;
//     StageID?: number | null;
//     RequiredDays?: number;
//     ItemName?: string;

//     WeightOfRecycledPlastic?: number | null;
//     PlasticPackageExemptionReason?: string | null;

//     SerialNumbers?: any[];
//     BatchNumbers?: any[];
// }
export interface BaseProductionDocument {
    Series: number;
    ProductionOrderLines?: PRDDocumentLine[];  
}

export interface PRDDocumentLine {
    ItemNo: string;
    ItemName?: string;
    PlannedQuantity: number;
    Warehouse?: string;
    ItemType?: number;
}