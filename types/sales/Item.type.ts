export type Item = {
  ItemCode: string;
  ItemDescription?: string;
  ItemName?: string;
  ItemType?: "itItems" | "itLabor" | "itTravel" | "itFixedAssets";
  ItemsGroupCode?: number;
  InventoryItem?: "tYES" | "tNO";
  SalesItem?: "tYES" | "tNO";
  PurchaseItem?: "tYES" | "tNO";
  UoMGroupEntry?: number;
  BarCode?: string;
  VatLiable?: "tYES" | "tNO";
  PriceList?: number;
  ManageSerialNumbers?: "tYES" | "tNO";
  ManageBatchNumbers?: "tYES" | "tNO";
  Valid?: "tYES" | "tNO";
  Frozen?: "tYES" | "tNO";
  User_Text?: string;
  OnHand?: number;
  VatGourpSa?: string;
  VatGourpPu?: string; 
  Category?: string; 
  Prices?: {
    PriceList: number;
    PriceAmount: number; 
    Currency: string;
  }[];

  [key: string]: any;
};

export type ItemGroup = {
  ItmsGrpCod: number;
  ItmsGrpNam: string;
};
export type UserDefinedField = {
  Name: string;
  Type: string;
  Description: string;
  Length: number;
  Mandatory: boolean;
};
