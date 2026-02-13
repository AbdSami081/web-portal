import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { usePRDDocConfig } from "./PRDDocumentLayout";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getwarehouses } from "@/api+/sap/master-data/warehouses";
import { Warehouse } from "@/types/warehouse/warehouse";
import { GenericModal } from "@/modals/GenericModal";
import { getBOMList } from "@/api+/sap/production/productionService";

export function PRDDocumentHeader() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const { loadFromDocument, warehouses, setWarehouses, loadFromBOM, recalculateFromHeader } = useIFPRDDocument();
  const config = usePRDDocConfig();

  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [bomList, setBomList] = useState<any[]>([]);
  const [isLoadingBoms, setIsLoadingBoms] = useState(false);
  const watchedPlannedQty = watch("PlannedQuantity");

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await getwarehouses();
        setWarehouses(res);
      } catch (error) {
        console.error("Failed to fetch warehouses", error);
      }
    };
    if (warehouses.length === 0) {
      fetchWarehouses();
    }
  }, [setWarehouses, warehouses.length]);

  const watchedWhs = watch("Warehouse");

  useEffect(() => {
    if (warehouses.length > 0) {
      if (!watchedWhs) {
        setValue("Warehouse", warehouses[0].WhsCode, { shouldDirty: true });
      }
    }
  }, [warehouses, watchedWhs, setValue]);

  useEffect(() => {
    if (watchedPlannedQty !== undefined) {
      recalculateFromHeader(Number(watchedPlannedQty));
    }
  }, [watchedPlannedQty]);


  const fetchDocument = async (baseRef: string) => {

    var documentData: any;
    if (!baseRef) {
      toast.error("Invalid Document Number entered.");
      return;
    }

    setIsLoading(true);
    try {
      // if (config.type === DocumentType.IssueForProduction) 
      // {
      //     documentData = await getPRDOrder(Number(baseRef));
      // }
      // documentData = {
      //     AbsoluteEntry: 155,
      //     DocumentNumber: 155,
      //     Series: 23,
      //     ItemNo: "P10001",
      //     ProductionOrderStatus: "boposPlanned",
      //     ProductionOrderType: "bopotStandard",
      //     PlannedQuantity: 100.0,
      //     CompletedQuantity: 0.0,
      //     RejectedQuantity: 0.0,
      //     PostingDate: "2021-06-21T00:00:00Z",
      //     DueDate: "2021-06-21T00:00:00Z",
      //     ProductionOrderOriginEntry: null,
      //     ProductionOrderOriginNumber: null,
      //     ProductionOrderOrigin: "bopooManual",
      //     UserSignature: 1,
      //     Remarks: null,
      //     ClosingDate: null,
      //     ReleaseDate: null,
      //     CustomerCode: null,
      //     Warehouse: "01",
      //     InventoryUOM: null,
      //     JournalRemarks: "Production Order - P10001",
      //     TransactionNumber: null,
      //     CreationDate: "2021-06-21T00:00:00Z",
      //     Printed: "tNO",
      //     DistributionRule: "",
      //     Project: "",
      //     DistributionRule2: "",
      //     DistributionRule3: "",
      //     DistributionRule4: "",
      //     DistributionRule5: "",
      //     UoMEntry: -1,
      //     StartDate: "2021-06-21T00:00:00Z",
      //     ProductDescription: "PC - 8x core, DDR 32GB, 2TB HDD",
      //     Priority: 100,
      //     RoutingDateCalculation: "raOnStartDate",
      //     UpdateAllocation: "bouaManual",
      //     SAPPassport: null,
      //     AttachmentEntry: null,
      //     PickRemarks: null,
      //     ProductionOrderLines: [
      //         {
      //             DocumentAbsoluteEntry: 155,
      //             LineNumber: 0,
      //             ItemNo: "C00001",
      //             BaseQuantity: 1.0,
      //             PlannedQuantity: 100.0,
      //             IssuedQuantity: 0.0,
      //             ProductionOrderIssueType: "im_Manual",
      //             Warehouse: "01",
      //             VisualOrder: 0,
      //             DistributionRule: null,
      //             LocationCode: null,
      //             Project: null,
      //             DistributionRule2: null,
      //             DistributionRule3: null,
      //             DistributionRule4: null,
      //             DistributionRule5: null,
      //             UoMEntry: -1,
      //             UoMCode: -1,
      //             WipAccount: null,
      //             ItemType: "pit_Item",
      //             LineText: null,
      //             AdditionalQuantity: 0.0,
      //             ResourceAllocation: null,
      //             StartDate: "2021-06-21T00:00:00Z",
      //             EndDate: "2021-06-21T00:00:00Z",
      //             StageID: null,
      //             RequiredDays: 0.0,
      //             ItemName: "Motherboard BTX",
      //             WeightOfRecycledPlastic: null,
      //             PlasticPackageExemptionReason: null,
      //             SerialNumbers: [],
      //             BatchNumbers: []
      //         },
      //         {
      //             DocumentAbsoluteEntry: 155,
      //             LineNumber: 1,
      //             ItemNo: "C00003",
      //             BaseQuantity: 1.0,
      //             PlannedQuantity: 100.0,
      //             IssuedQuantity: 0.0,
      //             ProductionOrderIssueType: "im_Manual",
      //             Warehouse: "01",
      //             VisualOrder: 1,
      //             DistributionRule: null,
      //             LocationCode: null,
      //             Project: null,
      //             DistributionRule2: null,
      //             DistributionRule3: null,
      //             DistributionRule4: null,
      //             DistributionRule5: null,
      //             UoMEntry: -1,
      //             UoMCode: -1,
      //             WipAccount: null,
      //             ItemType: "pit_Item",
      //             LineText: null,
      //             AdditionalQuantity: 0.0,
      //             ResourceAllocation: null,
      //             StartDate: "2021-06-21T00:00:00Z",
      //             EndDate: "2021-06-21T00:00:00Z",
      //             StageID: null,
      //             RequiredDays: 0.0,
      //             ItemName: "Quadcore CPU 3.4 GHz",
      //             WeightOfRecycledPlastic: null,
      //             PlasticPackageExemptionReason: null,
      //             SerialNumbers: [],
      //             BatchNumbers: []
      //         }
      //     ],
      //     ProductionOrdersSalesOrderLines: [],
      //     ProductionOrdersStages: [],
      //     ProductionOrdersDocumentReferences: []
      // }
      documentData = {
        Series: 23,
        ProductionOrderLines: [
          {
            ItemNo: "ASDW23123",
            ItemName: "Test Item 1",
            PlannedQuantity: 100,
            Warehouse: "01",
            ItemType: "pit_Item"
          }
        ],
      }

      if (documentData) {
        loadFromDocument(documentData);
        setValue("AbsoluteEntry", 155); // Placeholder for now to trigger read-only
      } else {
        toast.info(`Document number ${baseRef} not found.`);
      }
    } catch (error) {
      toast.error("An error occurred while fetching the document.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBOMs = async () => {
    setIsLoadingBoms(true);
    try {
      const data = await getBOMList();
      setBomList(data);
      setBomModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch BOM list");
    } finally {
      setIsLoadingBoms(false);
    }
  };

  const handleSelectBOM = (bom: any) => {
    setValue("ItemNo", bom.TreeCode, { shouldDirty: true });
    setValue("ProductDescription", bom.ProductDescription, { shouldDirty: true });

    const currentPlannedQty = watch("PlannedQuantity");
    const plannedQty = currentPlannedQty ? Number(currentPlannedQty) : 0;

    loadFromBOM(bom, plannedQty);
    setBomModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.headerFields.baseRef && (
          <div className="flex items-center gap-4">
            <Label className="w-24">Order Number</Label>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="text"
                {...register("BaseRef")}
                className="h-8"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    fetchDocument(searchValue);
                  }
                }}
                placeholder="Enter Order Number"
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
        )}

        {config.headerFields.reference && (
          <div className="flex items-center gap-4">
            <Label className="w-24">Reference</Label>
            <Input
              type="text"
              {...register("Ref2")}
              className="h-8 flex-1"
              placeholder="Enter Reference"
            />
          </div>
        )}

        {config.headerFields.docDate && (
          <div className="flex items-center gap-4">
            <Label className="w-24">Document Date</Label>
            <Input type="date" {...register("TaxDate")} className="h-8 flex-1" />
          </div>
        )}

        {config.headerFields.productNo && (
          <div className="flex items-center gap-4">
            <Label className="w-24">Product No.</Label>
            <div className="flex items-center gap-2 flex-1">
              <Input type="text" {...register("ItemNo")} className="h-8 flex-1" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={fetchBOMs}
              >
                {isLoadingBoms ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {config.headerFields.productDescription && (
          <div className="flex items-center gap-4">
            <Label className="w-24">Description</Label>
            <Input type="text" {...register("ProductDescription")} className="h-8 flex-1 bg-gray-100 text-gray-500 cursor-not-allowed" readOnly />
          </div>
        )}

        {config.headerFields.plannedQuantity && (
          <div className="flex items-center gap-4">
            <Label className="w-24">Planned Qty</Label>
            <Input type="number" {...register("PlannedQuantity")} className="h-8 flex-1" />
          </div>
        )}

        {config.headerFields.warehouse && (
          <div className="flex items-center gap-4">
            <Label className="w-24">Warehouse</Label>
            <Input type="hidden" {...register("Warehouse")} />
            <Select
              onValueChange={(val) => setValue("Warehouse", val, { shouldDirty: true })}
              value={watch("Warehouse") || warehouses[0]?.WhsCode || ""}
            >
              <SelectTrigger className="h-8 flex-1">
                <SelectValue>
                  {watch("Warehouse")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {warehouses.map((wh: Warehouse) => (
                    <SelectItem key={wh.WhsCode} value={wh.WhsCode}>
                      {wh.WhsName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}

        {config.headerFields.priority && (
          <div className="flex items-center gap-4">
            <Label className="w-24">Priority</Label>
            <Input type="number" {...register("Priority")} className="h-8 flex-1" />
          </div>
        )}

        {config.headerFields.orderDate && (
          <div className="flex items-center gap-4">
            <Label className="w-24">Order Date</Label>
            <Input type="date" {...register("CreationDate")} className="h-8 flex-1" />
          </div>
        )}

        {config.headerFields.startDate && (
          <div className="flex items-center gap-4">
            <Label className="w-24">Start Date</Label>
            <Input type="date" {...register("StartDate")} className="h-8 flex-1" />
          </div>
        )}

        {config.headerFields.dueDate && (
          <div className="flex items-center gap-4">
            <Label className="w-24">Due Date</Label>
            <Input type="date" {...register("DueDate")} className="h-8 flex-1" />
          </div>
        )}
      </div>

      <GenericModal
        title="Select Bill of Materials"
        open={bomModalOpen}
        onClose={() => setBomModalOpen(false)}
        onSelect={handleSelectBOM}
        data={bomList}
        columns={[
          { key: "TreeCode", label: "Item No" },
          { key: "ProductDescription", label: "Description" },
        ]}
        getSelectValue={(item) => item}
        isLoading={isLoadingBoms}
      />
    </div>
  );
}
