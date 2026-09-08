export enum PurchaseDocumentType {
  PurchaseRequests = 1470000113,
  PurchaseQuotation = 54,
  PurchaseOrder = 22,
  GoodsReceiptPO = 20,
  APInvoice = 18,
  APReserveInvoice = 18,
  APCreditMemo = 19,
  GoodsReturn = 21,
  APDownPaymentInvoice = 204,
  GoodsReturnRequest = 234000032,
  APDownPaymentRequest = 1470000113,
}

export interface BasePurchaseDocument {
  DocEntry?: number;
  DocNum?: number;
  DocType?: string; 
  DocumentStatus?: "bost_Open" | "bost_Close" | "bost_Cancel";
  DocStatus?: "bost_Open" | "bost_Close" | "bost_Cancel";
  DocObjectCode?: string;
  DocDate: string; 
  DocDueDate: string; 
  TaxDate?: string | null; 
  RequriedDate?: string | null; 
  CardCode?: string;
  CardName?: string;
  ContactPersonCode?: string;
  Address2?: string;
  Address?: string;
  BPL_IDAssignedToInvoice?: number;
  BPLId?: number;
  Requester?: string;
  RequesterName?: string;
  RequesterEmail?: string;
  SendNotification?: string;
  Branch?: string;
  Department?: string;
  RequiredDate?: string;
  Comments?: string;
  DiscSum?: number;
  DiscountPercent?: number;
  DocTotal?: number;
  DocCurrency?: string;
  OwnerCode?: number;

  DocumentLines: PurchaseDocumentLine[];
  DocumentLineAdditionalExpenses?: {
    ExpenseCode: number;
    LineTotal: number;
    TaxCode?: string;
    VatGroup?: string;
    Remarks?: string;
  }[];
}

export interface PurchaseDocumentLine {
  LineNum?: number;
  ItemCode: string;
  ItemName?: string;
  ItemDescription?: string;
  ManSerNum?: string;
  ManBtchNum?: string;
  SerialNumbers?: { InternalSerialNumber: string }[];
  BatchNumbers?: { BatchNumber: string; Quantity: number }[];
  Quantity: number;
  Price: number;
  OnHand: number;
  QtyInWhs?: any[];
  DiscountPercent?: number;
  WarehouseCode?: string;
  BPLid?: number;
  RequiredDate?: string;
  UoMCode?: string;
  TaxCode?: string;
  TaxType?: string;
  TaxRate?: number;
  LineTotal?: number;
  TaxAmount?: number;
  InStockQty?: number;
  Requester?: string;
  CommittedQty?: number;
  OrderedQty?: number;
  IsClosed?: string;

  InvQty?: number;
  TotalDoc?: number;
  PackageQuantity?: number;
  CountryOrg?: string;
  CogsOcrCo2?: string;
  CogsOcrCo3?: string;
  CogsOcrCo4?: string;
  BlanketAgreementNo?: string;
  LinePoPrss?: boolean;
  U_LastPrice?: number;
  U_OQCR?: string;
  U_OQDC?: number;
  U_LPP2?: number;
  U_ExtraTax?: number;
  U_FurtherTax?: number;
  U_FixedRetailPrice?: number;
  U_SaleType?: number;
  U_SroScheduleNo?: string;
  U_SroSerialItem?: string;

  Freight1Type?: string;
  Freight1Amount?: number;
  Freight1LCAmount?: number;
  Freight1TaxGroup?: string;
  Freight1TaxRate?: number;
  Freight1TaxAmount?: number;
  Freight1TaxLCAmount?: number;

  Freight2Type?: string;
  Freight2Amount?: number;
  Freight2LCAmount?: number;
  Freight2TaxGroup?: string;
  Freight2TaxRate?: number;
  Freight2TaxAmount?: number;
  Freight2TaxLCAmount?: number;

  Freight3Type?: string;
  Freight3Amount?: number;
  Freight3LCAmount?: number;
  Freight3TaxGroup?: string;
  Freight3TaxRate?: number;
  Freight3TaxAmount?: number;
  Freight3TaxLCAmount?: number;
  BaseType?: number;
  BaseEntry?: number;
  BaseLine?: number;
}

export interface PurchaseRequest extends BasePurchaseDocument {}
