export type BusinessPartner = {
  CardCode: string;
  CardName: string;
  CardType?: "cCustomer" | "cSupplier" | "cBoth";
  GroupCode?: number;
  DocumentStatus?:string;
  Address?: string;
  City?: string;
  State?: string;
  ZipCode?: string;
  Country?: string;
  Phone1?: string;
  Phone2?: string;
  Fax?: string;
  Email?: string;
  Website?: string;
  ContactPerson?: string; // Optional
  Notes?: string; // Optional
  Balance?: number; // Optional
  Currency?: string;
  PriceListNum?: number;
};
