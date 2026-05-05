export enum PurchaseDocumentType {
  PurchaseRequest = 1470000113,
  PurchaseQuotation = 54,
  PurchaseOrder = 22,
  GoodsReceiptPO = 20,
  APInvoice = 18
}

export interface BasePurchaseDocument {
  DocEntry?: number;
  DocNum?: number;
  DocType?: string; 
  DocumentStatus?: "bost_Open" | "bost_Close" | "bost_Cancel";
  DocObjectCode?: string;
  DocDate: string; 
  DocDueDate: string; 
  TaxDate?: string | null; 
  RequriedDate?: string | null; 

  Requester?: string;
  RequesterName?: string;
  Branch?: string;
  Department?: string;
  
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
  ItemCode?: string;
  ItemDescription?: string;
  LineVendor?: string;
  RequiredDate?: string;
  Quantity: number;
  Price: number;
  DiscountPercent?: number;
  TaxCode?: string;
  LineTotal?: number;
  UoMCode?: string;
  CountryOrg?: string;

  U_FBRUom?: string;
  U_FBRQty?: number;
  U_FBRRate?: number;
  U_FBRLneTotal?: number;
  U_FBRSalesTax?: number;

  BaseType?: number;
  BaseEntry?: number;
  BaseLine?: number;
}

export interface PurchaseRequest extends BasePurchaseDocument {

}
