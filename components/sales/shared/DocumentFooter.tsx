// import { Input } from "@/components/ui/input";
// import { AppLabel } from "@/components/Custom/AppLabel";
// import { Textarea } from "@/components/ui/textarea";
// import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { formatCurrency } from "@/lib/sap/helpers/currencyFormatter";
// import { useSalesDocument } from "@/stores/sales/useSalesDocument";
// import { useSalesDocConfig } from "./SalesDocumentLayout";
// import { useFormContext } from "react-hook-form";
// import { getFieldSettings } from "@/lib/config/Client/clientSettings";
// import { DocumentType } from "@/types/master/DocumentType";
// import { useFmsContext } from "@/hooks/useFMS";
// import { FmsFieldButton, fmsKeyDown } from "@/components/Custom/FmsFieldButton";
// import { useSalesPersonsStore } from "@/stores/useSalesPersonsStore";
// import { getARDownPaymentByBP } from  "@/api+/sap/sales/salesService";
// import { useState } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Search } from "lucide-react";
// import { toast } from "sonner";
// import { GenericItemSelectorDialog } from "@/modals/GenericItemSelectorDialog";
// import { GenericModal } from "@/modals/GenericModal";
// export default function DocumentFooter() {
//   const { watch, register, setValue } = useFormContext();
//   const config = useSalesDocConfig();
//   const {
//     DocTotal,
//     TaxTotal,
//     TotalBeforeDiscount,
//     rounding = 0,
//     discountPercent = 0,
//     currency,
//     setRounding,
//     setDiscountPercent,
//     setDiscountSum,
//     setComments,
//     TotalFreight = 0,
//     discSum = 0,
//     fieldAccess,
//     salesPersonCode,
//     setSalesPersonCode,
//   } = useSalesDocument();

//   const salesPersons = useSalesPersonsStore((s) => s.salesPersons);
//   const [downPaymentOpen, setDownPaymentOpen] = useState(false);
// const [downPayments, setDownPayments] = useState<any[]>([]);
// const [selectedDownPayments, setSelectedDownPayments] = useState<any[]>([]);
// const [amountToDraw, setAmountToDraw] = useState<Record<number, number>>({});
// const [loadingDownPayments, setLoadingDownPayments] = useState(false);
// const [downPaymentHasMore, setDownPaymentHasMore] = useState(false);

//   const isFieldEnabled = (fieldName: string) => {
//     return getFieldSettings(config.type, "headerFieds", fieldName).enable !== false;
//   };

//   const isFieldVisible = (fieldName: string) => {
//     return fieldAccess.includes(fieldName) && getFieldSettings(config.type, "headerFieds", fieldName).visible !== false;
//   };

//   const docStatus = watch("DocStatus");
//   const docEntry = watch("DocEntry");
//   const isLoadedDocument = docEntry && Number(docEntry) > 0;
//   const isFooterDisabled = isLoadedDocument && docStatus === "bost_Close";

//   const commentsField = register("Comments");
//   const { triggerFMS } = useFmsContext();

// const fetchDownPayments = async (loadMore = false) => {
//   try {
//     const cardCode = watch("CardCode");

//     if (!cardCode) {
//       toast.error("Please select a customer first.");
//       return;
//     }

//     const skip = loadMore ? downPayments.length : 0;

//     setLoadingDownPayments(true);

//     if (!loadMore) {
//       setDownPaymentOpen(true);
//       setDownPayments([]);
//       setSelectedDownPayments([]);
//       setAmountToDraw({});
//     }

//     const data = await getARDownPaymentByBP(cardCode, skip, 20);

//     const records = data || [];

//     setDownPayments((prev) =>
//       loadMore ? [...prev, ...records] : records
//     );

//     // If 20 records are returned, more records may exist.
//     setDownPaymentHasMore(records.length === 20);

//   } catch (error) {
//     console.error("Down Payment Error:", error);
//     toast.error("Unable to load A/R Down Payment documents.");
//   } finally {
//     setLoadingDownPayments(false);
//   }
// };
//   return (
//     <>
//       <div className={`flex items-center gap-4 mt-10`}>
//       </div>

//       <div className="grid grid-cols-2 gap-20">
//         <div>
//           {isFieldVisible("SalesPersonCode") && (
//             <div className="mb-4" data-fms-field="SalesPersonCode">
//               <AppLabel htmlFor="SalesPersonCode">Sales Employee</AppLabel>
//               <Select
//                 value={salesPersonCode !== null && salesPersonCode !== undefined ? String(salesPersonCode) : "-1"}
//                 onValueChange={(val) => setSalesPersonCode(val === "" ? null : Number(val))}
//                 disabled={isFooterDisabled || !isFieldEnabled("SalesPersonCode")}
//               >
//                 <SelectTrigger id="SalesPersonCode" className="w-full max-w-95 mt-2">
//                   <SelectValue placeholder="Select sales employee" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectGroup>
//                     <SelectLabel>Sales Employee</SelectLabel>
//                     {salesPersons.map((p) => (
//                       <SelectItem key={p.SalesEmployeeCode} value={String(p.SalesEmployeeCode)}>
//                         {p.SalesEmployeeName}
//                       </SelectItem>
//                     ))}
//                   </SelectGroup>
//                 </SelectContent>
//               </Select>
//             </div>
//           )}

//           <div className="flex items-center gap-1">
//             <AppLabel htmlFor="Comments">Remarks</AppLabel>
//             <FmsFieldButton field="Comments" />
//           </div>
//           <Textarea
//             id="Comments"
//             className="h-24 mt-4 max-w-95"
//             {...commentsField}
//             onChange={(e) => {
//               setValue("Comments", e.target.value, { shouldDirty: true });
//               setComments(e.target.value);
//             }}
//             onKeyDown={fmsKeyDown("Comments", triggerFMS)}
//             placeholder="Enter remarks or comments..."
//             disabled={docStatus === "bost_Close"}
//           />
//         </div>

//         <div className={`mt-2 space-y-3 bg-slate-100 p-4 rounded-lg text-sm -mt-12`}>
//           {/* {isFieldVisible("TotalBeforeDiscount") && (
//             <div className="grid grid-cols-2 gap-2 items-center">
//               <AppLabel>Total Before Discount</AppLabel>
//               <div className="relative">
//                  <Input
//                   data-fms-field="TotalBeforeDiscount"
//                   className="h-6 text-right bg-slate-200 pr-10"
//                   value={formatCurrency(TotalBeforeDiscount).replace(/[^\d.-]/g, '')}
//                   disabled={true}
//                   readOnly
//                 />
//                 <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
//               </div>
//             </div>
//           )} */}
// {isFieldVisible("TotalBeforeDiscount") && (
//   <div className="grid grid-cols-2 gap-2 items-center">
//     <AppLabel>Total Before Discount</AppLabel>

//     <div className="flex gap-2">
//       <div className="relative flex-1">
//         <Input
//           className="h-6 text-right bg-slate-200 pr-10"
//           value={formatCurrency(TotalBeforeDiscount).replace(/[^\d.-]/g, '')}
//           disabled
//           readOnly
//         />

//         <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">
//           {currency}
//         </span>
//       </div>

//      {config.type === DocumentType.ARInvoice && (
//   <Button
//     type="button"
//     size="sm"
//     variant="outline"
//     className="h-6 px-2"
//     onClick={() => fetchDownPayments(false)}
//     disabled={isFooterDisabled}
//   >
//     <Search size={14} />
//   </Button>
// )}
//     </div>
//   </div>
// )}
//           {isFieldVisible("DiscountPercent") && (
//             <div className="grid grid-cols-2 gap-2 items-center">
//               <AppLabel>{config.isDownPayment ? "DPM" : "Discount"}</AppLabel>
//               <div className="flex gap-2 items-center">
//                 <div className="relative flex-[1.5]">
//                   <Input
//                     data-fms-field={config.isDownPayment ? "DownPaymentPercentage" : "DiscountPercent"}
//                     type="number"
//                     step="any"
//                     min={0}
//                     max={100}
//                     className="h-6 text-right pr-6"
//                     value={discountPercent}
//                     onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
//                     disabled={isFooterDisabled || !isFieldEnabled("DiscountPercent")}
//                   />
//                   <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">%</span>
//                 </div>
//                 <div className="relative flex-[2.5]">
//                   <Input
//                     data-fms-field={config.isDownPayment ? "DownPaymentAmount" : "DiscountSum"}
//                     type="number"
//                     step="any"
//                     className="h-6 text-right pr-10"
//                     value={
//                       config.isDownPayment
//                         ? ((Number(TotalBeforeDiscount) * Number(discountPercent)) / 100).toFixed(2)
//                         : discSum.toFixed(2)
//                     }
//                     onChange={(e) => setDiscountSum(Number(e.target.value))}
//                     readOnly={config.isDownPayment}
//                     disabled={isFooterDisabled || !isFieldEnabled("DiscountSum") || config.isDownPayment}
//                   />
//                   <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
//                 </div>
//               </div>
//             </div>
//           )}

//           {}
//           {isFieldVisible("TotalFreight") && (
//             <div className="grid grid-cols-2 gap-2 items-center">
//               <div className="flex items-center gap-1">
//                 <AppLabel>Freight</AppLabel>
//               </div>
//               <div className="relative">
//                 <Input
//                   data-fms-field="TotalFreight"
//                   className="h-6 text-right bg-slate-200 pr-10"
//                   value={TotalFreight.toFixed(2)}
//                   disabled={true}
//                   readOnly
//                 />
//                 <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
//               </div>
//             </div>
//           )}

//           {}
//           {isFieldVisible("Rounding") && (
//             <div className="grid grid-cols-2 gap-2 items-center">
//               <div className="flex items-center gap-2">
//                 <input type="checkbox" className="h-3 w-3" disabled={isFooterDisabled || !isFieldEnabled("Rounding")} />
//                 <AppLabel className="cursor-pointer">Rounding</AppLabel>
//               </div>
//               <div className="relative">
//                 <Input
//                   data-fms-field="Rounding"
//                   type="number"
//                   step="any"
//                   className="h-6 text-right pr-10"
//                   value={rounding}
//                   onChange={(e) => setRounding(Number(e.target.value))}
//                   disabled={
//                     isFooterDisabled || !isFieldEnabled("RoundingValue")
//                   }
//                 />
//                 <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
//               </div>
//             </div>
//           )}

//           {}
//           {isFieldVisible("TaxTotal") && (
//             <div className="grid grid-cols-2 gap-2 items-center">
//               <AppLabel>Tax</AppLabel>
//               <div className="relative">
//                 <Input
//                   data-fms-field="TaxTotal"
//                   className="h-6 text-right bg-slate-200 pr-10"
//                   value={TaxTotal.toFixed(2)}
//                   disabled={true}
//                   readOnly
//                 />
//                 <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">{currency}</span>
//               </div>
//             </div>
//           )}

//           {}
//           {isFieldVisible("DocTotal") && (
//             <div className="grid grid-cols-2 gap-2 items-center border-t border-gray-300 pt-2">
//               <AppLabel className="font-bold text-sm">Total</AppLabel>
//               <div className="relative">
//                 <Input
//                   data-fms-field="DocTotal"
//                   className="h-7 text-right bg-white font-bold pr-10 border-slate-400"
//                   value={DocTotal.toFixed(2)}
//                   disabled={isFooterDisabled || !isFieldEnabled("DocTotal")}
//                   readOnly
//                 />
//                 <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-900 font-black">{currency}</span>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//   <GenericModal
//   title="Select A/R Down Payment Invoices"
//   open={downPaymentOpen}
//   onClose={() => setDownPaymentOpen(false)}
//   onSelect={(val) => {
//     const selectedDoc = downPayments.find(
//       (item) => item.DocNum.toString() === val.toString()
//     );

//     if (selectedDoc) {
//       setSelectedDownPayments([selectedDoc]);
//     }

//     setDownPaymentOpen(false);
//   }}
//   data={downPayments}
//   getSelectValue={(item) => item.DocNum}
//   columns={[
//     { key: "DocNum", label: "Doc Num" },
//     { key: "CardCode", label: "Customer Code" },
//     { key: "CardName", label: "Customer Name" },
//     { key: "RefDate", label: "Posting Date" },
//     { key: "DueDate", label: "Due Date" },
//   ]}
//   isLoading={loadingDownPayments}
//   onLoadMore={() => fetchDownPayments(true)}
//   hasMore={downPaymentHasMore}
// />
//     </>
//   );
// }




import { Input } from "@/components/ui/input";
import { AppLabel } from "@/components/Custom/AppLabel";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/sap/helpers/currencyFormatter";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { useSalesDocConfig } from "./SalesDocumentLayout";
import { useFormContext } from "react-hook-form";
import { getFieldSettings } from "@/lib/config/Client/clientSettings";
import { DocumentType } from "@/types/master/DocumentType";
import { useFmsContext } from "@/hooks/useFMS";
import {
  FmsFieldButton,
  fmsKeyDown,
} from "@/components/Custom/FmsFieldButton";
import { useSalesPersonsStore } from "@/stores/useSalesPersonsStore";
import { getARDownPaymentByBP } from "@/api+/sap/sales/salesService";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { GenericModal } from "@/modals/GenericModal";

export default function DocumentFooter() {
  const { watch, register, setValue } = useFormContext();
  const config = useSalesDocConfig();

  const {
    DocTotal,
    TaxTotal,
    TotalBeforeDiscount,
    rounding = 0,
    discountPercent = 0,
    currency,
    setRounding,
    setDiscountPercent,
    setDiscountSum,
    setComments,
    TotalFreight = 0,
    discSum = 0,
    fieldAccess,
    salesPersonCode,
    setSalesPersonCode,
    selectedDownPayments,
setSelectedDownPayments,
amountToDraw,
setAmountToDraw,
  } = useSalesDocument();

  const salesPersons = useSalesPersonsStore((s) => s.salesPersons);

  const [downPaymentOpen, setDownPaymentOpen] = useState(false);
  const [downPayments, setDownPayments] = useState<any[]>([]);
  // const [selectedDownPayments, setSelectedDownPayments] = useState<any[]>([]);
  // const [amountToDraw, setAmountToDraw] = useState<Record<number, number>>({});
  const [loadingDownPayments, setLoadingDownPayments] = useState(false);
  const [downPaymentHasMore, setDownPaymentHasMore] = useState(false);

  const isFieldEnabled = (fieldName: string) => {
    return (
      getFieldSettings(config.type, "headerFieds", fieldName).enable !== false
    );
  };

  const isFieldVisible = (fieldName: string) => {
    return (
      fieldAccess.includes(fieldName) &&
      getFieldSettings(config.type, "headerFieds", fieldName).visible !== false
    );
  };

  const docStatus = watch("DocStatus");
  const docEntry = watch("DocEntry");
  const isLoadedDocument = docEntry && Number(docEntry) > 0;
  const isFooterDisabled =
    isLoadedDocument && docStatus === "bost_Close";

  const commentsField = register("Comments");
  const { triggerFMS } = useFmsContext();

  // Calculate selected Down Payment amount
const totalDownPayment = selectedDownPayments.reduce(
  (total, item) => {
    const amount = Number(amountToDraw[item.DocNum]) || 0;
    return total + amount;
  },
  0
);

const remainingAmount = Math.max(
  0,
  Number(DocTotal || 0) - totalDownPayment
);

  // Fetch A/R Down Payment documents
  const fetchDownPayments = async (loadMore = false) => {
    try {
      const cardCode = watch("CardCode");

      if (!cardCode) {
        toast.error("Please select a customer first.");
        return;
      }

      const skip = loadMore ? downPayments.length : 0;

      setLoadingDownPayments(true);

      if (!loadMore) {
        setDownPaymentOpen(true);
        setDownPayments([]);
        setSelectedDownPayments([]);
        setAmountToDraw({});
        setDownPaymentHasMore(false);
      }

      const data = await getARDownPaymentByBP(cardCode, skip, 20);
      const records = data || [];
console.log("Fetched Down Payments:", records);
      setDownPayments((prev) =>
        loadMore ? [...prev, ...records] : records
      );

      setDownPaymentHasMore(records.length === 20);
    } catch (error) {
      console.error("Down Payment Error:", error);
      toast.error("Unable to load A/R Down Payment documents.");
    } finally {
      setLoadingDownPayments(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 mt-10"></div>

      <div className="grid grid-cols-2 gap-20">
        <div>
          {isFieldVisible("SalesPersonCode") && (
            <div className="mb-4" data-fms-field="SalesPersonCode">
              <AppLabel htmlFor="SalesPersonCode">
                Sales Employee
              </AppLabel>

              <Select
                value={
                  salesPersonCode !== null &&
                  salesPersonCode !== undefined
                    ? String(salesPersonCode)
                    : "-1"
                }
                onValueChange={(val) =>
                  setSalesPersonCode(val === "" ? null : Number(val))
                }
                disabled={
                  isFooterDisabled ||
                  !isFieldEnabled("SalesPersonCode")
                }
              >
                <SelectTrigger
                  id="SalesPersonCode"
                  className="w-full max-w-95 mt-2"
                >
                  <SelectValue placeholder="Select sales employee" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Sales Employee</SelectLabel>

                    {salesPersons.map((p) => (
                      <SelectItem
                        key={p.SalesEmployeeCode}
                        value={String(p.SalesEmployeeCode)}
                      >
                        {p.SalesEmployeeName}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-1">
            <AppLabel htmlFor="Comments">Remarks</AppLabel>
            <FmsFieldButton field="Comments" />
          </div>

          <Textarea
            id="Comments"
            className="h-24 mt-4 max-w-95"
            {...commentsField}
            onChange={(e) => {
              setValue("Comments", e.target.value, {
                shouldDirty: true,
              });
              setComments(e.target.value);
            }}
            onKeyDown={fmsKeyDown("Comments", triggerFMS)}
            placeholder="Enter remarks or comments..."
            disabled={docStatus === "bost_Close"}
          />
        </div>

        <div className="mt-2 space-y-3 bg-slate-100 p-4 rounded-lg text-sm -mt-12">

          {/* Total Before Discount */}
          {isFieldVisible("TotalBeforeDiscount") && (
            <div className="grid grid-cols-2 gap-2 items-center">
              <AppLabel>Total Before Discount</AppLabel>

              <div className="relative">
                <Input
                  className="h-6 text-right bg-slate-200 pr-10"
                  value={formatCurrency(TotalBeforeDiscount).replace(
                    /[^\d.-]/g,
                    ""
                  )}
                  disabled
                  readOnly
                />

                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">
                  {currency}
                </span>
              </div>
            </div>
          )}

          {/* Discount */}
          {isFieldVisible("DiscountPercent") && (
            <div className="grid grid-cols-2 gap-2 items-center">
              <AppLabel>
                {config.isDownPayment ? "DPM" : "Discount"}
              </AppLabel>

              <div className="flex gap-2 items-center">
                <div className="relative flex-[1.5]">
                  <Input
                    data-fms-field={
                      config.isDownPayment
                        ? "DownPaymentPercentage"
                        : "DiscountPercent"
                    }
                    type="number"
                    step="any"
                    min={0}
                    max={100}
                    className="h-6 text-right pr-6"
                    value={discountPercent}
                    onChange={(e) =>
                      setDiscountPercent(
                        Math.min(
                          100,
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      )
                    }
                    disabled={
                      isFooterDisabled ||
                      !isFieldEnabled("DiscountPercent")
                    }
                  />

                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">
                    %
                  </span>
                </div>

                <div className="relative flex-[2.5]">
                  <Input
                    data-fms-field={
                      config.isDownPayment
                        ? "DownPaymentAmount"
                        : "DiscountSum"
                    }
                    type="number"
                    step="any"
                    className="h-6 text-right pr-10"
                    value={
                      config.isDownPayment
                        ? (
                            (Number(TotalBeforeDiscount) *
                              Number(discountPercent)) /
                            100
                          ).toFixed(2)
                        : discSum.toFixed(2)
                    }
                    onChange={(e) =>
                      setDiscountSum(Number(e.target.value))
                    }
                    readOnly={config.isDownPayment}
                    disabled={
                      isFooterDisabled ||
                      !isFieldEnabled("DiscountSum") ||
                      config.isDownPayment
                    }
                  />

                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">
                    {currency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Total Down Payment */}
          {config.type === DocumentType.ARInvoice && (
            <div className="grid grid-cols-2 gap-2 items-center">
              <AppLabel>Total Down Payment</AppLabel>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    className="h-6 text-right bg-slate-200 pr-10"
                    value={totalDownPayment.toFixed(2)}
                    readOnly
                    disabled
                  />

                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">
                    {currency}
                  </span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-6 w-7 p-0"
                  onClick={() => fetchDownPayments(false)}
                  disabled={isFooterDisabled}
                >
                  <Search size={14} />
                </Button>
              </div>
            </div>
          )}

          {/* Freight */}
          {isFieldVisible("TotalFreight") && (
            <div className="grid grid-cols-2 gap-2 items-center">
              <AppLabel>Freight</AppLabel>

              <div className="relative">
                <Input
                  data-fms-field="TotalFreight"
                  className="h-6 text-right bg-slate-200 pr-10"
                  value={TotalFreight.toFixed(2)}
                  disabled
                  readOnly
                />

                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">
                  {currency}
                </span>
              </div>
            </div>
          )}

          {/* Rounding */}
          {isFieldVisible("Rounding") && (
            <div className="grid grid-cols-2 gap-2 items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3 w-3"
                  disabled={
                    isFooterDisabled ||
                    !isFieldEnabled("Rounding")
                  }
                />

                <AppLabel className="cursor-pointer">
                  Rounding
                </AppLabel>
              </div>

              <div className="relative">
                <Input
                  data-fms-field="Rounding"
                  type="number"
                  step="any"
                  className="h-6 text-right pr-10"
                  value={rounding}
                  onChange={(e) =>
                    setRounding(Number(e.target.value))
                  }
                  disabled={
                    isFooterDisabled ||
                    !isFieldEnabled("RoundingValue")
                  }
                />

                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">
                  {currency}
                </span>
              </div>
            </div>
          )}

          {/* Tax */}
          {isFieldVisible("TaxTotal") && (
            <div className="grid grid-cols-2 gap-2 items-center">
              <AppLabel>Tax</AppLabel>

              <div className="relative">
                <Input
                  data-fms-field="TaxTotal"
                  className="h-6 text-right bg-slate-200 pr-10"
                  value={TaxTotal.toFixed(2)}
                  disabled
                  readOnly
                />

                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">
                  {currency}
                </span>
              </div>
            </div>
          )}

          {/* Total */}
          {/* {isFieldVisible("DocTotal") && (
            <div className="grid grid-cols-2 gap-2 items-center border-t border-gray-300 pt-2">
              <AppLabel className="font-bold text-sm">
                Total
              </AppLabel>

              <div className="relative">
                <Input
                  data-fms-field="DocTotal"
                  className="h-7 text-right bg-white font-bold pr-10 border-slate-400"
                  value={DocTotal.toFixed(2)}
                  disabled={
                    isFooterDisabled ||
                    !isFieldEnabled("DocTotal")
                  }
                  readOnly
                />

                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-900 font-black">
                  {currency}
                </span>
              </div>
            </div>
          )} */}
          {/* Total */}
{isFieldVisible("DocTotal") && (
  <div className="space-y-3 border-t border-gray-300 pt-3">

    <div className="grid grid-cols-2 gap-2 items-center">
      <AppLabel className="font-bold text-sm">
        Total
      </AppLabel>

      <div className="relative">
        <Input
          data-fms-field="DocTotal"
          className="h-7 text-right bg-white font-bold pr-10 border-slate-400"
          value={DocTotal.toFixed(2)}
          disabled={
            isFooterDisabled ||
            !isFieldEnabled("DocTotal")
          }
          readOnly
        />

        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-900 font-black">
          {currency}
        </span>
      </div>
    </div>

    {/* Down Payment Applied */}
    {config.type === DocumentType.ARInvoice && (
      <>
        <div className="grid grid-cols-2 gap-2 items-center">
          <AppLabel>Down Payment Applied</AppLabel>

          <div className="relative">
            <Input
              className="h-6 text-right bg-slate-200 pr-10"
              value={totalDownPayment.toFixed(2)}
              readOnly
              disabled
            />

            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold">
              {currency}
            </span>
          </div>
        </div>

        {/* Amount Due */}
        <div className="grid grid-cols-2 gap-2 items-center border-t border-gray-300 pt-2">
          <AppLabel className="font-bold text-sm">
            Amount Due
          </AppLabel>

          <div className="relative">
            <Input
              className="h-7 text-right bg-white font-bold pr-10 border-slate-400"
              value={remainingAmount.toFixed(2)}
              readOnly
              disabled
            />

            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-900 font-black">
              {currency}
            </span>
          </div>
        </div>
      </>
    )}

  </div>
)}
        </div>
      </div>

      {/* A/R Down Payment Selection Modal */}
      <GenericModal
        title="Select A/R Down Payment Invoices"
        open={downPaymentOpen}
        onClose={() => setDownPaymentOpen(false)}
       onSelect={(val) => {
  const selectedDoc = downPayments.find(
    (item) => String(item.DocNum) === String(val)
  );

  if (selectedDoc) {
    const availableAmount = Number(selectedDoc.OpenAmount) || 0;

    if (availableAmount <= 0) {
      toast.error("No available amount to draw from this Down Payment.");
      return;
    }

    const invoiceTotal = Number(DocTotal) || 0;
    const amountToApply = Math.min(availableAmount, invoiceTotal);

    setSelectedDownPayments([selectedDoc]);

    setAmountToDraw({
      [selectedDoc.DocNum]: Number(amountToApply.toFixed(2)),
    });
  }

  setDownPaymentOpen(false);
}}
        data={downPayments}
        getSelectValue={(item) => item.DocNum}
      columns={[
  { key: "DocNum", label: "Document No." },
  { key: "DocDate", label: "Posting Date" },
  { key: "DocDueDate", label: "Due Date" },
  { key: "DocCurrency", label: "Currency" },
  { key: "DocTotal", label: "Total Amount" },
  { key: "DownPaymentAmount", label: "Down Payment Amount" },
  { key: "PaidToDate", label: "Paid Amount" },
  { key: "DownPaymentApplied", label: "Applied Amount" },
  { key: "DownPaymentDrawn", label: "Drawn Amount" },
  { key: "DownPaymentPercentage", label: "Down Payment %" },
  { key: "DocumentStatus", label: "Status" },
]}
        isLoading={loadingDownPayments}
        onLoadMore={() => fetchDownPayments(true)}
        hasMore={downPaymentHasMore}
      />
    </>
  );
}
