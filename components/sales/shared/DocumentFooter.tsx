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
    lines,
    freight = 0,
    rounding = 0,
    discountPercent = 0,
    setFreight,
    setRounding,
    setDiscountPercent,
    setTaxTotal,
    setComments
  } = useSalesDocument();

  const [totals, setTotals] = useState({
    totalBeforeDiscount: 0,
    taxTotal: 0,
    docTotal: 0,
  });

  const [openModal, setOpenModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const employees = [
    { Name: "Ali Khan", Remarks: "Senior Sales Executive" },
    { Name: "Ahsan Raza", Remarks: "Field Sales Officer" },
    { Name: "Hamza Ahmed", Remarks: "Regional Manager" },
    { Name: "Sara Malik", Remarks: "Assistant Sales Rep" },
  ];

  const config = useSalesDocConfig();
  const docStatus = watch("DocStatus");
  const docEntry = watch("DocEntry");
  const isLoadedDocument = docEntry && Number(docEntry) > 0;
  const isFooterDisabled = isLoadedDocument && docStatus === "bost_Close";
  const [freightTotal, setFreightTotal] = useState(0);

  useEffect(() => {
    const totalBeforeDiscount = lines.reduce((sum, l) => {
      const qty = Number(l.Quantity) || 0;
      const price = Number(l.Price) || 0;
      return sum + qty * price;
    }, 0);

    const freightSum = lines.reduce((sum, l) => {
      return (
        sum +
        (l.Freight1Amount || 0) +
        (l.Freight2Amount || 0) +
        (l.Freight3Amount || 0)
      );
    }, 0);
    setFreightTotal(freightSum);
    setFreight(freightSum);

    const appliedDiscount = Math.min(discountPercent, 100);

    const subtotalAfterDiscount = totalBeforeDiscount * (1 - appliedDiscount / 100);

    const taxTotal = lines.reduce((sum, l) => Number(l.TaxAmount || 0) + sum, 0);

    setTaxTotal(taxTotal);

    const docTotal =
      subtotalAfterDiscount +
      taxTotal +
      freightSum +
      rounding;


    setTotals({
      totalBeforeDiscount,
      taxTotal,
      docTotal: parseFloat(docTotal.toString().replace(/[^\d.-]/g, '')),
    });

    setFreight(freightSum);

  }, [lines, freight, rounding, discountPercent]);


  return (
    <>
      <div className={`flex items-center gap-4 mt-10`}>
        {/* <Label className="text-sm w-28">Sales Employee :</Label>

        <div className={`relative w-[250px] flex items-center ${isFooterDisabled ? "opacity-50 pointer-events-none" : ""}`}>
          <Select onValueChange={(v) => setSelectedEmployee(v)} value={selectedEmployee} disabled={isFooterDisabled}>
            <SelectTrigger className="w-full pr-10">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {employees.map((emp) => (
                  <SelectItem key={emp.Name} value={emp.Name}>
                    {emp.Name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Settings
            className="absolute right-3 h-5 w-5 cursor-pointer text-gray-500 hover:text-black"
            onClick={() => !isFooterDisabled && setOpenModal(true)}
          />
        </div>

        <GenericModal
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSelect={(name: any) => setSelectedEmployee(name)}
          data={employees}
          columns={[
            { key: "Name", label: "Employee Name" },
            { key: "Remarks", label: "Remarks" },
          ]}
          title="Select Sales Employee"
          getSelectValue={(item) => item.Name}
        /> */}
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
            disabled={isFooterDisabled}
          />
        </div>

        <div className={`space-y-3 bg-slate-100 p-4 rounded-lg text-sm -mt-12`}>
          <div className="grid grid-cols-2 gap-2 items-center">
            <Label>Freight</Label>
            <Input
              type="number"
              className="h-6 text-right"
              value={freightTotal}
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
              <span>{formatCurrency(totals.totalBeforeDiscount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Tax:</span>
              <span>{formatCurrency(totals.taxTotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Document Total:</span>
              <span>{formatCurrency(totals.docTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
