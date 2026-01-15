export type Item = {
  ItemCode: string;
  ItemDescription?: string;
  ItemName?: string;
  ItemType?: "itItems" | "itLabor" | "itTravel" | "itFixedAssets"; // Enum
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

  // Optional: Add more fields as needed
  // Custom fields / UDFs
  [key: string]: any; // Allow UDFs like U_MyCustomField
};

export type ItemGroup = {
  ItmsGrpCod: number;
  ItmsGrpNam: string;
};
export type UserDefinedField = {
  Name: string;
  Type: string; // e.g., "db_Alpha", "db_Numeric", etc.
  Description: string;
  Length: number;
  Mandatory: boolean;
};
