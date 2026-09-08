export interface BaseInventoryDocument {
    DocType?: string;
    CardCode: string;
    CardName?: string;
    TaxDate?: string;
    Series?: string;
    GroupNum?: string;
    JrnlMemo?: string;
    Comments?: string;
    DocumentLines?: InventoryDocumentLine[];
}

export interface InventoryDocumentLine {
    ItemCode: string;
    Dscription?: string;
    FromWhsCode?: string;
    FromBinLoc?: string;
    WhsCode?: string;
    BPLid?: number;
    ToBinLoc?: string;
    FisrtBin?: string;
    Quantity: number;
    OnHand?: number;
    ItemCost?: number;
    UoMCode?: string;
    unitMsr?: string;
    MeasureUnit?: string;
    RemainingOpenQuantity?: number;
    QtyInWhs?: any[];
    OcrCode2?: string;
    OcrCode3?: string;
    OcrCode4?: string;
    PlPaWght?: number;
    U_LastPrice?: number;
    PPTaxExRe?: string;
    U_OQCR?: string;
    U_OQDC?: string;
    U_LPP2?: number;
    U_FBRQty?: number;
    U_SaleType?: string;
    U_FurtherTax?: number;
    LineNum?: number;
    BaseType?: number;
    BaseEntry?: number;
    BaseLine?: number;
    LineTotal?: number;
    SerialNumbers?: any[];
    BatchNumbers?: any[];
    ManSerNum?: string;
    ManBtchNum?: string;
}
