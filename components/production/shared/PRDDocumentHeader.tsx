import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppLabel } from "@/components/Custom/AppLabel";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { useIFPRDDocument } from "@/stores/production/useProductionDocument";
import { usePRDDocConfig } from "./PRDDocumentLayout";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getwarehouses } from "@/api+/sap/master-data/warehouses";
import { Warehouse } from "@/types/warehouse/warehouse";
import { GenericModal } from "@/modals/GenericModal";
import { getBOMList } from "@/api+/sap/production/productionService";
import { getItemsList } from "@/api+/sap/master-data/items";
import { Controller } from "react-hook-form";
import { ItemSelectorDialog } from "@/modals/ItemSelectorDialog";
import { Item } from "@/types/sales/Item.type";
import { ConfirmationModal } from "@/modals/ConfirmationModal";

const FormattedHeaderInput = ({ value, onChange, onBlur, placeholder, className, id }: any) => {
  const [localValue, setLocalValue] = useState(value ? value.toString() : "");

  useEffect(() => {
    if (document.activeElement !== document.getElementById(id)) {
      setLocalValue(value ? Number(value).toLocaleString() : "");
    }
  }, [value, id]);

  return (
    <Input
      id={id}
      type="text"
      className={className}
      value={localValue}
      onChange={(e) => {
        const val = e.target.value;
        setLocalValue(val);
        const numericVal = Number(val.replace(/,/g, ""));
        if (!isNaN(numericVal)) {
          onChange(numericVal);
        }
      }}
      onBlur={() => {
        onBlur();
        setLocalValue(value ? Number(value).toLocaleString() : "");
      }}
      placeholder={placeholder}
    />
  );
};

export function PRDDocumentHeader() {
  const {
    register,
    watch,
    setValue,
    control,
    getValues,
    formState: { errors },
  } = useFormContext();

  const [isLoading, setIsLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [bomModalOpen, setBomModalOpen] = useState(false);
  const [whsModalOpen, setWhsModalOpen] = useState(false);
  const [itemSelectorOpen, setItemSelectorOpen] = useState(false);
  const [showTypeConfirm, setShowTypeConfirm] = useState(false);
  const [pendingType, setPendingType] = useState<string | null>(null);

  const [dataList, setDataList] = useState<any[]>([]); // Renamed from bomList
  const [isLoadingItems, setIsLoadingItems] = useState(false); // Renamed from isLoadingBoms
  const { loadFromDocument, warehouses, setWarehouses, loadFromBOM, recalculateFromHeader, reset: resetStore, selectedBOM } = useIFPRDDocument();
  const config = usePRDDocConfig();
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

  const fetchItems = async () => {
    const type = watch("ProductionOrderType");
    if (type === "bopotSpecial") {
      setItemSelectorOpen(true);
      return;
    }

    setIsLoadingItems(true);
    try {
      const data = await getBOMList();
      setDataList(data);
      setBomModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleSelectItem = (item: any) => {
    const type = getValues("ProductionOrderType");
    if (type === "bopotSpecial") {
      setValue("ItemNo", item.ItemCode, { shouldDirty: true, shouldValidate: true });
      setValue("ProductDescription", item.ItemName || item.Dscription || "", { shouldDirty: true, shouldValidate: true });
      resetStore(); // Clear lines for special
    } else {
      setValue("ItemNo", item.TreeCode, { shouldDirty: true, shouldValidate: true });
      setValue("ProductDescription", item.ProductDescription, { shouldDirty: true, shouldValidate: true });

      const currentPlannedQty = watch("PlannedQuantity");
      const plannedQty = currentPlannedQty ? Number(currentPlannedQty) : 0;

      loadFromBOM(item, plannedQty);
    }
    setBomModalOpen(false);
  };

  const handleTypeChange = (newType: string) => {
    const currentItem = watch("ItemNo");
    if (currentItem) {
      setPendingType(newType);
      setShowTypeConfirm(true);
    } else {
      setValue("ProductionOrderType", newType, { shouldDirty: true });
    }
  };

  const confirmTypeChange = () => {
    if (!pendingType) return;
    setValue("ProductionOrderType", pendingType, { shouldDirty: true });

    if (pendingType === "bopotSpecial") {
      resetStore();
    } else if (selectedBOM) {
      const currentPlannedQty = watch("PlannedQuantity");
      loadFromBOM(selectedBOM, Number(currentPlannedQty || 0));
    }
    setShowTypeConfirm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {config.headerFields.baseRef && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Order Number</AppLabel>
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
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Reference</AppLabel>
            <Input
              type="text"
              {...register("Ref2")}
              className="h-8 flex-1"
              placeholder="Enter Reference"
            />
          </div>
        )}

        {config.headerFields.docDate && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Document Date</AppLabel>
            <Input type="date" {...register("TaxDate")} className="h-8 flex-1" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <AppLabel className="w-28 shrink-0">Type</AppLabel>
          <Select
            onValueChange={handleTypeChange}
            value={watch("ProductionOrderType") || "bopotStandard"}
          >
            <SelectTrigger className="h-8 flex-1">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bopotStandard">Standard</SelectItem>
              <SelectItem value="bopotSpecial">Special</SelectItem>
              <SelectItem value="bopotDisassembly">Disassembly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.headerFields.productNo && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Product No.</AppLabel>
            <div className="flex items-center gap-2 flex-1">
              <Input id="item-no-field" type="text" {...register("ItemNo")} className="h-8 flex-1 bg-gray-100 text-gray-500 cursor-not-allowed" readOnly />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={fetchItems}
              >
                {isLoadingItems ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {config.headerFields.productDescription && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Description</AppLabel>
            <Input type="text" {...register("ProductDescription")} className="h-8 flex-1 bg-gray-100 text-gray-500 cursor-not-allowed" readOnly />
          </div>
        )}

        {config.headerFields.plannedQuantity && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Planned Qty</AppLabel>
            <Controller
              name="PlannedQuantity"
              control={control}
              render={({ field: { value, onChange, onBlur } }) => (
                <FormattedHeaderInput
                  id="planned-qty-input"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                  className="h-8 flex-1"
                  placeholder="Enter Planned Qty"
                />
              )}
            />
          </div>
        )}

        {config.headerFields.warehouse && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Warehouse</AppLabel>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="text"
                {...register("Warehouse")}
                className="h-8 flex-1 bg-gray-100 text-gray-500 cursor-not-allowed"
                readOnly
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 cursor-pointer"
                onClick={() => setWhsModalOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {config.headerFields.priority && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Priority</AppLabel>
            <Input type="number" {...register("Priority")} className="h-8 flex-1" />
          </div>
        )}

        {config.headerFields.orderDate && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Order Date</AppLabel>
            <Input type="date" {...register("CreationDate")} className="h-8 flex-1" />
          </div>
        )}

        {config.headerFields.startDate && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Start Date</AppLabel>
            <Input type="date" {...register("StartDate")} className="h-8 flex-1" />
          </div>
        )}

        {config.headerFields.dueDate && (
          <div className="flex items-center gap-2">
            <AppLabel className="w-28 shrink-0">Due Date</AppLabel>
            <Input type="date" {...register("DueDate")} className="h-8 flex-1" />
          </div>
        )}
      </div>

      <GenericModal
        title="Select Warehouse"
        open={whsModalOpen}
        onClose={() => setWhsModalOpen(false)}
        onSelect={(wh: Warehouse) => {
          setValue("Warehouse", wh.WhsCode, { shouldDirty: true });
          setWhsModalOpen(false);
        }}
        data={warehouses}
        columns={[
          { key: "WhsCode", label: "Warehouse Code" },
          { key: "WhsName", label: "Warehouse Name" },
        ]}
        getSelectValue={(item) => item}
      />

      <GenericModal
        title={watch("ProductionOrderType") === "bopotSpecial" ? "Select Item" : "Select Bill of Materials"}
        open={bomModalOpen}
        onClose={() => setBomModalOpen(false)}
        onSelect={handleSelectItem}
        data={dataList}
        columns={
          watch("ProductionOrderType") === "bopotSpecial"
            ? [
              { key: "ItemCode", label: "Item No" },
              { key: "ItemName", label: "Description" },
            ]
            : [
              { key: "TreeCode", label: "Item No" },
              { key: "ProductDescription", label: "Description" },
            ]
        }
        getSelectValue={(item) => item}
        isLoading={isLoadingItems}
      />

      <ItemSelectorDialog
        open={itemSelectorOpen}
        multiple={false}
        onClose={() => setItemSelectorOpen(false)}
        onSelectItems={(items: Item[]) => {
          if (items.length > 0) {
            const item = items[0];
            setValue("ItemNo", item.itemCode, { shouldDirty: true, shouldValidate: true });
            setValue("ProductDescription", item.itemName || "", { shouldDirty: true, shouldValidate: true });
            resetStore();
          }
          setItemSelectorOpen(false);
        }}
      />

      <ConfirmationModal
        open={showTypeConfirm}
        onOpenChange={setShowTypeConfirm}
        title="Are you sure?"
        description={
          pendingType === "bopotSpecial"
            ? "Components will be deleted. Do you want to continue?"
            : "Components will be updated according to the production bom. Do you want to continue?"
        }
        onConfirm={confirmTypeChange}
        cancelText="No, keep lines"
        confirmText={pendingType === "bopotSpecial" ? "Yes, delete lines" : "Yes, update all"}
      />
    </div>
  );
}
