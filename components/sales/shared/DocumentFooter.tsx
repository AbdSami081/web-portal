import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/sap/helpers/currencyFormatter";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { useSalesDocConfig } from "./SalesDocumentLayout";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

export default function DocumentFooter() {
  const { watch } = useFormContext();
  const {
    DocTotal,
    TaxTotal,
    lines,
    TotalBeforeDiscount,
    freight = 0,
    rounding = 0,
    discountPercent = 0,
    setFreight,
    setRounding,
    setDiscountPercent,
    setTaxTotal,
    setComments
  } = useSalesDocument();

  const docStatus = watch("DocStatus");
  const docEntry = watch("DocEntry");
  const isLoadedDocument = docEntry && Number(docEntry) > 0;
  const isFooterDisabled = isLoadedDocument && docStatus === "bost_Close";



  return (
    <>
      <div className={`flex items-center gap-4 mt-10`}>
      </div>

      <div className="grid grid-cols-2 gap-20">
        <div>
          <Label htmlFor="Comments">Remarks</Label>
          <Textarea
            id="Comments"
            className="h-24 mt-4 max-w-95"
            {...useFormContext().register("Comments")}
            onChange={(e) => {
              useFormContext().setValue("Comments", e.target.value);
              setComments(e.target.value);
            }}
            placeholder="Enter remarks or comments..."
            disabled={docStatus === "bost_Close"}
          />
        </div>

        <div className={`space-y-3 bg-slate-100 p-4 rounded-lg text-sm -mt-12`}>
          <div className="grid grid-cols-2 gap-2 items-center">
            <Label>Freight</Label>
            <Input
              type="number"
              className="h-6 text-right"
              value={freight}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <Label>Rounding</Label>
            <Input
              type="number"
              className="h-6 text-right"
              value={rounding}
              onChange={(e) => setRounding(Number(e.target.value))}
              disabled={isFooterDisabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <Label>Discount (%)</Label>
            <Input
              type="number"
              className="h-6 text-right"
              value={discountPercent}
              onChange={(e) => {
                const value = Number(e.target.value);

                if (value > 100) {
                  toast.error("Discount cannot exceed 100%.");
                }

                setDiscountPercent(Math.min(value, 100));
              }}
              disabled={isFooterDisabled}
            />
          </div>

          <div className="border-t border-gray-300 pt-4 text-right space-y-1">
            <div className="flex justify-between font-medium">
              <span>Total Before Discount:</span>
              <span>{formatCurrency(TotalBeforeDiscount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Tax:</span>
              <span>{formatCurrency(TaxTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Document Total:</span>
              <span>{formatCurrency(DocTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
