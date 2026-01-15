import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GenericModal } from "@/modals/GenericModal";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { useInvDocConfig } from "./InvDocumentLayout";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { BusinessPartnerSelectorDialog } from "@/modals/BusinessPartnerSelectorDialog";

const statusMap: Record<string, string> = {
  bost_Open: "Open",
  bost_Close: "Closed",
};


const mockSelectOptions = {
  series: ["100", "200", "External"],
  shipTo: ["Main Address", "Warehouse 1", "Office 2"],
  contactPersons: ["John Doe", "Jane Smith", "Alex Brown"],
  priceLists: [{ num: 1, name: "Base Price" }, { num: 2, name: "Discount Purchase Price" }],
  warehouses: ["01", "02", "03"],
  binLocations: ["A-01", "B-02"],
};

export function InvDocumentHeader() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { customer, setCustomer, loadFromDocument } = useSalesDocument();
  const docEntry = watch("DocEntry");
  const [docNumSearch, setDocNumSearch] = useState("");
  const watchedStatus = watch("DocStatus") || "bost_Open";
  const config = useInvDocConfig();

  useEffect(() => {
    if (docEntry) {
      setDocNumSearch(docEntry.toString());
    }
    if (!watch("ShipToCode")) setValue("ShipToCode", mockSelectOptions.shipTo[0]);
    if (!watch("PriceListNum")) setValue("PriceListNum", mockSelectOptions.priceLists[1].num.toString());
    if (!watch("Series")) setValue("Series", mockSelectOptions.series[0]);
    if (!watch("FromWarehouse")) setValue("FromWarehouse", mockSelectOptions.warehouses[0]);
    if (!watch("ToWarehouse")) setValue("ToWarehouse", mockSelectOptions.warehouses[0]);
  }, [docEntry, setValue, watch]);

  useEffect(() => {
    if (customer) {
      setValue("CardCode", customer.CardCode);
      setValue("CardName", customer.CardName);
    }
  }, [customer, setValue]);

  const fetchBusinessPartners = () => {
    const data: BusinessPartner[] = [
      { CardCode: "C0001", CardName: "Alpha Traders" },
      { CardCode: "C0002", CardName: "Beta Industries" },
      { CardCode: "C0003", CardName: "Gamma Distributors" },
      { CardCode: "C0004", CardName: "Delta Co." },
      { CardCode: "C0005", CardName: "Zeta Solutions" },
    ];
    setBusinessPartners(data);
  };

  const handleSelectBP = (bp: BusinessPartner) => {
    setCustomer(bp);
    setValue("CardCode", bp.CardCode);
    setValue("CardName", bp.CardName);
    setModalOpen(false);
  };

  const fetchDocument = async () => {
    const docNumInt = parseInt(docNumSearch);
    if (isNaN(docNumInt) || docNumInt <= 0) {
      toast.error("Please enter a valid document number to load.");
      return;
    }
    setIsLoading(true);

    try {
      let documentData;
      // toast.success(`Document ${documentData.DocEntry} loaded successfully. (Mock Doc 1000 loaded)`);
    } catch (error) {
      toast.error("An error occurred while fetching the document.");
      console.error("Document fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex flex-col gap-4 w-full lg:w-1/2">
        <div className="flex items-center gap-1">
          <Label className="w-24">Customer</Label>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              {...register("CardCode")}
              className="h-8 w-56 pr-10"
              placeholder="Card Code"
              disabled
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="ml-2 h-8 w-8 cursor-pointer"
              onClick={() => {
                fetchBusinessPartners();
                setModalOpen(true);
              }}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 w-full">
          <Label className="w-24">Name</Label>
          <Input
            type="text"
            {...register("CardName")}
            className="h-8 w-56"
            placeholder="Card Name"
            disabled
          />
        </div>

        <div className="flex items-center gap-1 w-full">
          <Label className="w-24">Price List</Label>
          <Select
            onValueChange={(val) => setValue("PriceListNum", val)}
            value={watch("PriceListNum") || mockSelectOptions.priceLists[1].num.toString()}
          >
            <SelectTrigger className="h-8 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {mockSelectOptions.priceLists.map((list) => (
                  <SelectItem key={list.num} value={list.num.toString()}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full lg:w-1/2">
        <div className="flex flex-col gap-4 items-end">
          <div className="flex items-center gap-1">
            <Input
              type="text"
              placeholder="Search document..."
              className="h-8 w-47"
              value={docNumSearch}
              onChange={(e) => setDocNumSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchDocument();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => fetchDocument()}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

      {config.type !== DocumentType.InvTransfer &&(
        <div className="flex justify-between items-center gap-1 w-full">
          <Label className="text-xs w-28">Status</Label>
          <Select
            value={watchedStatus}
            onValueChange={(val) => setValue("DocStatus", val)}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>Select Status</SelectLabel>
                {Object.entries(statusMap).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {config.type == DocumentType.InvTransfer &&(
        <div className="flex justify-between items-center gap-1 w-full">
          <Label className="w-24">Series</Label>
          <Select
            onValueChange={(val) => setValue("Series", val)}
            value={watch("Series") || mockSelectOptions.series[0]}
          >
            <SelectTrigger className="h-8 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {mockSelectOptions.series.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}
        
        {config.type !== DocumentType.InvTransfer &&(
          <div className="flex justify-between items-center gap-1 w-full">
            <Label className="w-24">Due Date</Label>
            <Input
              type="date"
              {...register("DocDueDate")}
              className="h-8 w-56"
            />
          </div>
        )} 
        
        <div className="flex justify-between items-center gap-1 w-full">
          <Label className="w-24">Document Date</Label>
          <Input
            type="date"
            {...register("TaxDate")}
            className="h-8 w-56"
          />
        </div>
      </div>

      {/* <GenericModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={handleSelectBP}
        data={businessPartners}
        columns={[{ key: "CardCode", label: "Code" }, { key: "CardName", label: "Name" }]}
        title="Select Business Partner"
        getSelectValue={(item) => item}
      /> */}
      <BusinessPartnerSelectorDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={(bp) => {
          handleSelectBP(bp); 
          setModalOpen(false); 
        }}
      />
    </div>
  );
}
