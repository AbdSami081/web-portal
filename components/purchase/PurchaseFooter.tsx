import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { AppLabel } from "@/components/Custom/AppLabel";
import { Textarea } from "@/components/ui/textarea";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { useFormContext } from "react-hook-form";

export function PurchaseFooter() {
  const { watch } = useFormContext();
  const {
    DocTotal,
    TaxTotal,
    TotalBeforeDiscount,
    freight = 0,
    discountPercent = 0,
    setFreight,
    setDiscountPercent,
    setComments,
    TotalFreight = 0,
  } = usePurchaseDocument();

  const docStatus = watch("DocStatus");
  const docEntry = watch("DocEntry");
  const isLoadedDocument = docEntry && Number(docEntry) > 0;
  const isFooterDisabled = isLoadedDocument && docStatus === "bost_Close";

  const currency = "PKR";

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
            <AppLabel>Total Before Discount</AppLabel>
            <div className="relative">
              <Input
                className="h-6 text-right bg-slate-200 pr-10"
                value={TotalBeforeDiscount.toFixed(2)}
                disabled={true}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <AppLabel>Discount %</AppLabel>
            <div className="relative">
              <Input
                type="number"
                className="h-6 text-right pr-6"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                disabled={isFooterDisabled}
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">%</span>
            </div>
          </div>

          {/* Freight */}
          <div className="grid grid-cols-2 gap-2 items-center">
            <AppLabel>Freight</AppLabel>
            <div className="relative">
              <Input
                className="h-6 text-right bg-slate-200 pr-10"
                value={TotalFreight.toFixed(2)}
                disabled={true}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
            </div>
          </div>

          {/* Tax */}
          <div className="grid grid-cols-2 gap-2 items-center">
            <AppLabel>Tax</AppLabel>
            <div className="relative">
              <Input
                className="h-6 text-right bg-slate-200 pr-10"
                value={TaxTotal.toFixed(2)}
                disabled={true}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
            </div>
          </div>

          {/* Total */}
          <div className="grid grid-cols-2 gap-2 items-center border-t border-gray-300 pt-2">
            <AppLabel className="font-bold text-sm">Total</AppLabel>
            <div className="relative">
              <Input
                className="h-7 text-right bg-white font-bold pr-10 border-slate-400"
                value={DocTotal.toFixed(2)}
                disabled={true}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-900 font-black">{currency}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
