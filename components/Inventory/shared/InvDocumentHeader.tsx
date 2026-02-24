import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useSalesDocument } from "@/stores/sales/useSalesDocument";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { AppLabel } from "@/components/Custom/AppLabel";
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
import { GenericModal } from "@/modals/GenericModal";
import { ConfirmationModal } from "@/modals/ConfirmationModal";

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
  const [fromWhsModalOpen, setFromWhsModalOpen] = useState(false);
  const [toWhsModalOpen, setToWhsModalOpen] = useState(false);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const {
    lines,
    customer,
    setCustomer,
    loadFromDocument,
    warehouses: globalWarehouses,
    setWarehouses,
    DocEntry,
    updateAllLinesWarehouse,
    fromWarehouse,
    toWarehouse,
    docDate,
    setFromWarehouse,
    setToWarehouse,
    setDocDate,
    comments,
    setComments,
    journalMemo,
    setJournalMemo,
  } = useInventoryDocument();
  const [warehouses, setLocalWarehouses] = useState<Warehouse[]>([]);

  const docEntry = watch("DocEntry");
  const [docNumSearch, setDocNumSearch] = useState("");
  const watchedStatus = watch("DocStatus") || "bost_Open";
  const config = useInvDocConfig();
  const [syncDialog, setSyncDialog] = useState<{
    open: boolean;
    type: "from" | "to" | null;
    value: string;
  }>({ open: false, type: null, value: "" });

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

  const fromWhs = watch("FromWarehouse");
  const toWhs = watch("ToWarehouse");

  useEffect(() => {
    if (warehouses.length > 0) {
      if (!fromWarehouse) {
        setFromWarehouse(warehouses[0].WhsCode);
      }
      if (!toWarehouse) {
        setToWarehouse(warehouses[0].WhsCode);
      }
    }
  }, [warehouses, fromWarehouse, toWarehouse, setFromWarehouse, setToWarehouse]);

  useEffect(() => {
    if (docEntry) {
      setDocNumSearch(docEntry.toString());
    }
  }, [docEntry, setValue, watch, warehouses]);



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
    const dateStr = documentData.TaxDate ? documentData.TaxDate.split("T")[0] : "";
    setDocDate(dateStr);
    setCustomer(documentData.CardCode ? { CardCode: documentData.CardCode, CardName: documentData.CardName || "" } : null);
    setComments(documentData.Comments || "");
    setFromWarehouse(documentData.FromWarehouse || "");
    setToWarehouse(documentData.ToWarehouse || "");
    setJournalMemo(documentData.JournalMemo || "");
    setValue("DocStatus", documentData.DocumentStatus);

    const isCopy = type !== config.type;
    loadFromDocument(documentData, type, isCopy);
    if (isCopy) {
      setValue("DocEntry", 0);
      setValue("DocNum", 0);
    }
    toast.success(`Document loaded successfully.`);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex flex-col gap-2 w-full lg:w-1/2">
        <div className="flex items-center gap-3">
          <AppLabel className="w-28 shrink-0">Customer</AppLabel>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={customer?.CardCode || ""}
              className="h-8 w-56 pr-10"
              placeholder="Card Code"
              readOnly
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
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

        <div className="flex items-center gap-3 w-full">
          <AppLabel className="w-28 shrink-0">Name</AppLabel>
          <Input
            type="text"
            value={customer?.CardName || ""}
            className="h-8 w-56"
            placeholder="Card Name"
            readOnly
          />
        </div>

        <div className="flex items-center gap-3 w-full">
          <AppLabel className="w-28 shrink-0">From Warehouse</AppLabel>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={fromWarehouse}
              className="h-8 w-56 bg-gray-100 text-gray-500 cursor-not-allowed"
              readOnly
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              disabled={DocEntry > 0}
              onClick={() => setFromWhsModalOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full">
          <AppLabel className="w-28 shrink-0">To Warehouse</AppLabel>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={toWarehouse}
              className="h-8 w-56 bg-gray-100 text-gray-500 cursor-not-allowed"
              readOnly
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              disabled={DocEntry > 0}
              onClick={() => setToWhsModalOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full lg:w-1/2">
        <div className="flex flex-col gap-2 items-end">
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

        <div className="flex justify-end items-center gap-3 w-full">
          <AppLabel className="w-28 shrink-0 text-right">Document Date</AppLabel>
          <Input
            type="date"
            value={docDate}
            onChange={(e) => setDocDate(e.target.value)}
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

      <GenericModal
        title="Select From Warehouse"
        open={fromWhsModalOpen}
        onClose={() => setFromWhsModalOpen(false)}
        onSelect={(wh: Warehouse) => {
          setFromWarehouse(wh.WhsCode);
          if (lines.length > 0) {
            setSyncDialog({ open: true, type: "from", value: wh.WhsCode });
          }
          setFromWhsModalOpen(false);
        }}
        data={warehouses}
        columns={[
          { key: "WhsCode", label: "Warehouse Code" },
          { key: "WhsName", label: "Warehouse Name" },
        ]}
        getSelectValue={(item) => item}
      />

      <GenericModal
        title="Select To Warehouse"
        open={toWhsModalOpen}
        onClose={() => setToWhsModalOpen(false)}
        onSelect={(wh: Warehouse) => {
          setToWarehouse(wh.WhsCode);
          if (lines.length > 0) {
            setSyncDialog({ open: true, type: "to", value: wh.WhsCode });
          }
          setToWhsModalOpen(false);
        }}
        data={warehouses}
        columns={[
          { key: "WhsCode", label: "Warehouse Code" },
          { key: "WhsName", label: "Warehouse Name" },
        ]}
        getSelectValue={(item) => item}
      />

      <ConfirmationModal
        open={syncDialog.open}
        onOpenChange={(open) => !open && setSyncDialog((s) => ({ ...s, open: false }))}
        title="Update Line Warehouses?"
        description={
          <>
            Do you want to update the <strong>{syncDialog.type === "from" ? "From Warehouse" : "To Warehouse"}</strong> for all existing lines to <strong>{syncDialog.value}</strong>?
          </>
        }
        cancelText="No, keep lines"
        confirmText="Yes, update all"
        onConfirm={() => {
          if (syncDialog.type) {
            updateAllLinesWarehouse(syncDialog.value, syncDialog.type === "from");
          }
          setSyncDialog({ open: false, type: null, value: "" });
        }}
      />
    </div>
  );
}
