import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { useInvDocConfig } from "./InvDocumentLayout";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { BusinessPartnerSelectorDialog } from "@/modals/BusinessPartnerSelectorDialog";
import { Warehouse } from "@/types/warehouse/warehouse";
import { getwarehouses } from "@/api+/sap/master-data/warehouses";
import { useInventoryDocument } from "@/stores/inventory/useInventoryDocument";
import { getInventoryTransfer, getInventoryTransferRequest } from "@/api+/sap/inventory/inventoryService";

const statusMap: Record<string, string> = {
  bost_Open: "Open",
  bost_Close: "Closed",
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
  const { customer, setCustomer, loadFromDocument, warehouses: globalWarehouses, setWarehouses, DocEntry } = useInventoryDocument();
  const [warehouses, setLocalWarehouses] = useState<Warehouse[]>([]);

  const docEntry = watch("DocEntry");
  const [docNumSearch, setDocNumSearch] = useState("");
  const watchedStatus = watch("DocStatus") || "bost_Open";
  const config = useInvDocConfig();

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await getwarehouses();
        setLocalWarehouses(res);
        setWarehouses(res);
      } catch (error) {
        console.error("Failed to fetch warehouses", error);
      }
    };
    fetchWarehouses();
  }, [setWarehouses]);

  useEffect(() => {
    if (warehouses.length > 0) {
      const currentFromWhs = watch("FromWarehouse");
      const currentToWhs = watch("ToWarehouse");

      if (!currentFromWhs) {
        setValue("FromWarehouse", warehouses[0].WhsCode, { shouldDirty: true });
      }
      if (!currentToWhs) {
        setValue("ToWarehouse", warehouses[0].WhsCode, { shouldDirty: true });
      }
    }
  }, [warehouses, setValue, watch]);

  useEffect(() => {
    if (docEntry) {
      setDocNumSearch(docEntry.toString());
    }
  }, [docEntry, setValue, watch, warehouses]);

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
      if (config.type === DocumentType.InvTransferReq) {
        documentData = await getInventoryTransferRequest(docNumInt);
      } else if (config.type === DocumentType.InvTransfer) {
        documentData = await getInventoryTransfer(docNumInt);
      }

      if (documentData) {
        applyDocumentData(documentData, config.type);
      } else {
        toast.error("Document not found.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred while fetching the document.");
    } finally {
      setIsLoading(false);
    }
  };

  const applyDocumentData = (documentData: any, type: number) => {
    setValue("DocEntry", documentData.DocEntry || 0);
    setValue("DocNum", documentData.DocNum || 0);
    setValue("TaxDate", documentData.TaxDate ? documentData.TaxDate.split("T")[0] : "");
    setValue("CardCode", documentData.CardCode);
    setValue("CardName", documentData.CardName);
    setValue("Comments", documentData.Comments);
    setValue("FromWarehouse", documentData.FromWarehouse);
    setValue("ToWarehouse", documentData.ToWarehouse);
    setValue("JournalMemo", documentData.JournalMemo);
    setValue("DocStatus", documentData.DocumentStatus);

    loadFromDocument(documentData, type);
    toast.success(`Document loaded successfully.`);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex flex-col gap-4 w-full lg:w-1/2">
        <div className="flex items-center gap-1">
          <Label className="w-32">Customer</Label>
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
              disabled={DocEntry > 0}
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
          <Label className="w-32">Name</Label>
          <Input
            type="text"
            {...register("CardName")}
            className="h-8 w-56"
            placeholder="Card Name"
            disabled
          />
        </div>

        <div className="flex items-center gap-1 w-full">
          <Label className="w-32">From Warehouse</Label>
          <Input type="hidden" {...register("FromWarehouse")} />
          <Select
            disabled={DocEntry > 0}
            onValueChange={(val) => setValue("FromWarehouse", val, { shouldDirty: true })}
            value={watch("FromWarehouse") || warehouses[0]?.WhsCode || ""}
          >
            <SelectTrigger className="h-8 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.WhsCode} value={wh.WhsCode}>
                    {wh.WhsName}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 w-full">
          <Label className="w-32">To Warehouse</Label>
          <Input type="hidden" {...register("ToWarehouse")} />
          <Select
            disabled={DocEntry > 0}
            onValueChange={(val) => setValue("ToWarehouse", val, { shouldDirty: true })}
            value={watch("ToWarehouse") || warehouses[0]?.WhsCode || ""}
          >
            <SelectTrigger className="h-8 w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.WhsCode} value={wh.WhsCode}>
                    {wh.WhsName}
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
                  e.preventDefault();
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

        <div className="flex justify-between items-center gap-1 w-full">
          <Label className="w-32">Document Date</Label>
          <Input
            type="date"
            {...register("TaxDate")}
            className="h-8 w-56"
            disabled={DocEntry > 0}
          />
        </div>
      </div>

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
