import { Input } from "@/components/ui/input";
import { AppLabel } from "@/components/Custom/AppLabel";
import { Textarea } from "@/components/ui/textarea";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { useFormContext } from "react-hook-form";
import { formatCurrency } from "@/lib/sap/helpers/currencyFormatter";

export function PurchaseFooter() {
  const { watch, register, setValue } = useFormContext();
  const {
    DocTotal,
    TaxTotal,
    lines,
    TotalBeforeDiscount,
    freight = 0,
    rounding = 0,
    discountPercent = 0,
    currency,
    setFreight,
    setRounding,
    setDiscountPercent,
    setDiscountSum,
    setTaxTotal,
    setComments,
    TotalFreight = 0,
    discSum = 0
  } = usePurchaseDocument();

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
            {...register("Comments")}
            onChange={(e) => {
              setValue("Comments", e.target.value);
              setComments(e.target.value);
            }}
            placeholder="Enter remarks or comments..."
            disabled={docStatus === "bost_Close"}
          />
        </div>

        <div className={`mt-2 space-y-3 bg-slate-100 p-4 rounded-lg text-sm -mt-12`}>
          <div className="grid grid-cols-2 gap-2 items-center">
            <AppLabel>Total Before Discount</AppLabel>
            <div className="relative">
              <Input
                className="h-6 text-right bg-slate-200 pr-10"
                value={formatCurrency(TotalBeforeDiscount).replace(/[^\d.-]/g, '')}
                disabled={true}
                readOnly
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <AppLabel>Discount</AppLabel>
            <div className="flex gap-2 items-center">
              <div className="relative flex-[1.5]">
                <Input
                  type="number"
                  step="any"
                  className="h-6 text-right pr-6"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  disabled={isFooterDisabled}
                />
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">%</span>
              </div>
              <div className="relative flex-[2.5]">
                <Input
                  type="number"
                  step="any"
                  className="h-6 text-right pr-10"
                  value={discSum.toFixed(2)}
                  onChange={(e) => setDiscountSum(Number(e.target.value))}
                  disabled={isFooterDisabled}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <div className="flex items-center gap-1">
              <AppLabel>Freight</AppLabel>
            </div>
            <div className="relative">
              <Input
                className="h-6 text-right bg-slate-200 pr-10"
                value={formatCurrency(TotalFreight)}
                disabled={true}
                readOnly
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <div className="flex items-center gap-2">
              <input type="checkbox" className="h-3 w-3" disabled={isFooterDisabled} />
              <AppLabel className="cursor-pointer">Rounding</AppLabel>
            </div>
            <div className="relative">
              <Input
                type="number"
                step="any"
                className="h-6 text-right pr-10"
                value={rounding}
                onChange={(e) => setRounding(Number(e.target.value))}
                disabled={isFooterDisabled}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 items-center">
            <AppLabel>Tax</AppLabel>
            <div className="relative">
              <Input
                className="h-6 text-right bg-slate-200 pr-10"
                value={TaxTotal.toFixed(2)}
                disabled={true}
                readOnly
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 items-center border-t border-gray-300 pt-2">
            <AppLabel className="font-bold text-sm">Total</AppLabel>
            <div className="relative">
              <Input
                className="h-7 text-right bg-white font-bold pr-10 border-slate-400"
                value={DocTotal.toFixed(2)}
                disabled={true}
                readOnly
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-900 font-black">{currency}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
