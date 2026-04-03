export type BusinessPartner = {
  cardCode: string;
  cardName: string;
  cardType?: "cCustomer" | "cSupplier" | "cBoth";
  groupCode?: number;
  documentStatus?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone1?: string;
  phone2?: string;
  fax?: string;
  email?: string;
  website?: string;
  contactPerson?: string; // Optional
  notes?: string; // Optional
  balance: number; // Optional
  currency?: string;
  priceListNum?: number;
};
