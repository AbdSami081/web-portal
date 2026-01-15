export type VatGroup = {
  Code: string; // Code of the VAT group
  Name: string; // Name of the VAT group
  Category: string; // Category of the VAT group
  InActive: boolean; // Indicates if the VAT group is inactive
  VatGroups_Lines: Array<{
    Effectivefrom: number; // Line number of the VAT group line
    Rate: number; // VAT group code for the line
    EqualizationTax: number; // VAT percentage for the line
    DatevCode: string; // Datev code for the line
  }>;
};