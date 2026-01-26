import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BusinessPartner } from "@/types/sales/businessPartner.type";
import { Loader2, Search } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { useSalesDocConfig } from "./SalesDocumentLayout";
import { DocumentType } from "@/types/sales/salesDocuments.type";
import { toast } from "sonner";
import { getQuotationDocument, getSalesDeliveryDocument, getSalesOrderDocument } from "@/api+/sap/quotation/salesService";
import { BusinessPartnerSelectorDialog } from "@/modals/BusinessPartnerSelectorDialog";

const statusMap: Record<string, string> = {
  bost_Open: "Open",
  bost_Close: "Closed",
};


export function DocumentHeader() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { customer, setCustomer, loadFromDocument, clearLines, reset, setDocDate, setDocDueDate, setTaxDate } = useSalesDocument();
  const watchedStatus = watch("DocStatus") || "bost_Open";
  const docEntry = watch("DocEntry");
  const config = useSalesDocConfig();
  const [searchValue, setSearchValue] = useState("");
  const currentDate = new Date().toISOString().split('T')[0];

  const isLoadedDocument = docEntry && Number(docEntry) > 0;
  const isHeaderDisabled = isLoadedDocument && watchedStatus === "bost_Close";

  useEffect(() => {
    if (!watchedStatus && !isLoadedDocument) {
      setValue("DocStatus", "bost_Open");
    }
  }, [watchedStatus, isLoadedDocument, setValue]);

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
    setValue("listNum", bp.PriceListNum);

    setModalOpen(false);
  };

  const fetchDocument = async (docNum: string) => {
    var documentData;
    clearLines();
    const docNumInt = parseInt(docNum);

    if (isNaN(docNumInt)) {
      toast.error("Invalid Document Number entered.");
      return;
    }

    setIsLoading(true);

    try {
      if (config.type === DocumentType.Quotation) {
        documentData = await getQuotationDocument(docNumInt);
      }
      else if (config.type === DocumentType.Order) {
        documentData = await getSalesOrderDocument(docNumInt);
      }
      else if (config.type === DocumentType.Delivery) {
        documentData = await getSalesDeliveryDocument(docNumInt);
      }

      if (!documentData?.DocEntry) {
        toast.info(`Document number ${docNumInt} not found.`);
      } else {
        loadFromDocument(documentData)
        console.log("Fetched Document Data:", documentData);
        setValue("DocDate", documentData.DocDate?.split("T")[0]);
        setValue("DocDueDate", documentData.DocDueDate?.split("T")[0]);
        setValue("CardCode", documentData.CardCode);
        setValue("CardName", documentData.CardName);
        setValue("DocStatus", documentData.DocumentStatus);
        setValue("Address2", documentData.Address2);
        setValue("Address", documentData.Address);
        setValue("DocEntry", documentData.DocEntry);
        setValue("Comments", documentData.Comments);
      }
    } catch (error) {
      toast.error("An error occurred while fetching the document.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };


  const getDateLabel = (type: number) => {
    switch (type) {
      case 17:
        return 'Delivery Date';
      case 23:
        return 'Valid Until';
      case 13:
        return 'Due Date';
      case 15:
        return 'Delivery Date';
      case 16:
        return 'Due Date';
      default:
        return 'Date';
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Label className="w-20">Customer</Label>
          <div className="flex items-center">
            <Input
              type="text"
              {...register("CardCode")}
              className="h-8 w-48 pr-10"
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
              disabled={isHeaderDisabled}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search document..."
            className="h-8 w-38"
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
      </div>

      <div className="flex flex-col lg:flex-row justify-between gap-10">
        <div className="flex flex-col gap-4 w-full lg:w-1/2">
          <div className="flex items-center w-full gap-4">
            <Label className="w-20">Name</Label>
            <Input
              type="text"
              {...register("CardName")}
              className="h-8 w-48"
              placeholder="Card Name"
              disabled
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full lg:w-1/2">
          <div className="flex justify-between items-center w-full">
            <Label className="text-xs w-28">Status</Label>
            <Select
              value={watchedStatus}
              onValueChange={(val) => setValue("DocStatus", val)}
              disabled={isHeaderDisabled}
            >
              <SelectTrigger className="w-48">
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

          <div className="flex justify-between items-center w-full">
            <Label className="text-sm w-28">Posting Date</Label>
            <Input type="date" {...register("DocDate")} className="h-8 w-48" disabled={isHeaderDisabled} onChange={(e) => {
              register("DocDate").onChange(e);
              setDocDate(e.target.value);
            }} />
          </div>

          <div className="flex justify-between items-center w-full">
            <Label className="text-sm w-28">
              {getDateLabel(config.type)}
            </Label>
            <Input type="date" {...register("DocDueDate")} className="h-8 w-48" disabled={isHeaderDisabled} onChange={(e) => {
              register("DocDueDate").onChange(e);
              setDocDueDate(e.target.value);
            }} />
          </div>

          <div className="flex justify-between items-center w-full">
            <Label className="text-sm w-28">Document Date</Label>
            <Input type="date" {...register("TaxDate")} className="h-8 w-48" disabled={isHeaderDisabled} onChange={(e) => {
              register("TaxDate").onChange(e);
              setTaxDate(e.target.value);
            }} />
          </div>
        </div>

        {/* <GenericModal<BusinessPartner>
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
    </div>
  );
}
