import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppLabel } from "@/components/Custom/AppLabel";
import { usePurchaseDocument } from "@/stores/purchase/usePurchaseDocument";
import { Loader2, Search } from "lucide-react";

const statusMap: Record<string, string> = {
  bost_Open: "Open",
  bost_Close: "Closed",
};

export function PurchaseHeader() {
  const { register, watch } = useFormContext();
  const { setDocDate, setDocDueDate, setTaxDate, setRequiredDate, setRequester, setRequesterName, setBranch, setDepartment } = usePurchaseDocument();

  const watchedStatus = watch("DocStatus") || "bost_Open";
  const docNum = watch("DocNum");

  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (docNum) setSearchValue(docNum.toString());
  }, [docNum]);

  const fetchDocument = async (value: string) => {
    if (!value) return;
    setIsLoading(true);
    try {
      // TODO: fetch purchase request by DocNum
      console.log("Fetch Purchase Request DocNum:", value);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
      {/* Left Column */}
      <div className="space-y-4">
        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Requester</AppLabel>
          <div className="col-span-2">
            <Input
              {...register("Requester")}
              className="bg-yellow-50"
              onChange={(e) => setRequester(e.target.value)}
              placeholder="e.g. USER"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Requester Name</AppLabel>
          <div className="col-span-2">
            <Input
              {...register("RequesterName")}
              onChange={(e) => setRequesterName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Branch</AppLabel>
          <div className="col-span-2">
            <Input
              {...register("Branch")}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="e.g. Main"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Department</AppLabel>
          <div className="col-span-2">
            <Input
              {...register("Department")}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. General"
            />
          </div>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-4">
        {/* Search — top-right, same level as Requester */}
        <div className="flex items-center justify-end gap-2">
          <Input
            type="text"
            placeholder="Search document..."
            className="h-8 w-44"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                fetchDocument(searchValue);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => fetchDocument(searchValue)}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Status</AppLabel>
          <div className="col-span-2">
            <div className="h-8 px-3 py-1 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-900 flex items-center">
              {statusMap[watchedStatus] || watchedStatus}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Posting Date</AppLabel>
          <div className="col-span-2">
            <Input type="date" {...register("DocDate")} onChange={(e) => setDocDate(e.target.value)} required className="h-8" />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Valid Until</AppLabel>
          <div className="col-span-2">
            <Input type="date" {...register("DocDueDate")} onChange={(e) => setDocDueDate(e.target.value)} required className="h-8" />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Document Date</AppLabel>
          <div className="col-span-2">
            <Input type="date" {...register("TaxDate")} onChange={(e) => setTaxDate(e.target.value)} required className="h-8" />
          </div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4">
          <AppLabel>Required Date</AppLabel>
          <div className="col-span-2">
            <Input type="date" {...register("RequiredDate")} onChange={(e) => setRequiredDate(e.target.value)} className="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
