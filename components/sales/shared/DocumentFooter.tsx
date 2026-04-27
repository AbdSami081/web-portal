import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { AppLabel } from "@/components/Custom/AppLabel";
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
    setDiscountSum,
    setTaxTotal,
    setComments,
    TotalFreight = 0,
    discSum = 0
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
          <AppLabel htmlFor="Comments">Remarks</AppLabel>
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
            <AppLabel>Freight</AppLabel>
            <Input
              className="h-6 text-right bg-slate-200"
              value={TotalFreight}
              disabled={true}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <AppLabel>Rounding</AppLabel>
            <Input
              type="number"
              className="h-6 text-right"
              value={rounding}
              onChange={(e) => setRounding(Number(e.target.value))}
              disabled={isFooterDisabled}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <AppLabel>Discount</AppLabel>
            <div className="flex gap-2 items-center">
              <div className="relative flex-[1.5]">
                <Input
                  type="number"
                  className="h-6 text-right pr-6"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  disabled={isFooterDisabled}
                />
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">%</span>
              </div>
              <Input
                type="number"
                className="h-6 text-right flex-[2.5]"
                value={discSum}
                onChange={(e) => setDiscountSum(Number(e.target.value))}
                disabled={isFooterDisabled}
              />
            </div>
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
