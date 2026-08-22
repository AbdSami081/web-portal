// File: types/sap/salesDocuments.ts

export interface BaseSalesDocument {
  DocEntry?: number;
  DocNum?: number;
  DocType?: string;
  DocumentStatus?: "bost_Open" | "bost_Close" | "bost_Cancel";
  DocObjectCode?: string;
  DocDate: string;
  DocDueDate: string;
  TaxDate?: string | null;
  CardCode: string;
  CardName?: string;
  NumAtCard?: string;
  Comments?: string;
  BPL_IDAssignedToInvoice?: number;
  BPLId?: number;
  DiscSum?: number;
  DocTotal?: number;
  DocTotalFc?: number;
  DocTotalSys?: number;
  DocCurrency?: string;
  DocRate?: number;
  Reference1?: string;
  Reference2?: string;
  Address: string;
  Address2?: string;
  SalesPersonCode?: number;
  ContactPersonCode?: number;
  DocumentLines: SalesDocumentLine[];
  DocumentLineAdditionalExpenses?: {
    ExpenseCode: number;
    LineTotal: number;
    TaxCode?: string;
    VatGroup?: string;
    Remarks?: string;
  }[];
}

export type DocCurrency =
  | "USD"
  | "EUR"
  | "INR"
  | "SGD"
  | "MYR"
  | "THB"
  | "IDR"
  | "PHP"
  | "VND"
  | "CNY";

export interface SalesDocumentLine {
  LineNum?: number; // ← Optional during creation, required during update
  ItemCode: string;
  ItemName?: string;
  ItemDescription?: string;
  ManSerNum?: string;
  ManBtchNum?: string;
  SerialNumbers?: { InternalSerialNumber: string }[];
  BatchNumbers?: { BatchNumber: string; Quantity: number }[];
  Quantity: number;
  OnHand: number;
  Price: number;
  DiscountPercent?: number;
  WarehouseCode?: string;
  BPLid?: number;
  UoMCode?: string;
  MeasureUnit?: string;
  QtyInWhs?: any[];
  TaxCode?: string; // Added TaxCode
  TaxType?: string; // Added TaxType
  TaxRate?: number;
  LineTotal?: number;
  TaxAmount?: number;
  InStockQty?: number;
  CommittedQty?: number;
  OrderedQty?: number;
  IsClosed?: string; // "tYES" | "tNO"
  LineStatus?: "bost_Open" | "bost_Close"; 

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

export interface SalesQuotation extends BaseSalesDocument {
  SalesPersonCode?: number;
  ValidUntil?: string;
}

export interface SalesOrder extends BaseSalesDocument {
  SalesPersonCode?: number;
  PaymentGroupCode?: number;
}

export interface DeliveryNote extends BaseSalesDocument {
  TrackingNumber?: string;
}

export interface ARInvoice extends BaseSalesDocument {
  PaymentReference?: string;
  JournalMemo?: string;
}

export type SelectedItem = {
  ItemCode: string;
  ItemName?: string;
  UoMCode?: string;
  Price?: number;
  TaxCode?: string;
  TaxRate?: number;
  LineTotal?: number;
  DiscountPercent?: number;
  TaxAmount?: number;
};

