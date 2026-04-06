export const taxcCodeGrp = [
  { Value: "SE", Title: "AU Sales - Export Supplies", Rate: 0 },
  { Value: "S2", Title: "AU Sales - GST Exempt/GST Free", Rate: 0 },
  { Value: "S1", Title: "AU Sales - GST Liable", Rate: 10 },
  { Value: "GST-EO", Title: "NZ GST - Exempt", Rate: 0 },
  { Value: "GSTO", Title: "NZ GST - Output", Rate: 15 },
  { Value: "GSTO-ZRO", Title: "NZ GST - Zero Rated", Rate: 0 },
  { Value: "S4", Title: "Tax 4%", Rate: 4 },
];

export const freightTypes = [
  { value: "Freight", label: "Freight" },
  { value: "Insurance", label: "Insurance" },
  { value: "Sales Commission", label: "Sales Commission" },
  { value: "Tax", label: "Tax" },
  { value: "Define New", label: "Define New" },
];

export const uomOptions = ["kg", "Manual", "Media", "Paper"];

import { VatGroup } from "@/types/sales/VatGroups.type";

export function calculateFreightTax(
  amount: number,
  taxCode: string,
  vatGroups?: VatGroup[]
): { rate: number; taxAmount: number } {
  // Try static list first as it matches the user's setup
  const staticTax = taxcCodeGrp.find((t) => t.Value === taxCode);
  if (staticTax) {
    const rate = Number(staticTax.Rate || 0);
    const taxAmount = (amount * rate) / 100;
    return { rate, taxAmount: Number(taxAmount.toFixed(2)) };
  }

  // Fallback to dynamic vatGroups if provided
  if (vatGroups) {
    const tax = vatGroups.find((t) => (t.Code || (t as any).code) === taxCode);
    const rate = Number(tax?.VatGroups_Lines?.[0]?.Rate || 0);
    const taxAmount = (amount * rate) / 100;
    return { rate, taxAmount: Number(taxAmount.toFixed(2)) };
  }

  return { rate: 0, taxAmount: 0 };
}

export function calculateLineTax(
  quantity: number,
  price: number,
  discount: number,
  taxRate: number
): number {
  const subtotal = quantity * price;
  const discounted = subtotal * (1 - discount / 100);
  const tax = (discounted * taxRate) / 100;

  return Number(tax.toFixed(2));
}
