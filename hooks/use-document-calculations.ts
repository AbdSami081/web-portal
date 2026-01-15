// import { useFormContext, useWatch } from "react-hook-form";
// import { useDeepCompareMemo } from "use-deep-compare";
// import { SalesDocumentLine } from "~/types/sales/salesDocuments.type";
// import { useMasterDataStore } from "~/stores/useMasterDataStore";

// export function useDocumentCalculations() {
//   const { control } = useFormContext();

//   // Watch all document lines
//   const lines: SalesDocumentLine[] = useWatch({
//     control,
//     name: "DocumentLines",
//   }) || [];

//   // Pull tax code definitions from master data
//   const { taxCodes } = useMasterDataStore();

//   // Create a quick lookup map
//   const taxCodeMap = useDeepCompareMemo(() => {
//     const map = new Map<string, number>();
//     for (const tax of taxCodes) {
//       map.set(tax.Code, Number(tax.Rate) || 0);
//     }
//     return map;
//   }, [taxCodes]);

//   // Main totals computation
//   return useDeepCompareMemo(() => {
//     let totalBeforeDiscount = 0;
//     let totalTax = 0;
//     let total = 0;

//     for (const line of lines) {
//       const qty = Number(line.Quantity) || 0;
//       const price = Number(line.Price) || 0;
//       const discount = Number(line.DiscountPercent) || 0;
//       const taxCode = line.TaxCode || "";
//       const taxRate = taxCodeMap.get(taxCode) || 0;

//       const lineAmount = qty * price;
//       const discountAmount = (lineAmount * discount) / 100;
//       const taxableAmount = lineAmount - discountAmount;
//       const tax = (taxableAmount * taxRate) / 100;
//       const lineTotal = taxableAmount + tax;

//       totalBeforeDiscount += lineAmount;
//       totalTax += tax;
//       total += lineTotal;
//     }

//     return {
//       totalBeforeDiscount: Number(totalBeforeDiscount.toFixed(2)),
//       totalTax: Number(totalTax.toFixed(2)),
//       total: Number(total.toFixed(2)),
//     };
//   }, [lines, taxCodeMap]);
// }

import { useEffect } from "react";
import { useDebouncedCallback } from "./use-debounced-callback";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { SalesDocumentLine } from "@/types/sales/salesDocuments.type";

export function useDocumentCalculations() {
  const {
    lines,
    setTotals,
    freight = 0,
    rounding = 0,
    discountPercent = 0,
  } = useSalesDocument((state) => ({
    lines: state.lines,
    freight: state.freight,
    rounding: state.rounding,
    discountPercent: state.discountPercent,
    setTotals: state.setCalculatedTotals,
  }));

  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    lines.forEach((line: SalesDocumentLine) => {
      const qty = Number(line.Quantity) || 0;
      const price = Number(line.Price) || 0;
      const discount = Number(line.DiscountPercent || 0);
      const tax = Number(line.TaxAmount || 0);

      const lineAmount = qty * price * (1 - discount / 100);
      subtotal += lineAmount;
      taxTotal += tax;
    });

    const discountAmt = subtotal * (discountPercent / 100);
    const totalBeforeDiscount = subtotal;
    const docTotal = subtotal - discountAmt + taxTotal + freight + rounding;

    setTotals({
      TotalBeforeDiscount: parseFloat(totalBeforeDiscount.toFixed(2)),
      TaxTotal: parseFloat(taxTotal.toFixed(2)),
      DiscountAmt: parseFloat(discountAmt.toFixed(2)),
      DocTotal: parseFloat(docTotal.toFixed(2)),
    });
  };

  // Debounced calc for performance (especially when editing multiple rows quickly)
  const debouncedCalc = useDebouncedCallback(calculateTotals, 200);

  useEffect(() => {
    debouncedCalc();
  }, [lines, freight, rounding, discountPercent]);
}
