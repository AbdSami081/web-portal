export const taxcCodeGrp = [
  { Value: "SE", Title: "AU Sales - Export Supplier", Rate: 0 },
  { Value: "S2", Title: "AU Sales - GST Exempt/GST Free", Rate: 0 },
  { Value: "S1", Title: "AU Sales - GST Lable", Rate: 10 },
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
];

export const uomOptions = ["kg", "Manual", "Media", "Paper"];

export function calculateFreightTax(amount: number, taxCode: string): { rate: number; taxAmount: number } {
  const tax = taxcCodeGrp.find(t => t.Value === taxCode);
  const rate = Number(tax?.Rate || 0);
  const taxAmount = (amount * rate) / 100;

  return {
    rate,
    taxAmount: Number(taxAmount.toFixed(2))
  };
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
